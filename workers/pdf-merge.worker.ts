/**
 * Web Worker Empresarial para fusión y procesamiento asíncrono de documentos PDF.
 *
 * Ventajas:
 * 1. Procesa archivos pesados en un hilo secundario evitando bloquear el hilo principal (UI).
 * 2. Generación opcional de Índice Corporativo Automático (Table of Contents / TOC).
 * 3. Foliado continuo flexible (formato formal, ratio, corto, bates) y posiciones configurables.
 * 4. Carátula ejecutiva y modo dúplex inteligente con hojas en blanco.
 * 5. Emite progreso detallado en tiempo real (porcentaje y mensajes).
 * 6. Utiliza Transferable Objects para paso de ArrayBuffers con cero copia en memoria RAM.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

export type PageOrientation = 'original' | 'portrait' | 'landscape';
export type PageSizeOption = 'original' | 'a4' | 'letter';
export type SeparatorOption = 'none' | 'blank' | 'title_page' | 'executive_cover';
export type PageNumberFormat = 'ratio' | 'formal' | 'short' | 'bates';
export type PageNumberPosition = 'bottom_center' | 'bottom_right' | 'top_right';

export interface PageDetailPayload {
  pageIndex: number;
  rotation: number;
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
  pageNumberFormat?: PageNumberFormat;
  pageNumberPosition?: PageNumberPosition;
  skipFirstPageNumber?: boolean;
  generateToc?: boolean;
  tocTitle?: string;
  batesPrefix?: string;
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
  filesCount: number;
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

  parts.forEach((part) => {
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
    const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) })
      .promise;
    const page = await pdfjsDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.3 });

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context as any, canvas: canvas as any, viewport } as any)
          .promise;
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
      thumbnailUrl,
    };
    self.postMessage(resultMsg);
  } catch (err: any) {
    const errorMsg: MergeError = {
      type: 'error',
      message: `Error al analizar ${data.name}: ${err?.message || 'Error desconocido'}`,
    };
    self.postMessage(errorMsg);
  }
}

async function handleMerge(data: MergeRequest) {
  const { files, options } = data;
  try {
    self.postMessage({
      type: 'progress',
      percent: 5,
      message: 'Iniciando motor de consolidación vectorial en Web Worker...',
    } as MergeProgress);

    const mergedPdf = await PDFDocument.create();
    const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

    const totalFiles = files.length;
    const documentCatalog: { name: string; startPage: number; pageCount: number }[] = [];

    // 1. CARÁTULA EJECUTIVA MASTER (SI ESTÁ SELECCIONADA)
    if (options.separatorMode === 'executive_cover') {
      self.postMessage({
        type: 'progress',
        percent: 10,
        message: 'Generando carátula ejecutiva institucional...',
      } as MergeProgress);

      const coverPage = mergedPdf.addPage([595.28, 841.89]);
      const { width, height } = coverPage.getSize();

      // Marco corporativo sutil
      coverPage.drawRectangle({
        x: 36,
        y: 36,
        width: width - 72,
        height: height - 72,
        borderColor: rgb(0.2, 0.2, 0.25),
        borderWidth: 1,
        color: rgb(0.04, 0.04, 0.06),
      });

      // Línea superior decorativa
      coverPage.drawLine({
        start: { x: 50, y: height - 60 },
        end: { x: width - 50, y: height - 60 },
        thickness: 2,
        color: rgb(0.85, 0.8, 0.7),
      });

      // Emisor / Marca
      coverPage.drawText('EXPEDIENTE CONSOLIDADO • PDFBLACK ENTERPRISE', {
        x: 50,
        y: height - 90,
        size: 9,
        font: helveticaBold,
        color: rgb(0.85, 0.8, 0.7),
      });

      // Título Principal
      const mainTitle = options.metadata?.title?.trim() || 'DOCUMENTO UNIFICADO';
      coverPage.drawText(mainTitle.toUpperCase(), {
        x: 50,
        y: height - 140,
        size: 22,
        font: helveticaBold,
        color: rgb(0.98, 0.98, 0.98),
      });

      // Subtítulo / Asunto
      if (options.metadata?.subject?.trim()) {
        coverPage.drawText(options.metadata.subject.trim(), {
          x: 50,
          y: height - 175,
          size: 13,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.75),
        });
      }

      // Cuadro de Resumen Técnico
      const boxY = height - 320;
      coverPage.drawRectangle({
        x: 50,
        y: boxY,
        width: width - 100,
        height: 110,
        borderColor: rgb(0.3, 0.3, 0.35),
        borderWidth: 0.8,
        color: rgb(0.07, 0.07, 0.1),
      });

      coverPage.drawText('RESUMEN DE CONSOLIDACIÓN', {
        x: 65,
        y: boxY + 85,
        size: 9,
        font: helveticaBold,
        color: rgb(0.7, 0.7, 0.75),
      });

      coverPage.drawText(`Total Documentos Anexados:   ${totalFiles}`, {
        x: 65,
        y: boxY + 60,
        size: 11,
        font: helveticaFont,
        color: rgb(0.9, 0.9, 0.9),
      });

      coverPage.drawText(`Fecha y Hora de Emisión:      ${new Date().toLocaleString()}`, {
        x: 65,
        y: boxY + 40,
        size: 10,
        font: helveticaFont,
        color: rgb(0.7, 0.7, 0.7),
      });

      coverPage.drawText(`Entorno de Procesamiento:      100% Local en RAM (Zero-Server)`, {
        x: 65,
        y: boxY + 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0.2, 0.8, 0.5),
      });

      // Pie de carátula
      coverPage.drawText('PDFBlack Engine v4.0 • Cumplimiento Normativo RGPD / ISO 32000-1', {
        x: 50,
        y: 52,
        size: 8,
        font: helveticaFont,
        color: rgb(0.45, 0.45, 0.5),
      });
    }

    // 2. PROCESAMIENTO Y FUSIÓN DE CADA ARCHIVO
    for (let i = 0; i < totalFiles; i++) {
      const item = files[i];
      const progressPercent = 12 + Math.floor(((i + 1) / totalFiles) * 70);

      self.postMessage({
        type: 'progress',
        percent: progressPercent,
        message: `Procesando ${item.name} (${i + 1}/${totalFiles})...`,
      } as MergeProgress);

      // Separador individual por documento
      if (options.separatorMode === 'title_page') {
        const sepPage = mergedPdf.addPage([595.28, 841.89]);
        const { height } = sepPage.getSize();

        sepPage.drawRectangle({
          x: 40,
          y: height - 180,
          width: 515,
          height: 120,
          color: rgb(0.06, 0.06, 0.09),
          borderColor: rgb(0.25, 0.25, 0.3),
          borderWidth: 1,
        });

        sepPage.drawText(`SECCIÓN 00${i + 1}`, {
          x: 60,
          y: height - 90,
          size: 10,
          font: helveticaBold,
          color: rgb(0.85, 0.8, 0.7),
        });

        const safeName = item.name.length > 45 ? item.name.slice(0, 42) + '…' : item.name;
        sepPage.drawText(safeName, {
          x: 60,
          y: height - 120,
          size: 16,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });

        sepPage.drawText(`${item.pageCount} páginas en documento original`, {
          x: 60,
          y: height - 148,
          size: 10,
          font: helveticaFont,
          color: rgb(0.65, 0.65, 0.7),
        });
      } else if (options.separatorMode === 'blank' && i > 0) {
        mergedPdf.addPage([595.28, 841.89]);
      }

      // Carga y extracción de páginas
      const loadOptions: any = { ignoreEncryption: true };
      if (item.password) {
        loadOptions.password = item.password;
      }
      const pdfDoc = await PDFDocument.load(item.arrayBuffer.slice(0), loadOptions);
      const totalInDoc = pdfDoc.getPageCount();

      let pagesToCopy: { pageIndex: number; customRotation: number }[] = [];

      if (item.pagesDetail && item.pagesDetail.length > 0) {
        pagesToCopy = item.pagesDetail
          .filter((p) => p.included && p.pageIndex >= 0 && p.pageIndex < totalInDoc)
          .map((p) => ({ pageIndex: p.pageIndex, customRotation: p.rotation || 0 }));
      } else {
        const indices = parsePageRange(item.pageRange, totalInDoc);
        pagesToCopy = indices.map((idx) => ({ pageIndex: idx, customRotation: 0 }));
      }

      if (pagesToCopy.length === 0) continue;

      // Registrar inicio en el catálogo para el Índice
      const startPageNumber = mergedPdf.getPageCount() + 1;

      const indicesOnly = pagesToCopy.map((p) => p.pageIndex);
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

      documentCatalog.push({
        name: item.name,
        startPage: startPageNumber,
        pageCount: pagesToCopy.length,
      });

      // Ajuste duplex: si las páginas agregadas son impares, añadir hoja en blanco para que el siguiente doc inicie al frente
      if (options.duplexMode && pagesToCopy.length % 2 !== 0) {
        mergedPdf.addPage([595.28, 841.89]);
      }
    }

    // 3. GENERACIÓN DE ÍNDICE CORPORATIVO (TOC)
    if (options.generateToc && documentCatalog.length > 0) {
      self.postMessage({
        type: 'progress',
        percent: 85,
        message: 'Generando tabla de contenidos e índice estructurado...',
      } as MergeProgress);

      const tocPage = mergedPdf.insertPage(
        options.separatorMode === 'executive_cover' ? 1 : 0,
        [595.28, 841.89],
      );
      const { width, height } = tocPage.getSize();

      // Ajustar catálogo por el desplazamiento de la página de TOC insertada
      const tocShift = 1;
      documentCatalog.forEach((entry) => {
        entry.startPage += tocShift;
      });

      // Cabecera del Índice
      tocPage.drawLine({
        start: { x: 50, y: height - 50 },
        end: { x: width - 50, y: height - 50 },
        thickness: 1.5,
        color: rgb(0.85, 0.8, 0.7),
      });

      const tocTitle = options.tocTitle?.trim() || 'ÍNDICE GENERAL DEL EXPEDIENTE';
      tocPage.drawText(tocTitle.toUpperCase(), {
        x: 50,
        y: height - 80,
        size: 16,
        font: helveticaBold,
        color: rgb(0.95, 0.95, 0.95),
      });

      tocPage.drawText('Relación cronológica de documentos y página de inicio correspondiente:', {
        x: 50,
        y: height - 98,
        size: 9.5,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.65),
      });

      // Filas del Índice
      let currentY = height - 130;
      const rowHeight = 22;
      const maxRows = Math.floor((currentY - 80) / rowHeight);

      const itemsToShow = documentCatalog.slice(0, maxRows);

      itemsToShow.forEach((entry, idx) => {
        const itemNumber = String(idx + 1).padStart(2, '0');
        const numLabel = `${itemNumber}. `;
        const numWidth = helveticaBold.widthOfTextAtSize(numLabel, 9.5);

        tocPage.drawText(numLabel, {
          x: 50,
          y: currentY,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.85, 0.8, 0.7),
        });

        // Nombre seguro y truncado
        let displayName = entry.name;
        if (displayName.length > 40) {
          displayName = displayName.slice(0, 38) + '…';
        }

        tocPage.drawText(displayName, {
          x: 50 + numWidth,
          y: currentY,
          size: 9.5,
          font: helveticaFont,
          color: rgb(0.9, 0.9, 0.9),
        });

        const nameWidth = helveticaFont.widthOfTextAtSize(displayName, 9.5);
        const startXDots = 50 + numWidth + nameWidth + 8;
        const endXDots = width - 115;

        // Línea punteada de líderes
        if (endXDots > startXDots) {
          const dotsText = '. '.repeat(Math.max(1, Math.floor((endXDots - startXDots) / 8)));
          tocPage.drawText(dotsText, {
            x: startXDots,
            y: currentY,
            size: 8,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.35),
          });
        }

        // Número de página
        const pageLabel = `Pág. ${entry.startPage}`;
        tocPage.drawText(pageLabel, {
          x: width - 105,
          y: currentY,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.85, 0.8, 0.7),
        });

        // Cantidad de páginas en gris
        const countLabel = `(${entry.pageCount} p.)`;
        tocPage.drawText(countLabel, {
          x: width - 60,
          y: currentY,
          size: 8.5,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.55),
        });

        currentY -= rowHeight;
      });

      if (documentCatalog.length > maxRows) {
        tocPage.drawText(
          `... y ${documentCatalog.length - maxRows} documentos adicionales en el expediente.`,
          {
            x: 50,
            y: currentY - 5,
            size: 8.5,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.55),
          },
        );
      }

      // Pie del Índice
      tocPage.drawLine({
        start: { x: 50, y: 55 },
        end: { x: width - 50, y: 55 },
        thickness: 0.8,
        color: rgb(0.25, 0.25, 0.3),
      });

      tocPage.drawText('Índice autogenerado por PDFBlack Enterprise • Cero subida a servidor', {
        x: 50,
        y: 42,
        size: 8,
        font: helveticaFont,
        color: rgb(0.45, 0.45, 0.5),
      });
    }

    // 4. NUMERACIÓN CONTINUA / FOLIADO DE EXPEDIENTES
    if (options.addPageNumbers) {
      self.postMessage({
        type: 'progress',
        percent: 90,
        message: 'Aplicando foliado y numeración continua a las páginas...',
      } as MergeProgress);

      const allPages = mergedPdf.getPages();
      const totalPagesInDoc = allPages.length;

      const format = options.pageNumberFormat || 'ratio';
      const position = options.pageNumberPosition || 'bottom_center';
      const skipFirst = !!options.skipFirstPageNumber;

      const startIndex = skipFirst ? 1 : 0;

      allPages.forEach((p, idx) => {
        if (idx < startIndex) return;

        const { width, height } = p.getSize();
        const currNum = skipFirst ? idx : idx + 1;
        const totalNum = skipFirst ? totalPagesInDoc - 1 : totalPagesInDoc;

        let numText = '';
        if (format === 'ratio') {
          numText = `${currNum} / ${totalNum}`;
        } else if (format === 'formal') {
          numText = `Página ${currNum} de ${totalNum}`;
        } else if (format === 'short') {
          numText = `Pág. ${currNum}`;
        } else if (format === 'bates') {
          const prefix = options.batesPrefix?.trim() || 'EXP';
          numText = `${prefix}-${String(currNum).padStart(5, '0')}`;
        }

        const fontSize = 8.5;
        const textWidth = helveticaFont.widthOfTextAtSize(numText, fontSize);

        let posX = width / 2 - textWidth / 2;
        let posY = 20;

        if (position === 'bottom_right') {
          posX = width - textWidth - 36;
          posY = 20;
        } else if (position === 'top_right') {
          posX = width - textWidth - 36;
          posY = height - 25;
        }

        p.drawText(numText, {
          x: posX,
          y: posY,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.45),
        });
      });
    }

    // 5. METADATOS CORPORATIVOS
    if (options.metadata) {
      if (options.metadata.title) mergedPdf.setTitle(options.metadata.title);
      if (options.metadata.author) mergedPdf.setAuthor(options.metadata.author);
      if (options.metadata.subject) mergedPdf.setSubject(options.metadata.subject);
      if (options.metadata.keywords) mergedPdf.setKeywords([options.metadata.keywords]);
    }
    mergedPdf.setProducer('PDFBlack Enterprise Engine v4.0');
    mergedPdf.setCreator('PDFBlack (https://pdf-black.com)');

    self.postMessage({
      type: 'progress',
      percent: 96,
      message: 'Compilando y optimizando bytes del PDF unificado...',
    } as MergeProgress);

    const mergedBytes = await mergedPdf.save();
    const bufferResult = mergedBytes.buffer as ArrayBuffer;

    const resultMessage: MergeResult = {
      type: 'result',
      mergedBytes: bufferResult,
      totalPages: mergedPdf.getPageCount(),
      filesCount: totalFiles,
    };

    // Transferir el ArrayBuffer de vuelta al hilo principal sin copiar
    (self as any).postMessage(resultMessage, [bufferResult]);
  } catch (error: any) {
    console.error('pdf-merge.worker error:', error);
    self.postMessage({
      type: 'error',
      message: error?.message || 'Error durante la unión de archivos en Web Worker',
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
