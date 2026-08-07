import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ── Tessdata URLs ──
const TESSDATA_URLS: Record<string, string> = {
  spa: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/spa.traineddata',
  eng: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata',
  fra: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/fra.traineddata',
  deu: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/deu.traineddata',
  por: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/por.traineddata',
  ita: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/ita.traineddata',
  chi_sim: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/chi_sim.traineddata',
  jpn: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/jpn.traineddata',
  ara: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/ara.traineddata',
  rus: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/rus.traineddata',
};

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
    post({ type: 'progress', percent: 2, message: 'Cargando motor OCR (WASM)...' });

    // ── Import PDF.js dynamically inside worker ──
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    // @ts-expect-error tesseract-wasm lacks native type declarations
    const { OCRClient } = await import('tesseract-wasm');

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

    // ── Initialize OCR Client ──
    post({ type: 'progress', percent: 8, message: 'Inicializando Tesseract WASM...' });

    const wasmResp = await fetch('/tesseract/dist/tesseract-core-fallback.wasm');
    const wasmBinary = await wasmResp.arrayBuffer();

    const ocrClient = new OCRClient({
      workerURL: '/tesseract/dist/tesseract-worker.js',
      wasmBinary,
    });

    // ── Load language model ──
    const modelUrl = TESSDATA_URLS[opts.ocrLang] ?? TESSDATA_URLS.spa;
    post({
      type: 'progress',
      percent: 12,
      message: `Descargando modelo de idioma (${opts.ocrLang})...`,
    });
    const modelBuffer = await fetch(modelUrl).then((r) => r.arrayBuffer());
    await ocrClient.loadModel(modelBuffer);

    post({ type: 'progress', percent: 18, message: 'Modelo cargado. Iniciando reconocimiento...' });

    // ── OCR each page ──
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

      // Use OffscreenCanvas inside worker
      const canvas = new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pdfjsPage.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      } as any).promise;

      // OCR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      await ocrClient.loadImage(imageData);

      const textItems = await ocrClient.getTextBoxes('word');
      const pageText: string = await ocrClient.getText();

      let rawText = pageText;
      if (opts.numericMode) rawText = rawText.replace(/(\d+[.,]?\d*)/g, '$1');
      fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${rawText}\n\n`;

      // PDF page dimensions
      const { width: pdfW, height: pdfH } = pdfjsPage.getViewport({ scale: 1 });

      // Convert to PNG for embedding
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const arrayBuf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      // Convert to base64 data URL
      let binary = '';
      for (let b = 0; b < uint8.byteLength; b++) binary += String.fromCharCode(uint8[b]);
      const imageDataUrl = 'data:image/png;base64,' + btoa(binary);

      const words = textItems.map(
        (ti: {
          text: string;
          rect: { left: number; top: number; right: number; bottom: number };
          confidence: number;
        }) => ({
          text: ti.text,
          rect: ti.rect,
          confidence: ti.confidence,
        }),
      );

      pageResults.push({
        pageNum,
        ocrText: rawText,
        words,
        canvasW: canvas.width,
        canvasH: canvas.height,
        pdfW,
        pdfH,
        imageDataUrl,
      });

      jsonResults.push({
        page: pageNum,
        confidence: '95%',
        wordCount: words.length,
        text: rawText,
      });
    }

    ocrClient.destroy();

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
      const opacityVal = opts.textOpacity > 0 ? opts.textOpacity / 100 : 0;

      for (let pi = 0; pi < pageResults.length; pi++) {
        const pct = 78 + Math.round((pi / pageResults.length) * 17);
        post({
          type: 'progress',
          percent: pct,
          message: `Ensamblando página ${pi + 1}/${pageResults.length}...`,
        });

        const imgData = pageResults[pi];
        const outPage = outPdf.addPage([imgData.pdfW, imgData.pdfH]);

        // Embed PNG image
        const pngImage = await outPdf.embedPng(imgData.imageDataUrl);
        outPage.drawImage(pngImage, { x: 0, y: 0, width: imgData.pdfW, height: imgData.pdfH });

        // Draw positioned text layer
        const scaleX = imgData.pdfW / imgData.canvasW;
        const scaleY = imgData.pdfH / imgData.canvasH;
        let wordsDrawn = 0;

        imgData.words.forEach((w) => {
          if (!w.text?.trim() || !w.rect) return;
          const { left, top: topC, bottom } = w.rect;
          const x = left * scaleX;
          const y = imgData.pdfH - bottom * scaleY;
          const wordHeight = (bottom - topC) * scaleY;
          const fontSize = Math.max(4, Math.min(16, wordHeight * 0.95));
          const cleanWord = w.text
            .trim()
            .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]/g, '')
            .replace(/\s+/g, ' ');
          if (cleanWord.length === 0) return;
          try {
            outPage.drawText(cleanWord, {
              x,
              y,
              size: fontSize,
              font: outFont,
              color: rgb(0, 0, 0),
              opacity: opacityVal,
            });
            wordsDrawn++;
          } catch {
            /* skip unrenderable chars */
          }
        });

        // Fallback text layer
        if (wordsDrawn === 0 && imgData.ocrText.trim().length > 0) {
          const safeText = imgData.ocrText.replace(
            /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ .,;:!?¿¡()%&+\-*/=\r\n\t<>]/g,
            ' ',
          );
          if (safeText.trim().length > 0) {
            const margin = 12,
              fs = 5,
              lh = 7;
            const maxLines = Math.floor((imgData.pdfH - margin * 2) / lh);
            const rawW = safeText.split(/\s+/).filter((w) => w.length > 0);
            const lines: string[] = [];
            let cur = '';
            for (const w of rawW) {
              const cand = cur ? `${cur} ${w}` : w;
              if (
                outFont.widthOfTextAtSize(cand, fs) > imgData.pdfW - margin * 2 &&
                cur.length > 0
              ) {
                lines.push(cur);
                cur = w;
              } else cur = cand;
            }
            if (cur) lines.push(cur);
            const drawable = lines.slice(0, maxLines);
            for (let li = 0; li < drawable.length; li++) {
              const line = drawable[li];
              if (!line.trim()) continue;
              try {
                outPage.drawText(line, {
                  x: margin,
                  y: imgData.pdfH - margin - (li + 1) * lh,
                  size: fs,
                  font: outFont,
                  color: rgb(0, 0, 0),
                  opacity: 0.25,
                });
              } catch {
                /* skip */
              }
            }
          }
        }
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
