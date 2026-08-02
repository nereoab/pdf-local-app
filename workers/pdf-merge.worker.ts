/**
 * Web Worker para fusión y procesamiento asíncrono de documentos PDF.
 * 
 * Ventajas:
 * 1. Procesa archivos pesados en un hilo secundario evitando bloquear el hilo principal (UI).
 * 2. Emite progreso en tiempo real (porcentaje y mensajes).
 * 3. Utiliza Transferable Objects para paso de ArrayBuffers con cero copia en memoria.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

export type PageOrientation = 'original' | 'portrait' | 'landscape';
export type PageSizeOption = 'original' | 'a4' | 'letter';
export type SeparatorOption = 'none' | 'blank' | 'title_page';

export interface PageDetailPayload {
  pageIndex: number;
  rotation: number; // e.g. 0, 90, 180, 270
  included: boolean;
}

export interface MergeFileItem {
  id: string;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
  pageRange: string;
  password?: string;
  pagesDetail?: PageDetailPayload[];
}

export interface MergeMetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

export interface MergeOptions {
  orientation: PageOrientation;
  pageSize: PageSizeOption;
  separatorMode: SeparatorOption;
  addPageNumbers: boolean;
  duplexMode: boolean;
  metadata?: MergeMetadataOptions;
}

export interface MergeProgress {
  type: 'progress';
  percent: number;
  message: string;
}

export interface MergeResult {
  type: 'result';
  mergedBytes: ArrayBuffer;
  totalPages: number;
}

export interface MergeError {
  type: 'error';
  message: string;
}

export interface AnalyzeResult {
  type: 'analyze_result';
  id: string;
  name: string;
  pageCount: number;
  thumbnailUrl?: string;
}

export type WorkerMessageOut = MergeProgress | MergeResult | MergeError | AnalyzeResult;

export interface AnalyzeRequest {
  action: 'analyze';
  id: string;
  name: string;
  arrayBuffer: ArrayBuffer;
}

export interface MergeRequest {
  action: 'merge';
  files: MergeFileItem[];
  options: MergeOptions;
}

export type WorkerMessageIn = AnalyzeRequest | MergeRequest;

function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices: Set<number> = new Set();
  const parts = rangeStr.split(',');

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let i = start; i <= end; i++) {
        indices.add(i - 1);
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        indices.add(p - 1);
      }
    }
  });

  return Array.from(indices).sort((a, b) => a - b);
}

async function generateThumbnail(arrayBuffer: ArrayBuffer): Promise<string | undefined> {
  try {
    const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
    const page = await pdfjsDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.3 });

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      if (context) {
        await (page.render({ canvasContext: context as any, canvas: canvas as any, viewport } as any)).promise;
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined as any);
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (e) {
    console.warn('[pdf-merge.worker] Could not generate thumbnail in worker:', e);
  }
  return undefined;
}

async function handleAnalyze(data: AnalyzeRequest) {
  try {
    const bufferCopy = data.arrayBuffer.slice(0);
    const pdfDoc = await PDFDocument.load(bufferCopy, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    const thumbnailUrl = await generateThumbnail(data.arrayBuffer);

    const resultMsg: AnalyzeResult = {
      type: 'analyze_result',
      id: data.id,
      name: data.name,
      pageCount,
      thumbnailUrl
    };
    self.postMessage(resultMsg);
  } catch (err: any) {
    const errorMsg: MergeError = {
      type: 'error',
      message: `Error al analizar ${data.name}: ${err?.message || 'Error desconocido'}`
    };
    self.postMessage(errorMsg);
  }
}

async function handleMerge(data: MergeRequest) {
  const { files, options } = data;
  try {
    self.postMessage({
      type: 'progress',
      percent: 10,
      message: 'Iniciando creación de documento unificado en Web Worker...'
    } as MergeProgress);

    const mergedPdf = await PDFDocument.create();
    const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const item = files[i];
      const progressPercent = 10 + Math.floor(((i + 1) / totalFiles) * 75);
      
      self.postMessage({
        type: 'progress',
        percent: progressPercent,
        message: `Procesando ${item.name} (${i + 1}/${totalFiles})...`
      } as MergeProgress);

      // 1. CARÁTULA O SEPARADOR EN BLANCO
      if (options.separatorMode === 'title_page') {
        const sepPage = mergedPdf.addPage([595.28, 841.89]);
        sepPage.drawText(`DOCUMENTO ${i + 1}`, {
          x: 50,
          y: 750,
          size: 12,
          font: helveticaBold,
          color: rgb(0.6, 0.4, 1.0)
        });
        sepPage.drawText(item.name, {
          x: 50,
          y: 710,
          size: 20,
          font: helveticaBold,
          color: rgb(1, 1, 1)
        });
        sepPage.drawText(`${item.pageCount} páginas en documento original`, {
          x: 50,
          y: 680,
          size: 11,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.7)
        });
      } else if (options.separatorMode === 'blank' && i > 0) {
        mergedPdf.addPage([595.28, 841.89]);
      }

      // 2. COPIA DE PÁGINAS DEL ARCHIVO
      const loadOptions: any = { ignoreEncryption: true };
      if (item.password) {
        loadOptions.password = item.password;
      }
      const pdfDoc = await PDFDocument.load(item.arrayBuffer.slice(0), loadOptions);
      const total = pdfDoc.getPageCount();

      let pagesToCopy: { pageIndex: number; customRotation: number }[] = [];

      if (item.pagesDetail && item.pagesDetail.length > 0) {
        pagesToCopy = item.pagesDetail
          .filter(p => p.included && p.pageIndex >= 0 && p.pageIndex < total)
          .map(p => ({ pageIndex: p.pageIndex, customRotation: p.rotation || 0 }));
      } else {
        const indices = parsePageRange(item.pageRange, total);
        pagesToCopy = indices.map(idx => ({ pageIndex: idx, customRotation: 0 }));
      }

      if (pagesToCopy.length === 0) continue;

      const indicesOnly = pagesToCopy.map(p => p.pageIndex);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, indicesOnly);

      copiedPages.forEach((page, idx) => {
        const customRot = pagesToCopy[idx]?.customRotation || 0;
        const currentRot = page.getRotation().angle;
        const finalRot = (currentRot + customRot) % 360;

        if (options.orientation === 'portrait') {
          page.setRotation(degrees(0));
        } else if (options.orientation === 'landscape') {
          page.setRotation(degrees(90));
        } else if (customRot !== 0) {
          page.setRotation(degrees(finalRot));
        }

        if (options.pageSize === 'a4') {
          page.setSize(595.28, 841.89);
        } else if (options.pageSize === 'letter') {
          page.setSize(612, 792);
        }

        mergedPdf.addPage(page);
      });

      if (options.duplexMode && (pagesToCopy.length % 2 !== 0)) {
        mergedPdf.addPage([595.28, 841.89]);
      }
    }

    // 3. NUMERACIÓN CONTINUA
    if (options.addPageNumbers) {
      const pages = mergedPdf.getPages();
      const totalNumPages = pages.length;
      pages.forEach((p, idx) => {
        const { width } = p.getSize();
        p.drawText(`${idx + 1} / ${totalNumPages}`, {
          x: width / 2 - 15,
          y: 18,
          size: 9,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      });
    }

    // 4. METADATOS OPCIONALES
    if (options.metadata) {
      if (options.metadata.title) mergedPdf.setTitle(options.metadata.title);
      if (options.metadata.author) mergedPdf.setAuthor(options.metadata.author);
      if (options.metadata.subject) mergedPdf.setSubject(options.metadata.subject);
      if (options.metadata.keywords) mergedPdf.setKeywords([options.metadata.keywords]);
    }

    self.postMessage({
      type: 'progress',
      percent: 95,
      message: 'Compilando y optimizando bytes del PDF unificado...'
    } as MergeProgress);

    const mergedBytes = await mergedPdf.save();
    const bufferResult = mergedBytes.buffer as ArrayBuffer;

    const resultMessage: MergeResult = {
      type: 'result',
      mergedBytes: bufferResult,
      totalPages: mergedPdf.getPageCount()
    };

    // Transferir el ArrayBuffer de vuelta al hilo principal sin copiar
    (self as any).postMessage(resultMessage, [bufferResult]);
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      message: error?.message || 'Error durante la unión de archivos en Web Worker'
    } as MergeError);
  }
}

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  const data = e.data;
  if (!data) return;

  if (data.action === 'analyze') {
    await handleAnalyze(data);
  } else if (data.action === 'merge') {
    await handleMerge(data);
  }
};
