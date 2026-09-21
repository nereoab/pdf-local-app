import './worker-document-polyfill';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createSafeCanvas } from './worker-document-polyfill';

// Configuración de WorkerCanvasFactory para renderizado en OffscreenCanvas
class WorkerCanvasFactory {
  _createCanvas(width: number, height: number) {
    return createSafeCanvas(width, height);
  }
  create(width: number, height: number) {
    const canvas = this._createCanvas(width, height);
    const context = (canvas as any).getContext ? (canvas as any).getContext('2d') : null;
    return { canvas, context };
  }
  reset(canvasAndContext: any, width: number, height: number) {
    if (canvasAndContext?.canvas) {
      canvasAndContext.canvas.width = Math.max(1, Math.floor(width));
      canvasAndContext.canvas.height = Math.max(1, Math.floor(height));
    }
  }
  destroy(canvasAndContext: any) {
    if (canvasAndContext) {
      if (canvasAndContext.canvas) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
      }
      canvasAndContext.context = null;
    }
  }
}

// Configuración del worker de pdfjs en entorno Web Worker
const origin = typeof self !== 'undefined' && self.location ? self.location.origin : '';
if (typeof self !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = origin
    ? `${origin}/pdfjs/pdf.worker.min.mjs`
    : '/pdfjs/pdf.worker.min.mjs';
}

export type BlackWhiteMode = 'grayscale' | 'blackwhite';
export type QualityPreset = 'draft' | 'standard' | 'high';
export type PageScope = 'all' | 'even' | 'odd' | 'range';

export interface BlackWhiteWorkerOptions {
  mode: BlackWhiteMode;
  threshold: number; // 0 - 255 (por defecto 170)
  qualityPreset: QualityPreset;
  customScale?: number;
  jpegQuality?: number;
  pageScope: PageScope;
  pageRange?: string;
}

export interface BlackWhiteWorkerMessageIn {
  action: 'convert';
  arrayBuffer: ArrayBuffer;
  fileName: string;
  options: BlackWhiteWorkerOptions;
}

export type BlackWhiteWorkerMessageOut =
  | {
      type: 'progress';
      percent: number;
      message: string;
      currentPage?: number;
      totalPages?: number;
    }
  | {
      type: 'result';
      buffer: ArrayBuffer;
      originalSize: number;
      convertedSize: number;
      totalPages: number;
      pagesConverted: number;
      fileName: string;
    }
  | {
      type: 'error';
      message: string;
      fileName: string;
    };

export function parseTargetPages(totalPages: number, scope: PageScope, range?: string): number[] {
  if (scope === 'all') return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (scope === 'even')
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
  if (scope === 'odd')
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
  if (scope === 'range' && range?.trim()) {
    const selected = new Set<number>();
    const parts = range.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number);
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            if (i >= 1 && i <= totalPages) selected.add(i);
          }
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          selected.add(num);
        }
      }
    }
    const result = Array.from(selected).sort((a, b) => a - b);
    return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

export function getQualitySettings(
  preset: QualityPreset,
  customScale?: number,
  customJpegQuality?: number,
): {
  scale: number;
  jpegQuality: number;
} {
  if (customScale && customJpegQuality) {
    return { scale: customScale, jpegQuality: customJpegQuality };
  }
  switch (preset) {
    case 'draft':
      return { scale: 1.2, jpegQuality: 0.72 };
    case 'high':
      return { scale: 2.2, jpegQuality: 0.9 };
    case 'standard':
    default:
      return { scale: 1.6, jpegQuality: 0.84 };
  }
}

export function applyMonochromeFilter(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  mode: BlackWhiteMode,
  threshold: number,
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  if (mode === 'blackwhite') {
    for (let i = 0; i < len; i += 4) {
      // Fórmula estándar ITU-R BT.601 para luminancia percibida
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = gray < threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else {
    // Escala de grises continua (Grayscale)
    for (let i = 0; i < len; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

self.onmessage = async (e: MessageEvent<BlackWhiteWorkerMessageIn>) => {
  const { action, arrayBuffer, fileName, options } = e.data;

  if (action !== 'convert') return;

  const originalSize = arrayBuffer.byteLength;

  const postProgress = (
    percent: number,
    message: string,
    currentPage?: number,
    totalPages?: number,
  ) => {
    (self as unknown as Worker).postMessage({
      type: 'progress',
      percent,
      message,
      currentPage,
      totalPages,
    } as BlackWhiteWorkerMessageOut);
  };

  try {
    postProgress(5, 'Inicializando motor de renderizado y lectura del PDF...');

    // 1. Cargar el PDF original con PDF.js pasando ownerDocument y WorkerCanvasFactory
    const loadParams: any = {
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: false,
      disableFontFace: true,
      ownerDocument: (globalThis as any).document,
      cMapUrl: origin ? `${origin}/pdfjs/cmaps/` : '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: origin ? `${origin}/pdfjs/standard_fonts/` : '/pdfjs/standard_fonts/',
      wasmUrl: origin ? `${origin}/pdfjs/wasm/` : '/pdfjs/wasm/',
    };

    const pdfjsDoc = await pdfjsLib.getDocument(loadParams).promise;

    const totalPages = pdfjsDoc.numPages;
    if (totalPages === 0) {
      throw new Error('El archivo PDF no contiene páginas legibles.');
    }

    const targetPages = parseTargetPages(totalPages, options.pageScope, options.pageRange);
    const { scale, jpegQuality } = getQualitySettings(
      options.qualityPreset,
      options.customScale,
      options.jpegQuality,
    );

    postProgress(
      10,
      `Procesando ${targetPages.length} páginas a ${options.mode === 'blackwhite' ? 'Blanco y Negro puro' : 'Escala de Grises'}...`,
    );

    // 2. Crear el PDF de salida con pdf-lib
    const outputPdf = await PDFDocument.create();
    const canvasFactory = new WorkerCanvasFactory();

    // 3. Procesar cada página con OffscreenCanvas
    for (let idx = 0; idx < targetPages.length; idx++) {
      const pageNum = targetPages[idx];
      const percent = 10 + Math.floor(((idx + 1) / targetPages.length) * 80);

      postProgress(
        percent,
        `Procesando página ${idx + 1} de ${targetPages.length} (Pág. ${pageNum})...`,
        idx + 1,
        targetPages.length,
      );

      const page = await pdfjsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const origViewport = page.getViewport({ scale: 1.0 });

      const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        throw new Error(`No se pudo obtener el contexto 2D para la página ${pageNum}.`);
      }

      // Renderizar la página en el canvas usando WorkerCanvasFactory para evitar excepciones en Web Worker
      await page.render({
        canvasContext: ctx as any,
        viewport,
        canvasFactory,
      } as any).promise;

      // Aplicar filtro de luminancia (Grayscale o Binarizado Puro B&W)
      applyMonochromeFilter(
        ctx,
        canvas.width,
        canvas.height,
        options.mode,
        options.threshold ?? 170,
      );

      // Convertir a JPEG optimizado
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: jpegQuality,
      });
      const imgBytes = await blob.arrayBuffer();

      // Incrustar en el documento PDF de salida con las dimensiones vectoriales originales
      const embeddedImg = await outputPdf.embedJpg(imgBytes);
      const newPage = outputPdf.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });

      // Liberar recursos
      page.cleanup();
    }

    postProgress(94, 'Generando archivo PDF monocromático final...');

    // Asignar metadatos limpios
    outputPdf.setProducer('PDFBlack Monochrome Engine (Client-Side)');
    outputPdf.setCreator('PDFBlack.com');

    const outputPdfBytes = await outputPdf.save();
    const rawBuf = outputPdfBytes.buffer;
    let convertedBuffer: ArrayBuffer;

    if (typeof SharedArrayBuffer !== 'undefined' && rawBuf instanceof SharedArrayBuffer) {
      const copy = new ArrayBuffer(outputPdfBytes.byteLength);
      new Uint8Array(copy).set(
        new Uint8Array(rawBuf, outputPdfBytes.byteOffset, outputPdfBytes.byteLength),
      );
      convertedBuffer = copy;
    } else {
      convertedBuffer = (rawBuf as ArrayBuffer).slice(
        outputPdfBytes.byteOffset,
        outputPdfBytes.byteOffset + outputPdfBytes.byteLength,
      );
    }

    postProgress(100, 'Conversión a Blanco y Negro completada con éxito.');

    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: convertedBuffer,
        originalSize,
        convertedSize: convertedBuffer.byteLength,
        totalPages,
        pagesConverted: targetPages.length,
        fileName,
      } as BlackWhiteWorkerMessageOut,
      [convertedBuffer],
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Error inesperado durante la conversión a blanco y negro.';
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: errorMsg,
      fileName,
    } as BlackWhiteWorkerMessageOut);
  }
};
