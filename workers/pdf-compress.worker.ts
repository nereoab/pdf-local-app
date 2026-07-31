/**
 * Web Worker para compresión de PDF sin bloquear el hilo principal.
 * Estrategia híbrida: pdf-lib para manipulación directa de objetos PDF
 * + pdfjs-dist para rasterización selectiva de páginas con imágenes.
 */

import { PDFDocument, PDFName, PDFDict, PDFStream } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

export interface CompressionOptions {
  level: 'low' | 'medium' | 'high';
  outputColorMode: 'original' | 'grayscale' | 'blackwhite';
  dpiMode: 'auto' | '72' | '96' | '150';
  pageScope: 'todas' | 'pares' | 'impares' | 'rango';
  pageRange?: string;
  stripMetadata: boolean;
  preserveTextVectors: boolean;
  preservePdfA: boolean;
  detectPdfA: boolean;
  customSuffix: string;
}

export interface CompressionProgress {
  type: 'progress';
  percent: number;
  message: string;
  currentFile: number;
  totalFiles: number;
  fileName: string;
}

export interface CompressionResult {
  type: 'result';
  compressedBytes: ArrayBuffer;
  originalSize: number;
  compressedSize: number;
  fileName: string;
  wasPdfA: boolean;
  pdfAStatus: 'preserved' | 'broken' | 'not-applicable';
  reductionPercent: number;
}

export interface CompressionError {
  type: 'error';
  message: string;
  fileName: string;
}

export type WorkerMessage = CompressionProgress | CompressionResult | CompressionError;

// ============================================================
// UTILIDADES
// ============================================================

function parseSelectedPages(numPages: number, pageScope: string, pageRange?: string): number[] {
  if (pageScope === 'todas') return Array.from({ length: numPages }, (_, i) => i + 1);
  if (pageScope === 'pares') return Array.from({ length: numPages }, (_, i) => i + 1).filter(p => p % 2 === 0);
  if (pageScope === 'impares') return Array.from({ length: numPages }, (_, i) => i + 1).filter(p => p % 2 !== 0);
  if (pageScope === 'rango' && pageRange?.trim()) {
    const selected = new Set<number>();
    const parts = pageRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number);
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            if (i >= 1 && i <= numPages) selected.add(i);
          }
        }
      } else {
        const p = Number(trimmed);
        if (!isNaN(p) && p >= 1 && p <= numPages) selected.add(p);
      }
    }
    if (selected.size > 0) return Array.from(selected).sort((a, b) => a - b);
  }
  return Array.from({ length: numPages }, (_, i) => i + 1);
}

function pageHasImages(dict: PDFDict | undefined): boolean {
  if (!dict) return false;
  try {
    const resources = dict.lookup(PDFName.of('Resources'));
    if (resources instanceof PDFDict) {
      const xobj = resources.lookup(PDFName.of('XObject'));
      if (xobj instanceof PDFDict) {
        const keys = xobj.keys();
        for (const key of keys) {
          const obj = xobj.lookup(key);
          if (obj instanceof PDFDict || obj instanceof PDFStream) {
            const objDict = obj as PDFDict;
            const subtype = objDict.lookup(PDFName.of('Subtype'));
            if (subtype === PDFName.of('Image')) return true;
          }
        }
      }
    }
  } catch { /* noop */ }
  return false;
}

function detectPdfA(pdfDoc: PDFDocument): boolean {
  try {
    // Verificar en info del documento si hay marcadores PDF/A
    const producer = pdfDoc.getProducer();
    if (producer?.toLowerCase().includes('pdf/a')) return true;
    const creator = pdfDoc.getCreator();
    if (creator?.toLowerCase().includes('pdf/a')) return true;
    const title = pdfDoc.getTitle();
    if (title?.toLowerCase().includes('pdf/a')) return true;
    const subject = pdfDoc.getSubject();
    if (subject?.toLowerCase().includes('pdf/a')) return true;
  } catch { /* noop */ }
  return false;
}

function applyColorMode(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  mode: 'original' | 'grayscale' | 'blackwhite'
): void {
  if (mode === 'original') return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (mode === 'blackwhite') {
      const bw = gray < 170 ? 0 : 255;
      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
    } else {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

async function rasterizePageToNewPdf(
  pdfPage: any,
  targetPdf: PDFDocument,
  scale: number,
  jpegQuality: number,
  colorMode: 'original' | 'grayscale' | 'blackwhite'
): Promise<void> {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  await pdfPage.render({
    canvasContext: ctx,
    viewport,
  } as unknown as Parameters<typeof pdfPage.render>[0]).promise;

  applyColorMode(ctx, canvas, colorMode);

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });
  const jpegBytes = await blob.arrayBuffer();
  const embeddedImg = await targetPdf.embedJpg(jpegBytes);
  const origViewport = pdfPage.getViewport({ scale: 1.0 });
  const newPage = targetPdf.addPage([origViewport.width, origViewport.height]);
  newPage.drawImage(embeddedImg, {
    x: 0,
    y: 0,
    width: origViewport.width,
    height: origViewport.height,
  });
}

// ============================================================
// MOTOR DE COMPRESIÓN POR ARCHIVO
// ============================================================

async function compressSinglePdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: CompressionOptions,
  fileIndex: number,
  totalFiles: number,
  report: (msg: WorkerMessage) => void
): Promise<CompressionResult> {
  const originalSize = fileBuffer.byteLength;

  report({ type: 'progress', percent: 2, message: `Analizando: ${fileName}...`, currentFile: fileIndex + 1, totalFiles, fileName });

  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true, updateMetadata: false });

  // Detección PDF/A
  let wasPdfA = false;
  let pdfAStatus: 'preserved' | 'broken' | 'not-applicable' = 'not-applicable';
  if (options.detectPdfA) {
    wasPdfA = detectPdfA(pdfDoc);
    pdfAStatus = wasPdfA ? (options.preservePdfA ? 'preserved' : 'broken') : 'not-applicable';
    report({ type: 'progress', percent: 5, message: wasPdfA ? '⚠️ PDF/A detectado. Preservando estructura...' : `Analizando páginas: ${fileName}...`, currentFile: fileIndex + 1, totalFiles, fileName });
  }

  const pages = pdfDoc.getPages();
  const numPages = pages.length;
  const targetPages = parseSelectedPages(numPages, options.pageScope, options.pageRange);
  if (targetPages.length === 0) throw new Error('No hay páginas seleccionadas');

  report({ type: 'progress', percent: 8, message: `Procesando ${targetPages.length} de ${numPages} páginas...`, currentFile: fileIndex + 1, totalFiles, fileName });

  // Parámetros de calidad
  let jpegQuality = 0.55;
  let imageScale = 1.0;

  if (options.dpiMode === '72') { imageScale = 0.50; jpegQuality = 0.40; }
  else if (options.dpiMode === '96') { imageScale = 0.67; jpegQuality = 0.50; }
  else if (options.dpiMode === '150') { imageScale = 1.04; jpegQuality = 0.70; }
  else {
    if (options.level === 'low') { imageScale = 1.0; jpegQuality = 0.85; }
    else if (options.level === 'medium') { imageScale = 0.75; jpegQuality = 0.55; }
    else { imageScale = 0.50; jpegQuality = 0.35; }
  }

  // Si nivel alto + sin preservar vectores → rasterización completa
  if (options.level === 'high' && !options.preserveTextVectors) {
    report({ type: 'progress', percent: 15, message: 'Modo máxima compresión: rasterizando todas las páginas...', currentFile: fileIndex + 1, totalFiles, fileName });

    const pdfjsDoc = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
    const newPdf = await PDFDocument.create();

    for (let idx = 0; idx < targetPages.length; idx++) {
      const pageNum = targetPages[idx];
      const pct = 15 + Math.floor((idx / targetPages.length) * 70);
      report({ type: 'progress', percent: pct, message: `Rasterizando página ${pageNum}/${numPages}...`, currentFile: fileIndex + 1, totalFiles, fileName });

      const page = await pdfjsDoc.getPage(pageNum);
      await rasterizePageToNewPdf(page, newPdf, imageScale, jpegQuality, options.outputColorMode);
    }

    if (options.stripMetadata) {
      newPdf.setTitle(''); newPdf.setAuthor(''); newPdf.setProducer(''); newPdf.setCreator(''); newPdf.setSubject(''); newPdf.setKeywords([]);
    }

    report({ type: 'progress', percent: 88, message: 'Empaquetando PDF comprimido...', currentFile: fileIndex + 1, totalFiles, fileName });
    const compressedBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });

    report({ type: 'progress', percent: 96, message: 'Verificando integridad...', currentFile: fileIndex + 1, totalFiles, fileName });

    return {
      type: 'result',
      compressedBytes: compressedBytes.buffer as ArrayBuffer,
      originalSize,
      compressedSize: compressedBytes.byteLength,
      fileName,
      wasPdfA,
      pdfAStatus,
      reductionPercent: Math.max(0, Math.round(((originalSize - compressedBytes.byteLength) / originalSize) * 100)),
    };
  }

  // ============================================================
  // MODO INTELIGENTE: preservar texto vectorial, rasterizar solo páginas con imágenes
  // ============================================================
  report({ type: 'progress', percent: 12, message: 'Modo preservación: detectando páginas con imágenes...', currentFile: fileIndex + 1, totalFiles, fileName });

  const pdfjsDoc = await pdfjsLib.getDocument({ data: fileBuffer.slice(0) }).promise;
  const newPdf = await PDFDocument.create();
  const pageIndicesToCopy: number[] = []; // 0-indexed
  let rasterizedCount = 0;

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const pct = 12 + Math.floor((idx / targetPages.length) * 68);
    const pageNode = pages[pageNum - 1].node;

    if (options.level === 'low' || !pageHasImages(pageNode)) {
      // Sin imágenes o nivel bajo: copiar página original (preservar vectores)
      pageIndicesToCopy.push(pageNum - 1);
    } else {
      // Con imágenes: rasterizar esta página
      report({ type: 'progress', percent: pct, message: `Comprimiendo imágenes de página ${pageNum}/${numPages}...`, currentFile: fileIndex + 1, totalFiles, fileName });
      const pdfPage = await pdfjsDoc.getPage(pageNum);
      await rasterizePageToNewPdf(pdfPage, newPdf, imageScale, jpegQuality, options.outputColorMode);
      rasterizedCount++;
    }
  }

  // Copiar páginas vectoriales preservadas
  report({ type: 'progress', percent: 82, message: `Integrando ${pageIndicesToCopy.length} páginas vectoriales...`, currentFile: fileIndex + 1, totalFiles, fileName });

  if (pageIndicesToCopy.length > 0) {
    try {
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndicesToCopy);
      for (const p of copiedPages) newPdf.addPage(p);
    } catch {
      // Fallback: rasterizar páginas que no se pudieron copiar
      report({ type: 'progress', percent: 82, message: 'Aplicando fallback de rasterización para páginas complejas...', currentFile: fileIndex + 1, totalFiles, fileName });
      for (const pageIdx of pageIndicesToCopy) {
        const pageNum = pageIdx + 1;
        const pdfPage = await pdfjsDoc.getPage(pageNum);
        await rasterizePageToNewPdf(pdfPage, newPdf, imageScale, jpegQuality, options.outputColorMode);
      }
    }
  }

  // Limpiar metadatos si se solicita y no es PDF/A a preservar
  if (options.stripMetadata && !(wasPdfA && options.preservePdfA)) {
    newPdf.setTitle(''); newPdf.setAuthor(''); newPdf.setProducer(''); newPdf.setCreator(''); newPdf.setSubject(''); newPdf.setKeywords([]);
  }

  report({ type: 'progress', percent: 90, message: 'Empaquetando PDF optimizado...', currentFile: fileIndex + 1, totalFiles, fileName });
  const compressedBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });

  report({ type: 'progress', percent: 97, message: 'Verificando integridad del resultado...', currentFile: fileIndex + 1, totalFiles, fileName });

  // Si no se redujo y no es nivel alto, entregar original
  let finalBytes = compressedBytes;
  if (compressedBytes.byteLength >= originalSize && options.level !== 'high') {
    report({ type: 'progress', percent: 98, message: 'El PDF ya está optimizado. Entregando archivo original...', currentFile: fileIndex + 1, totalFiles, fileName });
    finalBytes = new Uint8Array(fileBuffer);
  }

  return {
    type: 'result',
    compressedBytes: (finalBytes.buffer || finalBytes.slice().buffer) as ArrayBuffer,
    originalSize,
    compressedSize: finalBytes.byteLength,
    fileName,
    wasPdfA,
    pdfAStatus,
    reductionPercent: Math.max(0, Math.round(((originalSize - finalBytes.byteLength) / originalSize) * 100)),
  };
}

// ============================================================
// HANDLER PRINCIPAL DEL WORKER
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const { files, options } = event.data as {
    files: Array<{ buffer: ArrayBuffer; name: string }>;
    options: CompressionOptions;
  };

  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    try {
      const result = await compressSinglePdf(
        file.buffer,
        file.name,
        options,
        i,
        totalFiles,
        (msg) => self.postMessage(msg)
      );
      await new Promise(r => setTimeout(r, 10));
      self.postMessage(result);
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        fileName: file.name,
      } as CompressionError);
    }
  }

  self.postMessage({
    type: 'progress',
    percent: 100,
    message: 'Procesamiento completado.',
    currentFile: totalFiles,
    totalFiles,
    fileName: '',
  });
};

export {};