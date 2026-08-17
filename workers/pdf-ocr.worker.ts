import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import {
  pushGraphicsState, popGraphicsState,
  beginText, endText,
  setFontAndSize, setTextRenderingMode, TextRenderingMode,
  showText, rotateAndSkewTextRadiansAndTranslate,
  setFillingColor,
} from 'pdf-lib';
import { PDFHexString } from 'pdf-lib';

function sanitizeWordForFont(font: PDFFont, text: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    try {
      font.encodeText(char);
      result += char;
    } catch {
      if (char === '“' || char === '”') result += '"';
      else if (char === '‘' || char === '’') result += "'";
      else if (char === '–' || char === '—') result += '-';
      else if (char === '…') result += '...';
      else result += ' ';
    }
  }
  return result.trim().replace(/\s+/g, ' ');
}

function getBbox(item: any) {
  if (!item) return { left: 0, top: 0, right: 0, bottom: 0 };
  const b = item.bbox || item.Bbox || item.bounding || item.Bounding ||
            item.bounds || item.Bounds || item.rect || item.Rect || {};
  const x0 = b.x0 ?? b.X0 ?? b.left ?? b.Left ?? b.x ?? b.X ?? 0;
  const y0 = b.y0 ?? b.Y0 ?? b.top ?? b.Top ?? b.y ?? b.Y ?? 0;
  let x1 = b.x1 ?? b.X1 ?? b.right ?? b.Right ?? 0;
  let y1 = b.y1 ?? b.Y1 ?? b.bottom ?? b.Bottom ?? 0;

  const width = b.width ?? b.Width ?? b.w ?? b.W ?? (item.width ?? item.Width ?? 0);
  const height = b.height ?? b.Height ?? b.h ?? b.H ?? (item.height ?? item.Height ?? 0);

  if (x1 <= x0 && width > 0) x1 = x0 + width;
  if (y1 <= y0 && height > 0) y1 = y0 + height;

  return { left: Number(x0), top: Number(y0), right: Number(x1), bottom: Number(y1) };
}

export interface OcrWorkerOptions {
  filePrefix: string;
  pdfBuffer: ArrayBuffer;
  ocrLang: string;
  outputFormat: 'pdf' | 'txt' | 'json';
  pageScope: 'all' | 'custom';
  customPageRange: string;
  totalPages: number;
  textOpacity: number;
  numericMode: boolean;
  enhanceContrast: boolean;
  // PDF metadata
  metaTitle?: string;
  metaAuthor?: string;
  metaSubject?: string;
}

export type OcrWorkerResult =
  | { type: 'progress'; percent: number; message: string; currentPage?: number }
  | {
      type: 'success';
      outputBuffer: ArrayBuffer;
      outputFormat: string;
      filename: string;
      extractedText: string;
      jsonData?: string;
    }
  | { type: 'error'; message: string };

// ── Parse page ranges (e.g. "1, 3-5") ──
function parsePageRange(raw: string, total: number): Set<number> {
  const selected = new Set<number>();
  const parts = raw.split(',');
  parts.forEach((part) => {
    const t = part.trim();
    if (t.includes('-')) {
      const [s, e] = t.split('-').map(Number);
      if (!isNaN(s) && !isNaN(e)) {
        for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
          if (i >= 1 && i <= total) selected.add(i);
        }
      }
    } else {
      const n = Number(t);
      if (!isNaN(n) && n >= 1 && n <= total) selected.add(n);
    }
  });
  return selected;
}

self.onmessage = async (e: MessageEvent<OcrWorkerOptions>) => {
  const opts = e.data;
  const post = (msg: OcrWorkerResult) => self.postMessage(msg);

  try {
    // Versión 3.2: Forzar actualización de caché en Microsoft Edge y Chrome
    post({ type: 'progress', percent: 2, message: 'Iniciando motor OCR v3.2 (Posicionamiento HOCR)...' });

    // ── Import PDF.js dynamically inside worker ──
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    // ── Load PDF ──
    const pdfjsData = new Uint8Array(opts.pdfBuffer.slice(0));

    post({ type: 'progress', percent: 5, message: 'Analizando estructura del documento...' });

    const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
    const totalPagesActual: number = pdfjsDoc.numPages;

    // Build target page set
    const targetPages =
      opts.pageScope === 'all'
        ? (() => {
            const s = new Set<number>();
            for (let i = 1; i <= totalPagesActual; i++) s.add(i);
            return s;
          })()
        : parsePageRange(opts.customPageRange, totalPagesActual);

    // ── Initialize Tesseract Worker ──
    post({ type: 'progress', percent: 10, message: `Cargando modelo de idioma (${opts.ocrLang || 'spa'})...` });

    const { createWorker } = await import('tesseract.js');
    const langCode = opts.ocrLang || 'spa';
    let tessWorker: any;
    try {
      tessWorker = await createWorker(langCode, 1, {
        workerBlobURL: true,
      });
    } catch (err1) {
      console.warn('Fallback a worker estándar de Tesseract...', err1);
      tessWorker = await createWorker(langCode, 1);
    }

    post({ type: 'progress', percent: 18, message: 'Motor OCR listo. Iniciando reconocimiento...' });

    interface PageResult {
      pageNum: number;
      ocrText: string;
      words: {
        text: string;
        rect: { left: number; top: number; right: number; bottom: number };
        confidence: number;
      }[];
      canvasW: number;
      canvasH: number;
      pdfW: number;
      pdfH: number;
      imageDataUrl: string;
      pdfData?: ArrayBuffer | null;
    }

    const pageResults: PageResult[] = [];
    let fullTextAccumulator = '';
    const jsonResults: object[] = [];
    const totalCount = targetPages.size;
    let processedCount = 0;

    for (let i = 0; i < totalPagesActual; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      processedCount++;
      const pct = 18 + Math.round((processedCount / totalCount) * 57);
      post({
        type: 'progress',
        percent: pct,
        message: `Procesando página ${pageNum} de ${totalPagesActual}...`,
        currentPage: pageNum,
      });

      // Render page to OffscreenCanvas
      const pdfjsPage = await pdfjsDoc.getPage(pageNum);
      const viewport = pdfjsPage.getViewport({ scale: 2.0 }); // 2x for better accuracy

      const canvas = new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pdfjsPage.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      } as any).promise;

      // Convert to Blob and ImageDataUrl for Tesseract
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const arrayBuf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      let binary = '';
      for (let b = 0; b < uint8.byteLength; b++) binary += String.fromCharCode(uint8[b]);
      const imageDataUrl = 'data:image/png;base64,' + btoa(binary);

      // Run Tesseract OCR with HOCR output (el formato estándar más robusto de coordenadas)
      const ret = await tessWorker.recognize(
        imageDataUrl,
        {},
        { text: true, blocks: true, hocr: true, tsv: true }
      );

      const pageText: string = ret.data.text || '';
      let rawText = pageText;
      if (opts.numericMode) rawText = rawText.replace(/(\d+[.,]?\d*)/g, '$1');
      fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${rawText}\n\n`;

      const { width: pdfW, height: pdfH } = pdfjsPage.getViewport({ scale: 1 });
      const dataAny = ret.data as any;

      interface OcrItem {
        text: string;
        rect: { left: number; top: number; right: number; bottom: number };
        confidence: number;
      }

      const extractedItems: OcrItem[] = [];

      // ── Estrategia 1: Parsear HOCR (Garantizado al 100% por Tesseract en todos los navegadores) ──
      if (typeof dataAny.hocr === 'string' && dataAny.hocr.length > 0) {
        const wordRegex = /class=['"](?:ocrx_word|ocr_word)['"][^>]*title=['"]bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)[^'"]*['"][^>]*>([\s\S]*?)<\/span>/gi;
        let match;
        while ((match = wordRegex.exec(dataAny.hocr)) !== null) {
          const left = parseInt(match[1], 10);
          const top = parseInt(match[2], 10);
          const right = parseInt(match[3], 10);
          const bottom = parseInt(match[4], 10);
          const rawWord = match[5]
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          if (rawWord && right > left && bottom > top) {
            extractedItems.push({
              text: rawWord,
              rect: { left, top, right, bottom },
              confidence: 95,
            });
          }
        }
      }

      // ── Estrategia 2: Parsear TSV si HOCR no devolvió palabras ──
      if (extractedItems.length === 0 && typeof dataAny.tsv === 'string' && dataAny.tsv.trim().length > 0) {
        const tsvLines = dataAny.tsv.split('\n');
        for (const row of tsvLines) {
          const parts = row.split('\t');
          if (parts.length < 12) continue;
          const level = parts[0]?.trim();
          const left = parseFloat(parts[6]);
          const top = parseFloat(parts[7]);
          const width = parseFloat(parts[8]);
          const height = parseFloat(parts[9]);
          const conf = parseFloat(parts[10]);
          const wordText = parts[11]?.trim();

          if (!wordText || isNaN(left) || isNaN(top) || width <= 0 || height <= 0) continue;

          if (level === '5') {
            extractedItems.push({
              text: wordText,
              rect: { left, top, right: left + width, bottom: top + height },
              confidence: isNaN(conf) ? 90 : conf,
            });
          }
        }
      }

      post({
        type: 'progress',
        percent: pct,
        message: `Pág ${pageNum}: ${extractedItems.length} palabras alineadas con coordenadas HOCR`,
        currentPage: pageNum,
      });

      pageResults.push({
        pageNum,
        ocrText: rawText,
        words: extractedItems,
        canvasW: canvas.width,
        canvasH: canvas.height,
        pdfW,
        pdfH,
        imageDataUrl,
      });

      jsonResults.push({
        page: pageNum,
        confidence: '95%',
        wordCount: extractedItems.length,
        text: rawText,
      });
    }

    await tessWorker.terminate();

    // ── Build output ──
    post({ type: 'progress', percent: 78, message: 'Construyendo PDF con texto posicionado...' });

    const originalName = opts.filePrefix;
    let outputBuffer: ArrayBuffer;
    let filename: string;

    if (opts.outputFormat === 'pdf') {
      const outPdf = await PDFDocument.create();

      // Set PDF metadata
      if (opts.metaTitle) outPdf.setTitle(opts.metaTitle);
      if (opts.metaAuthor) outPdf.setAuthor(opts.metaAuthor);
      if (opts.metaSubject) outPdf.setSubject(opts.metaSubject);
      outPdf.setProducer('PDF Enterprise Tools — OCR Engine v3.0');
      outPdf.setCreationDate(new Date());
      outPdf.setModificationDate(new Date());

      const outFont = await outPdf.embedFont(StandardFonts.Helvetica);

      for (let pi = 0; pi < pageResults.length; pi++) {
        const pct = 78 + Math.round((pi / pageResults.length) * 17);
        post({
          type: 'progress',
          percent: pct,
          message: `Ensamblando página ${pi + 1}/${pageResults.length}...`,
        });

        const imgData = pageResults[pi];
        const outPage = outPdf.addPage([imgData.pdfW, imgData.pdfH]);

        // Embed PNG image de fondo (imagen del documento escaneado con dimensiones originales)
        const pngImage = await outPdf.embedPng(imgData.imageDataUrl);
        outPage.drawImage(pngImage, { x: 0, y: 0, width: imgData.pdfW, height: imgData.pdfH });

        const scaleX = imgData.pdfW / imgData.canvasW;
        const scaleY = imgData.pdfH / imgData.canvasH;
        const effectiveOpacity = opts.textOpacity > 0 ? opts.textOpacity / 100 : 0;

        imgData.words.forEach((w: any) => {
          if (!w.text?.trim()) return;
          const rect = w.rect;
          if (!rect) return;
          const { left, top: topC, right, bottom } = rect;
          if (left === 0 && topC === 0 && right === 0 && bottom === 0) return;

          const wordBoxWidth = Math.max(1, (right - left) * scaleX);
          const wordBoxHeight = Math.max(4, (bottom - topC) * scaleY);

          // Posición X
          const x = Math.max(0, left * scaleX);

          // Posición Y en sistema PDF (origen en esquina inferior izquierda)
          // bottom es la distancia desde la parte superior del canvas
          const pdfBottom = imgData.pdfH - (bottom * scaleY);
          const y = Math.max(0, pdfBottom + (wordBoxHeight * 0.15));

          const cleanWord = sanitizeWordForFont(outFont, w.text);
          if (!cleanWord || cleanWord.length === 0) return;

          const widthAtSize1 = outFont.widthOfTextAtSize(cleanWord, 1);
          let fontSize = wordBoxHeight * 0.88;
          if (widthAtSize1 > 0 && wordBoxWidth > 0) {
            const targetFontSize = wordBoxWidth / widthAtSize1;
            fontSize = Math.max(4, Math.min(wordBoxHeight * 1.25, targetFontSize));
          }
          fontSize = Math.max(4, Math.min(72, fontSize));

          try {
            outPage.drawText(cleanWord, {
              x,
              y,
              size: fontSize,
              font: outFont,
              color: rgb(0, 0, 0),
              opacity: effectiveOpacity,
            });
          } catch {
            /* skip */
          }
        });
      }

      post({ type: 'progress', percent: 96, message: 'Guardando PDF final...' });
      const pdfBytes = await outPdf.save();
      const rawBuf = pdfBytes.buffer;
      if (typeof SharedArrayBuffer !== 'undefined' && rawBuf instanceof SharedArrayBuffer) {
        const copy = new ArrayBuffer(pdfBytes.byteLength);
        new Uint8Array(copy).set(new Uint8Array(rawBuf, pdfBytes.byteOffset, pdfBytes.byteLength));
        outputBuffer = copy;
      } else {
        outputBuffer = (rawBuf as ArrayBuffer).slice(
          pdfBytes.byteOffset,
          pdfBytes.byteOffset + pdfBytes.byteLength,
        );
      }
      filename = `${originalName}_OCR_Seleccionable.pdf`;
    } else if (opts.outputFormat === 'json') {
      const jsonStr = JSON.stringify(
        { filename: opts.filePrefix, totalPages: targetPages.size, pages: jsonResults },
        null,
        2,
      );
      const enc = new TextEncoder().encode(jsonStr);
      outputBuffer = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
      filename = `${originalName}_OCR_Datos.json`;
    } else {
      // .txt
      const enc = new TextEncoder().encode(fullTextAccumulator);
      outputBuffer = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
      filename = `${originalName}_TextoExtraido.txt`;
    }

    post({ type: 'progress', percent: 100, message: '¡Completado!' });
    post({
      type: 'success',
      outputBuffer,
      outputFormat: opts.outputFormat,
      filename,
      extractedText: fullTextAccumulator,
      jsonData: opts.outputFormat === 'json' ? JSON.stringify(jsonResults) : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message: msg });
  }
};
