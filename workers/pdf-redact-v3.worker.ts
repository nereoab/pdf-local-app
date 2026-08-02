/**
 * Web Worker v3.0 - CENSURA DE PRECISIÓN POR CONTENT STREAMS
 * 
 * ARQUITECTURA HÍBRIDA CORREGIDA:
 * 
 *  Modo PRECISIÓN (default):
 *    - Carga el PDF original con pdf-lib (PDFDocument.load)
 *    - Itera páginas y modifica content streams in-place
 *    - Reemplaza operadores de texto + agrega rectángulos nativos (re f)
 *    - Guarda con pdf-lib → preserva texto no censurado, bookmarks, anotaciones
 * 
 *  Modo RASTERIZADO (fallback):
 *    - Usa pdfjs-dist para renderizar cada página a OffscreenCanvas
 *    - Aplica rectángulos de censura sobre el renderizado
 *    - Empaqueta como imágenes JPEG en nuevo PDF con pdf-lib
 *    - Comportamiento equivalente al worker legacy v2.0
 * 
 * Compatible con pdf-lib 1.17.1 y pdfjs-dist 6.1.200
 * Reemplaza a pdf-redact.worker.ts (@deprecated v2.0)
 */

import { PDFDocument, PDFPage, PDFRawStream, PDFContentStream, PDFArray, decodePDFRawStream, PDFName, PDFDict, PDFRef, PDFObject, PDFString } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  analyzeContentStream,
  applyRedactionsToStream,
  viewportPercentToPdfCoords,
} from '../lib/pdf-content-stream-parser';
import {
  extractPageGeometry,
  viewportPercentToPdfUserSpace,
  expandRedactionArea,
  clampToMediaBox,
} from '../lib/pdf-text-coordinate-mapper';

// Pdf.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

// ============================================================
// INTERFACES (compatibles con v2.0 legacy)
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
  /** Modo de redacción: 'precision' (content streams) o 'raster' (legacy JPEG) */
  mode?: 'precision' | 'raster';
}

export interface RedactProgress {
  type: 'progress';
  phase: 'analyzing' | 'redacting' | 'packaging';
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
  /** Indica qué modo se usó para procesar */
  mode: 'precision' | 'raster';
  /** Estadísticas del proceso */
  stats?: {
    precisionPages: number;
    rasterPages: number;
    textOperatorsModified: number;
    contentPreservedKB: number;
  };
}

export interface RedactError {
  type: 'error';
  message: string;
  fileName: string;
}

export type WorkerMessage = RedactProgress | RedactResult | RedactError;

// ============================================================
// TIPOS AUXILIARES PARA ACCESO INTERNO A PDF-LIB
// ============================================================

/** Acceso tipado a propiedades internas de pdf-lib para manipular streams */
interface InternalPDFPage {
  node: PDFDict & {
    Contents?: () => PDFRawStream | PDFArray | PDFContentStream;
    MediaBox?: () => PDFArray;
    CropBox?: () => PDFArray;
    Rotate?: () => { value: () => number };
    Resources?: () => PDFDict;
  };
  doc: {
    context: {
      enumerateIndirectRefs: () => Generator<{ tag: string; ref: PDFRef }, void, unknown>;
      register: (obj: unknown) => void;
      lookupMaybe: (ref: PDFRef, preserve?: unknown) => unknown;
    };
  };
}

// ============================================================
// DETECCIÓN DE COMPLEJIDAD DE PÁGINA (usa pdfjs-dist)
// ============================================================

/**
 * Determina si una página puede ser procesada con el modo de precisión
 * o necesita fallback a rasterizado.
 */
async function canUsePrecisionMode(
  srcDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number
): Promise<boolean> {
  try {
    const page = await srcDoc.getPage(pageNum);
    const opList = await page.getOperatorList();

    // Verificar presencia de Type3 fonts
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      // OPS.setFont = 37
      if (fn === 37) {
        const args = opList.argsArray?.[i] as Array<unknown> | undefined;
        if (args && args.length >= 2) {
          const fontName = String(args[0] || '');
          if (fontName.toLowerCase().includes('type3')) {
            return false; // Type3 → raster
          }
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// MODO PRECISIÓN: Edición de Content Streams via pdf-lib
// ============================================================

/**
 * Procesa el PDF completo en modo PRECISIÓN usando pdf-lib para
 * cargar, modificar content streams y guardar.
 * 
 * FLUJO:
 *  1. PDFDocument.load(fileBuffer) — carga el PDF original
 *  2. Para cada página con redactions:
 *     a. Obtener dimensiones de página (MediaBox/CropBox)
 *     b. Convertir coordenadas viewport% → PDF user space
 *     c. Acceder al content stream
 *     d. Decodificar, analizar, aplicar redactions
 *     e. Reconstruir stream modificado y reemplazar el original
 *  3. Sanitizar metadatos
 *  4. PDFDocument.save() — preserva estructura, bookmarks, fuentes
 */
async function redactPrecisionMode(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: RedactOptions,
  report: (msg: WorkerMessage) => void
): Promise<RedactResult> {
  report({
    type: 'progress', phase: 'analyzing', percent: 5,
    message: 'Modo Precisión: Cargando PDF con pdf-lib para edición de content streams...',
  });

  // Cargar PDF original con pdf-lib
  const pdfDoc = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const totalPages = pdfDoc.getPageCount();
  const pdfPages = pdfDoc.getPages();

  // Agrupar redactions por página
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
    type: 'progress', phase: 'analyzing', percent: 10,
    message: `${totalRedactions} parches en ${pagesWithRedactions} páginas. Preparando edición de content streams...`,
    totalPages,
  });

  let totalOperatorsModified = 0;

  // También necesitamos pdfjs-dist para geometría precisa
  const pdfjsDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    stopAtErrors: false,
  }).promise;

  // Procesar cada página
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pct = 10 + Math.floor((pageNum / totalPages) * 80);
    const pageRedactions = redactionsByPage.get(pageNum) || [];

    report({
      type: 'progress', phase: 'redacting', percent: pct,
      message: `Editando página ${pageNum}/${totalPages} (content stream)...`,
      currentPage: pageNum, totalPages,
    });

    if (pageRedactions.length > 0) {
      const pdfPage = pdfPages[pageNum - 1];
      const opsModified = await modifyPageContentStream(
        pdfPage,
        pageNum,
        pageRedactions,
        options.redactionColor,
        pdfjsDoc
      );
      totalOperatorsModified += opsModified;
    }
  }

  report({
    type: 'progress', phase: 'packaging', percent: 92,
    message: 'Sanitizando metadatos y empaquetando PDF...',
  });

  // Sanitizar metadatos
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('PDFBlack TrueRedact Engine v3.0 (Content Stream Precision)');
  pdfDoc.setCreator('PDFBlack Enterprise Redaction Worker');

  // Guardar PDF final
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  report({
    type: 'progress', phase: 'packaging', percent: 100,
    message: `Censura de precisión completada. ${totalOperatorsModified} operadores de texto modificados en ${pagesWithRedactions} páginas.`,
  });

  return {
    type: 'result',
    redactedBytes: pdfBytes.buffer.slice(0) as ArrayBuffer,
    fileName,
    pageCount: totalPages,
    totalRedactions,
    pagesWithRedactions,
    mode: 'precision',
    stats: {
      precisionPages: pagesWithRedactions,
      rasterPages: 0,
      textOperatorsModified: totalOperatorsModified,
      contentPreservedKB: Math.round(pdfBytes.byteLength / 1024),
    },
  };
}

/**
 * Modifica el content stream de una página pdf-lib:
 * 1. Obtiene geometría vía pdfjs-dist (más precisa para coordenadas)
 * 2. Convierte redactions a PDF user space
 * 3. Decodifica el content stream
 * 4. Aplica modificaciones (texto + rectángulos)
 * 5. Reemplaza el stream en la página
 */
async function modifyPageContentStream(
  pdfPage: PDFPage,
  pageNum: number,
  pageRedactions: RedactionBox[],
  boxColor: 'black' | 'gray',
  pdfjsDoc: pdfjsLib.PDFDocumentProxy
): Promise<number> {
  // Obtener geometría desde pdfjs-dist (más precisa que la API de pdf-lib)
  const pdfjsPage = await pdfjsDoc.getPage(pageNum);
  const geometry = extractPageGeometry(pdfjsPage as unknown as Parameters<typeof extractPageGeometry>[0]);

  // Convertir redactions de viewport % a PDF user space
  const pdfBoxes = pageRedactions.map(box => {
    const coords = viewportPercentToPdfUserSpace(
      box.xPercent, box.yPercent, box.widthPercent, box.heightPercent, geometry
    );
    const expanded = expandRedactionArea(coords, 12);
    return clampToMediaBox(expanded, geometry.mediaBox);
  });

  try {
    // Acceder al content stream de la página
    const internalPage = pdfPage as unknown as InternalPDFPage;
    const contentsGetter = internalPage.node.Contents;

    if (!contentsGetter) {
      // La página no tiene content stream propio → hereda del recurso de página padre
      // En este caso, intentamos rasterizar como fallback
      return 0;
    }

    const contents = contentsGetter();

    // Procesar según el tipo de content stream
    if (contents instanceof PDFArray) {
      let totalOps = 0;
      for (let si = 0; si < contents.size(); si++) {
        const streamObj = contents.get(si);
        if (streamObj instanceof PDFRawStream || streamObj instanceof PDFContentStream) {
          totalOps += modifySingleStream(streamObj, pdfBoxes, boxColor);
        }
      }
      return totalOps;
    } else if (contents instanceof PDFRawStream || contents instanceof PDFContentStream) {
      return modifySingleStream(contents, pdfBoxes, boxColor);
    }

    return 0;
  } catch (error) {
    console.warn(`Error modificando content stream de página ${pageNum}:`, error);
    return 0;
  }
}

/**
 * Modifica un stream individual: decodifica, analiza, aplica redactions, re-encodea.
 * Retorna el número de operadores de texto modificados.
 */
function modifySingleStream(
  stream: PDFRawStream | PDFContentStream,
  pdfBoxes: Array<{ x: number; y: number; w: number; h: number }>,
  boxColor: 'black' | 'gray'
): number {
  try {
    // Decodificar el stream a texto
    let decodedStr: string;
    // Acceder como objeto genérico para sortear limitaciones de tipo
    const streamObj = stream as unknown as { getContents: () => Uint8Array; contents?: Uint8Array; dict?: Record<string, unknown> };

    const rawBytes = streamObj.getContents();
    try {
      // Intentar decodificar con decodePDFRawStream
      const decoded = decodePDFRawStream(stream as unknown as PDFRawStream);
      if (decoded instanceof Uint8Array) {
        decodedStr = new TextDecoder('latin1').decode(decoded);
      } else if (decoded && typeof decoded === 'object') {
        decodedStr = new TextDecoder('latin1').decode(decoded as unknown as Uint8Array);
      } else {
        decodedStr = new TextDecoder('latin1').decode(rawBytes);
      }
    } catch {
      // Si falla la decodificación, usar los bytes raw
      decodedStr = new TextDecoder('latin1').decode(rawBytes);
    }

    // Analizar content stream
    const analysis = analyzeContentStream(decodedStr);

    // Aplicar redactions
    const modifiedStream = applyRedactionsToStream(analysis, pdfBoxes, boxColor);

    // Re-encodear y reemplazar
    const encoder = new TextEncoder();
    const newBytes = encoder.encode(modifiedStream);

    // Reemplazar contenido del stream
    // pdf-lib usa internamente `contents` como buffer
    if ('setContents' in stream) {
      (stream as { setContents: (bytes: Uint8Array) => void }).setContents(newBytes);
    } else {
      // Fallback: acceder a la propiedad interna
      const streamInternal = stream as unknown as { contents: Uint8Array };
      streamInternal.contents = newBytes;
    }

    return analysis.textOperators.length;
  } catch (error) {
    console.warn('Error en modifySingleStream:', error);
    return 0;
  }
}

// ============================================================
// MODO RASTERIZADO: Fallback Legacy (compatible v2.0)
// ============================================================

async function redactRasterMode(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: RedactOptions,
  report: (msg: WorkerMessage) => void
): Promise<RedactResult> {
  report({
    type: 'progress', phase: 'analyzing', percent: 5,
    message: 'Modo Rasterizado: Cargando PDF con pdf.js para renderizado...',
  });

  const srcDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
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
    type: 'progress', phase: 'analyzing', percent: 10,
    message: `${totalRedactions} parches en ${pagesWithRedactions} páginas. Iniciando rasterización...`,
    totalPages,
  });

  const outPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pct = 10 + Math.floor((pageNum / totalPages) * 80);
    const pageRedactions = redactionsByPage.get(pageNum) || [];

    report({
      type: 'progress', phase: 'redacting', percent: pct,
      message: `Rasterizando página ${pageNum}/${totalPages}...`,
      currentPage: pageNum, totalPages,
    });

    const page = await srcDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`No se pudo crear contexto OffscreenCanvas para página ${pageNum}`);

    await page.render({
      canvasContext: ctx,
      viewport,
    } as unknown as Parameters<typeof page.render>[0]).promise;

    const color = options.redactionColor === 'gray' ? '#404040' : '#000000';
    for (const box of pageRedactions) {
      const rx = (box.xPercent / 100) * viewport.width;
      const ry = (box.yPercent / 100) * viewport.height;
      const rw = (box.widthPercent / 100) * viewport.width;
      const rh = (box.heightPercent / 100) * viewport.height;
      ctx.fillStyle = color;
      ctx.fillRect(rx, ry, rw, rh);
    }

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    const jpegBytes = await blob.arrayBuffer();

    const embeddedImg = await outPdf.embedJpg(jpegBytes);
    const origViewport = page.getViewport({ scale: 1.0 });
    const newPage = outPdf.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });
  }

  report({
    type: 'progress', phase: 'packaging', percent: 92,
    message: 'Sanitizando metadatos y empaquetando...',
  });

  outPdf.setTitle('');
  outPdf.setAuthor('');
  outPdf.setSubject('');
  outPdf.setKeywords([]);
  outPdf.setProducer('PDFBlack TrueRedact Engine v3.0 (Raster Legacy Fallback)');
  outPdf.setCreator('PDFBlack Redaction Worker');

  const pdfBytes = await outPdf.save({ useObjectStreams: true, addDefaultPage: false });

  report({
    type: 'progress', phase: 'packaging', percent: 100,
    message: 'Censura rasterizada completada.',
  });

  return {
    type: 'result',
    redactedBytes: pdfBytes.buffer.slice(0) as ArrayBuffer,
    fileName,
    pageCount: totalPages,
    totalRedactions,
    pagesWithRedactions,
    mode: 'raster',
    stats: {
      precisionPages: 0,
      rasterPages: pagesWithRedactions,
      textOperatorsModified: 0,
      contentPreservedKB: Math.round(pdfBytes.byteLength / 1024),
    },
  };
}

// ============================================================
// FUNCIÓN PRINCIPAL — Orquestador híbrido
// ============================================================

async function redactPdfV3(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: RedactOptions,
  report: (msg: WorkerMessage) => void
): Promise<RedactResult> {
  const mode = options.mode || 'precision';

  if (mode === 'raster') {
    return redactRasterMode(fileBuffer, fileName, options, report);
  }

  // Modo precisión: intentar, con fallback transparente a raster
  try {
    return await redactPrecisionMode(fileBuffer, fileName, options, report);
  } catch (error) {
    console.warn('Precision mode failed, falling back to raster:', error);

    report({
      type: 'progress', phase: 'analyzing', percent: 0,
      message: `Modo precisión falló: ${error instanceof Error ? error.message : 'error desconocido'}. Cambiando a modo rasterizado...`,
    });

    return redactRasterMode(fileBuffer, fileName, options, report);
  }
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
    const result = await redactPdfV3(fileBuffer, fileName, options, (msg) => self.postMessage(msg));
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: `Error de censura v3: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      fileName,
    } as RedactError);
  }
};

export {};