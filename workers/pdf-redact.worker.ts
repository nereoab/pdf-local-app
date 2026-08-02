/**
 * @deprecated Usar pdf-redact-v3.worker.ts en su lugar.
 * Este worker queda como fallback legacy (modo rasterizado JPEG).
 * El worker v3.0 implementa edición quirúrgica de content streams
 * que preserva texto no censurado, bookmarks, fuentes y anotaciones.
 * 
 * Web Worker para CENSURA DESTRUCTIVA (True Redaction) de PDFs (v2.0 LEGACY).
 * 
 * ESTRATEGIA:
 * pdf-lib NO puede eliminar selectivamente operadores de texto de content streams.
 * Por lo tanto, la única forma de garantizar destrucción total del contenido subyacente
 * es rasterizar CADA página aplicando los parches de censura como rectángulos opacos,
 * y luego empaquetar todo como un nuevo PDF de imágenes planas.
 * 
 * Esto destruye permanentemente: texto vectorial, fuentes, capas, anotaciones,
 * imágenes originales, y metadatos. El PDF resultante es una secuencia de imágenes
 * JPEG de alta resolución con los parches de censura incrustados de forma irreversible.
 */

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

// ============================================================
// INTERFACES
// ============================================================

export interface RedactionBox {
  id: string;
  page: number;
  word?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface RedactOptions {
  redactions: RedactionBox[];
  redactionColor: 'black' | 'gray';
  stripMetadata: boolean;
  customSuffix: string;
}

export interface RedactProgress {
  type: 'progress';
  phase: 'analyzing' | 'rasterizing' | 'packaging';
  percent: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
}

export interface RedactResult {
  type: 'result';
  redactedBytes: ArrayBuffer;
  fileName: string;
  pageCount: number;
  totalRedactions: number;
  pagesWithRedactions: number;
}

export interface RedactError {
  type: 'error';
  message: string;
  fileName: string;
}

export type WorkerMessage = RedactProgress | RedactResult | RedactError;

// ============================================================
// CENSURA DESTRUCTIVA DE UN PDF
// ============================================================

async function redactPdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: RedactOptions,
  report: (msg: WorkerMessage) => void
): Promise<RedactResult> {

  report({ type: 'progress', phase: 'analyzing', percent: 5, message: 'Analizando estructura del documento...' });

  // Cargar PDF original con pdf.js para acceso a páginas
  const srcDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0) as ArrayBuffer),
    stopAtErrors: false,
  }).promise;

  const totalPages = srcDoc.numPages;
  const redactionsByPage = new Map<number, RedactionBox[]>();

  for (const r of options.redactions) {
    if (!redactionsByPage.has(r.page)) {
      redactionsByPage.set(r.page, []);
    }
    redactionsByPage.get(r.page)!.push(r);
  }

  const pagesWithRedactions = redactionsByPage.size;
  const totalRedactions = options.redactions.length;

  report({
    type: 'progress',
    phase: 'analyzing',
    percent: 10,
    message: `${totalRedactions} parches de censura en ${pagesWithRedactions} páginas. Iniciando rasterización destructiva...`,
    totalPages,
  });

  // Crear nuevo PDF de salida
  const outPdf = await PDFDocument.create();

  // Procesar cada página
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pct = 10 + Math.floor((pageNum / totalPages) * 75);
    report({
      type: 'progress',
      phase: 'rasterizing',
      percent: pct,
      message: `Procesando página ${pageNum} de ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
    });

    const page = await srcDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Alta resolución para preservar legibilidad

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(`No se pudo crear contexto de renderizado para la página ${pageNum}`);
    }

    // Renderizar página original
    await page.render({
      canvasContext: ctx,
      viewport,
    } as unknown as Parameters<typeof page.render>[0]).promise;

    // Aplicar parches de censura como rectángulos opacos SOBRE el renderizado
    const pageRedactions = redactionsByPage.get(pageNum) || [];
    const boxColor = options.redactionColor === 'gray' ? '#404040' : '#000000';

    for (const box of pageRedactions) {
      const rx = (box.xPercent / 100) * viewport.width;
      const ry = (box.yPercent / 100) * viewport.height;
      const rw = (box.widthPercent / 100) * viewport.width;
      const rh = (box.heightPercent / 100) * viewport.height;

      // Dibujar rectángulo opaco (negro o gris) — esto DESTRUYE el contenido subyacente
      ctx.fillStyle = boxColor;
      ctx.fillRect(rx, ry, rw, rh);
    }

    // Convertir página renderizada + censurada a JPEG
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    const jpegBytes = await blob.arrayBuffer();

    // Embeber JPEG en nuevo PDF
    const embeddedImg = await outPdf.embedJpg(jpegBytes);
    const origViewport = page.getViewport({ scale: 1.0 });
    const newPage = outPdf.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  report({ type: 'progress', phase: 'packaging', percent: 90, message: 'Empaquetando PDF censurado y sanitizando metadatos...' });

  // Sanitizar metadatos
  outPdf.setTitle('');
  outPdf.setAuthor('');
  outPdf.setSubject('');
  outPdf.setKeywords([]);
  outPdf.setProducer('PDFBlack TrueRedact Engine v3.0');
  outPdf.setCreator('PDFBlack Local Redaction Worker');

  // Guardar PDF final
  const pdfBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });

  report({ type: 'progress', phase: 'packaging', percent: 100, message: 'Censura destructiva completada.' });

  return {
    type: 'result',
    redactedBytes: pdfBytes.buffer.slice(0) as ArrayBuffer,
    fileName,
    pageCount: totalPages,
    totalRedactions,
    pagesWithRedactions,
  };
}

// ============================================================
// HANDLER PRINCIPAL DEL WORKER
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const { fileBuffer, fileName, options } = event.data as {
    fileBuffer: ArrayBuffer;
    fileName: string;
    options: RedactOptions;
  };

  try {
    const result = await redactPdf(fileBuffer, fileName, options, (msg) => self.postMessage(msg));
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: `Error de censura: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      fileName,
    } as RedactError);
  }
};

export {};