import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';

// Polyfill global de document para Web Workers: evita excepciones cuando pdfjs-dist procesa soft-masks, shading o patrones
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return {
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
      };
    },
    createElementNS: (_ns: string, tag: string) => {
      if (tag === 'canvas') {
        return new OffscreenCanvas(1, 1);
      }
      return {
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
      };
    },
  };
}

class WorkerCanvasFactory {
  _createCanvas(width: number, height: number) {
    return new OffscreenCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
  }
  create(width: number, height: number) {
    const canvas = this._createCanvas(width, height);
    const context = canvas.getContext('2d');
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

// ── ALGORITMO OTSU: Cálculo del umbral óptimo de binarización que minimiza la varianza intra-clase ──
function calculateOtsuThreshold(grays: Uint8Array): number {
  const total = grays.length;
  if (total === 0) return 128;

  const histogram = new Int32Array(256);
  for (let i = 0; i < total; i++) {
    histogram[grays[i]]++;
  }

  let sumTotal = 0;
  for (let i = 0; i < 256; i++) {
    sumTotal += i * histogram[i];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let optimalThreshold = 128;

  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * histogram[t];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumTotal - sumBackground) / weightForeground;

    const betweenClassVariance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (betweenClassVariance > maxVariance) {
      maxVariance = betweenClassVariance;
      optimalThreshold = t;
    }
  }

  return optimalThreshold;
}

// ── PREPROCESAMIENTO ENTERPRISE: Binarización Otsu adaptativa y purificación de sombras ──
function applyOtsuAdaptiveBinarization(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  const totalPixels = width * height;
  const grays = new Uint8Array(totalPixels);

  // Conversión a escala de grises con ponderación ITU-R BT.601
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    grays[j] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  }

  const threshold = calculateOtsuThreshold(grays);

  // Zona de transición adaptativa para conservar caracteres finos, tildes y comas sin erosionar
  const highCut = Math.min(250, threshold + 18);
  const lowCut = Math.max(5, threshold - 18);
  const spread = highCut - lowCut;

  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const val = grays[j];
    let finalVal: number;
    if (val >= highCut) {
      finalVal = 255; // Fondo blanco puro
    } else if (val <= lowCut) {
      finalVal = 0; // Trazo negro nítido
    } else {
      // Suavizado en escala de grises para conservar antialiasing
      finalVal = Math.round(((val - lowCut) / spread) * 255);
    }
    d[i] = finalVal;
    d[i + 1] = finalVal;
    d[i + 2] = finalVal;
  }

  ctx.putImageData(imgData, 0, 0);
}

// ── AUTO-DESKEW ENTERPRISE: Detección y corrección de inclinación angular (-5° a +5°) ──
function detectAndCorrectDeskew(
  srcCanvas: OffscreenCanvas,
  width: number,
  height: number,
): { angle: number; correctedCanvas: OffscreenCanvas } {
  try {
    // Reducir muestra a resolución de análisis rápido (máx 500x700)
    const sampleScale = Math.min(1.0, 600 / Math.max(width, height));
    const sw = Math.max(100, Math.floor(width * sampleScale));
    const sh = Math.max(100, Math.floor(height * sampleScale));

    const sampleCanvas = new OffscreenCanvas(sw, sh);
    const sampleCtx = sampleCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    sampleCtx.drawImage(srcCanvas, 0, 0, sw, sh);

    const sData = sampleCtx.getImageData(0, 0, sw, sh);
    const sd = sData.data;
    const binGrid = new Uint8Array(sw * sh);

    // Muestreo rápido a binario inverso (1 = trazo oscuro de texto)
    for (let i = 0, j = 0; i < sd.length; i += 4, j++) {
      const lum = 0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2];
      binGrid[j] = lum < 160 ? 1 : 0;
    }

    // Evaluar varianza del perfil de proyección horizontal para ángulos entre -4.5° y +4.5°
    const testAngles = [
      -4.5, -4.0, -3.5, -3.0, -2.5, -2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5,
      4.0, 4.5,
    ];

    let maxVariance = -1;
    let bestAngle = 0;

    const yStart = Math.floor(sh * 0.15);
    const yEnd = Math.floor(sh * 0.85);
    const xMid = Math.floor(sw / 2);

    for (const angle of testAngles) {
      const rad = (angle * Math.PI) / 180;
      const tan = Math.tan(rad);
      const rowCounts = new Float64Array(yEnd - yStart);
      let totalSum = 0;

      for (let y = yStart; y < yEnd; y++) {
        let count = 0;
        const rowIndex = y - yStart;
        for (let x = 0; x < sw; x += 2) {
          const dy = Math.round((x - xMid) * tan);
          const sampleY = y + dy;
          if (sampleY >= 0 && sampleY < sh) {
            if (binGrid[sampleY * sw + x] === 1) count++;
          }
        }
        rowCounts[rowIndex] = count;
        totalSum += count;
      }

      const mean = totalSum / rowCounts.length;
      let variance = 0;
      for (let r = 0; r < rowCounts.length; r++) {
        const diff = rowCounts[r] - mean;
        variance += diff * diff;
      }

      if (variance > maxVariance) {
        maxVariance = variance;
        bestAngle = angle;
      }
    }

    // Si el ángulo óptimo es mínimo (< 0.5°), no rotar para evitar distorsiones
    if (Math.abs(bestAngle) < 0.5) {
      return { angle: 0, correctedCanvas: srcCanvas };
    }

    // Refinar en micro-pasos de 0.2° alrededor del mejor ángulo
    let refinedAngle = bestAngle;
    let refinedMaxVar = maxVariance;
    for (const delta of [-0.4, -0.2, 0.2, 0.4]) {
      const angle = bestAngle + delta;
      const rad = (angle * Math.PI) / 180;
      const tan = Math.tan(rad);
      let totalSum = 0;
      const rowCounts = new Float64Array(yEnd - yStart);

      for (let y = yStart; y < yEnd; y++) {
        let count = 0;
        const rowIndex = y - yStart;
        for (let x = 0; x < sw; x += 2) {
          const dy = Math.round((x - xMid) * tan);
          const sampleY = y + dy;
          if (sampleY >= 0 && sampleY < sh) {
            if (binGrid[sampleY * sw + x] === 1) count++;
          }
        }
        rowCounts[rowIndex] = count;
        totalSum += count;
      }

      const mean = totalSum / rowCounts.length;
      let variance = 0;
      for (let r = 0; r < rowCounts.length; r++) {
        const diff = rowCounts[r] - mean;
        variance += diff * diff;
      }

      if (variance > refinedMaxVar) {
        refinedMaxVar = variance;
        refinedAngle = angle;
      }
    }

    // Aplicar rotación geométrica correctiva sobre un nuevo canvas Offscreen
    const correctedCanvas = new OffscreenCanvas(width, height);
    const cCtx = correctedCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, width, height);

    cCtx.save();
    cCtx.translate(width / 2, height / 2);
    // Girar en sentido opuesto al skew detectado para alinear renglones
    cCtx.rotate((-refinedAngle * Math.PI) / 180);
    cCtx.drawImage(srcCanvas, -width / 2, -height / 2);
    cCtx.restore();

    return { angle: refinedAngle, correctedCanvas };
  } catch {
    return { angle: 0, correctedCanvas: srcCanvas };
  }
}

function drawWordsOnPage(
  page: any,
  words: { text: string; rect: { left: number; top: number; right: number; bottom: number } }[],
  font: PDFFont,
  pageH: number,
  scaleX: number,
  scaleY: number,
  effectiveOpacity: number,
) {
  for (const w of words) {
    if (!w.text?.trim()) continue;
    const rect = w.rect;
    if (!rect) continue;
    const { left, top: topC, right, bottom } = rect;
    if (left === 0 && topC === 0 && right === 0 && bottom === 0) continue;

    const wordBoxWidth = Math.max(1, (right - left) * scaleX);
    const wordBoxHeight = Math.max(4, (bottom - topC) * scaleY);

    const x = Math.max(0, left * scaleX);
    const pdfBottom = pageH - bottom * scaleY;
    const y = Math.max(0, pdfBottom + wordBoxHeight * 0.15);

    const cleanWord = sanitizeWordForFont(font, w.text);
    if (!cleanWord || cleanWord.length === 0) continue;

    const widthAtSize1 = font.widthOfTextAtSize(cleanWord, 1);
    let fontSize = wordBoxHeight * 0.88;
    if (widthAtSize1 > 0 && wordBoxWidth > 0) {
      const targetFontSize = wordBoxWidth / widthAtSize1;
      fontSize = Math.max(4, Math.min(wordBoxHeight * 1.25, targetFontSize));
    }
    fontSize = Math.max(4, Math.min(72, fontSize));

    try {
      page.drawText(cleanWord, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        opacity: effectiveOpacity,
      });
    } catch {
      /* skip character encoding exception */
    }
  }
}

export interface OcrWorkerOptions {
  filePrefix: string;
  pdfBuffer: ArrayBuffer;
  ocrLang: string;
  outputFormat: 'pdf' | 'docx' | 'txt' | 'json';
  pageScope: 'all' | 'custom';
  customPageRange: string;
  totalPages: number;
  textOpacity: number;
  numericMode: boolean;
  enhanceContrast: boolean;
  autoDeskew?: boolean;
  metaTitle?: string;
  metaAuthor?: string;
  metaSubject?: string;
  pdfPassword?: string;
  ocrEngine?: 'tesseract' | 'paddleocr';
}

export type OcrWorkerResult =
  | { type: 'progress'; percent: number; message: string; currentPage?: number }
  | {
      type: 'success';
      outputBuffer: ArrayBuffer;
      outputFormat: string;
      filename: string;
      extractedText: string;
      stats?: {
        totalPages: number;
        totalWords: number;
        avgConfidence: number;
        deskewedCount: number;
        processingTimeMs: number;
        ocrEngine?: string;
      };
      jsonData?: string;
    }
  | { type: 'error'; message: string };

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
  const startTime = Date.now();

  try {
    post({
      type: 'progress',
      percent: 2,
      message: 'Iniciando motor OCR Enterprise v5.0 en WebAssembly...',
    });

    // Carga de PDF.js en el Web Worker con soporte cMaps y JBIG2 WASM
    const origin = typeof self !== 'undefined' && self.location?.origin ? self.location.origin : '';
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = origin
      ? `${origin}/pdfjs/pdf.worker.min.mjs`
      : '/pdfjs/pdf.worker.min.mjs';

    const pdfjsData = new Uint8Array(opts.pdfBuffer.slice(0));

    post({ type: 'progress', percent: 6, message: 'Analizando estructura vectorial del PDF...' });

    const loadParams: Record<string, unknown> = {
      data: pdfjsData,
      cMapUrl: origin ? `${origin}/pdfjs/cmaps/` : '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: origin ? `${origin}/pdfjs/standard_fonts/` : '/pdfjs/standard_fonts/',
      wasmUrl: origin ? `${origin}/pdfjs/wasm/` : '/pdfjs/wasm/',
      stopAtErrors: false,
    };
    if (opts.pdfPassword) {
      loadParams.password = opts.pdfPassword;
    }

    const pdfjsDoc = await pdfjsLib.getDocument(loadParams).promise;
    const totalPagesActual: number = pdfjsDoc.numPages;

    const targetPages =
      opts.pageScope === 'all'
        ? (() => {
            const s = new Set<number>();
            for (let i = 1; i <= totalPagesActual; i++) s.add(i);
            return s;
          })()
        : parsePageRange(opts.customPageRange, totalPagesActual);

    let paddleService: any = null;
    let tessWorker: any = null;

    if (opts.ocrEngine === 'paddleocr') {
      post({
        type: 'progress',
        percent: 12,
        message: 'Cargando red neuronal profunda PaddleOCR (ONNX Web)...',
      });
      try {
        const {
          PaddleOcrService,
          V5_LATIN_MOBILE_MODEL,
          V5_MOBILE_MODEL,
          V3_JAPANESE_MOBILE_MODEL,
          V5_ARABIC_MOBILE_MODEL,
          V5_CYRILLIC_MOBILE_MODEL,
        } = await import('ppu-paddle-ocr/web');

        let modelPreset = V5_LATIN_MOBILE_MODEL;
        if (opts.ocrLang === 'chi_sim') modelPreset = V5_MOBILE_MODEL;
        else if (opts.ocrLang === 'jpn') modelPreset = V3_JAPANESE_MOBILE_MODEL;
        else if (opts.ocrLang === 'ara') modelPreset = V5_ARABIC_MOBILE_MODEL;
        else if (opts.ocrLang === 'rus') modelPreset = V5_CYRILLIC_MOBILE_MODEL;

        paddleService = new PaddleOcrService({
          model: modelPreset,
          processing: { engine: 'canvas-native' },
          session: {
            executionProviders: ['wasm'],
          },
        });
        await paddleService.initialize();
      } catch (errPaddle) {
        console.warn('Fallback a Tesseract tras fallo de inicialización en PaddleOCR:', errPaddle);
        paddleService = null;
      }
    }

    if (!paddleService) {
      post({
        type: 'progress',
        percent: 12,
        message: `Cargando red neuronal LSTM para idioma (${opts.ocrLang || 'spa'})...`,
      });

      const { createWorker } = await import('tesseract.js');
      const langCode = opts.ocrLang || 'spa';
      try {
        tessWorker = await createWorker(langCode, 1, {
          workerBlobURL: true,
        });
      } catch (err1) {
        console.warn('Fallback a worker estándar de Tesseract...', err1);
        tessWorker = await createWorker(langCode, 1);
      }

      // Si está activado el modo numérico / financiero, configuramos parámetros especializados
      if (opts.numericMode) {
        try {
          await tessWorker.setParameters({
            tessedit_char_whitelist: '0123456789.,-$/€£%+=*#()[]{}:; \n\r\t',
          });
        } catch (paramErr) {
          console.warn('No se pudo fijar whitelist numérico:', paramErr);
        }
      }
    }

    post({
      type: 'progress',
      percent: 18,
      message: `Motor ${paddleService ? 'PaddleOCR AI (ONNX)' : 'Tesseract v5'} listo. Iniciando pipeline...`,
    });

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
      jpegBytes?: Uint8Array;
      deskewAngle: number;
    }

    const pageResults: PageResult[] = [];
    let fullTextAccumulator = '';
    const jsonResults: object[] = [];
    const totalCount = targetPages.size;
    let processedCount = 0;
    let totalConfidenceSum = 0;
    let totalWordCount = 0;
    let deskewedCount = 0;

    for (let i = 0; i < totalPagesActual; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      processedCount++;
      const pct = 18 + Math.round((processedCount / totalCount) * 58);
      post({
        type: 'progress',
        percent: pct,
        message: `Pág. ${pageNum}/${totalPagesActual}: Renderizando en escala 2.0x...`,
        currentPage: pageNum,
      });

      // Renderizar página a resolución optimizada (2x scale para máxima nitidez OCR)
      const pdfjsPage = await pdfjsDoc.getPage(pageNum);
      const viewport = pdfjsPage.getViewport({ scale: 2.0 });

      let canvas = new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await pdfjsPage.render({
        canvasContext: ctx as any,
        viewport,
        canvasFactory: new WorkerCanvasFactory(),
      } as any).promise;

      // 1. AUTO-DESKEW (Corrección de inclinación si está habilitada)
      let deskewAngle = 0;
      if (opts.autoDeskew !== false) {
        const deskewRes = detectAndCorrectDeskew(canvas, canvas.width, canvas.height);
        deskewAngle = deskewRes.angle;
        if (Math.abs(deskewAngle) >= 0.5) {
          canvas = deskewRes.correctedCanvas;
          deskewedCount++;
          post({
            type: 'progress',
            percent: pct,
            message: `Pág. ${pageNum}: Inclinación corregida (${deskewAngle > 0 ? '+' : ''}${deskewAngle.toFixed(1)}°)...`,
            currentPage: pageNum,
          });
        }
      }

      // 2. PREPROCESAMIENTO OTSU (Purificación de fondos y sombras)
      if (opts.enhanceContrast) {
        const cCtx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        applyOtsuAdaptiveBinarization(cCtx, canvas.width, canvas.height);
      }

      // 3. Generar imagen JPEG con calidad 0.89 (alta nitidez tipográfica)
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.89 });
      const arrayBuf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      let binary = '';
      for (let b = 0; b < uint8.byteLength; b++) binary += String.fromCharCode(uint8[b]);
      const imageDataUrl = 'data:image/jpeg;base64,' + btoa(binary);

      interface OcrItem {
        text: string;
        rect: { left: number; top: number; right: number; bottom: number };
        confidence: number;
      }

      const extractedItems: OcrItem[] = [];
      let pageText = '';
      let pageConfidence = 95;

      if (paddleService) {
        post({
          type: 'progress',
          percent: pct,
          message: `Pág. ${pageNum}: Analizando detección de texto DBNet (PaddleOCR AI)...`,
          currentPage: pageNum,
        });

        try {
          const paddleRes = await paddleService.recognize(arrayBuf, { flatten: true });
          pageText = paddleRes.text || '';
          pageConfidence = Math.round((paddleRes.confidence || 0.95) * 100);

          if (Array.isArray(paddleRes.results)) {
            for (const item of paddleRes.results) {
              const textClean = (item.text || '').trim();
              if (!textClean) continue;
              const b = item.box;
              const left = Math.max(0, Math.round(b.x));
              const top = Math.max(0, Math.round(b.y));
              const right = Math.min(canvas.width, Math.round(b.x + b.width));
              const bottom = Math.min(canvas.height, Math.round(b.y + b.height));
              const itemConf = Math.round((item.confidence || 0.9) * 100);

              const words = textClean.split(/\s+/).filter(Boolean);
              if (words.length <= 1) {
                extractedItems.push({
                  text: textClean,
                  rect: { left, top, right, bottom },
                  confidence: itemConf,
                });
              } else {
                const totalChars = words.reduce((sum: number, w: string) => sum + w.length, 0);
                const totalWidth = Math.max(1, right - left);
                let currentLeft = left;
                for (const w of words) {
                  const wWidth = Math.max(1, Math.round((w.length / totalChars) * totalWidth));
                  extractedItems.push({
                    text: w,
                    rect: {
                      left: currentLeft,
                      top,
                      right: Math.min(right, currentLeft + wWidth),
                      bottom,
                    },
                    confidence: itemConf,
                  });
                  currentLeft += wWidth;
                }
              }
            }
          }
        } catch (paddleErr) {
          console.error(`Error en PaddleOCR pág ${pageNum}:`, paddleErr);
        }
      } else {
        post({
          type: 'progress',
          percent: pct,
          message: `Pág. ${pageNum}: Extrayendo texto y coordenadas HOCR (Tesseract)...`,
          currentPage: pageNum,
        });

        // Reconocimiento Tesseract con coordenadas HOCR y TSV
        const ret = await tessWorker.recognize(
          imageDataUrl,
          {},
          { text: true, blocks: true, hocr: true, tsv: true },
        );

        pageText = ret.data.text || '';
        pageConfidence = ret.data.confidence || 95;
        const dataAny = ret.data as any;

        // Parsear HOCR para coordenadas exactas
        if (typeof dataAny.hocr === 'string' && dataAny.hocr.length > 0) {
          const wordRegex =
            /class=['"](?:ocrx_word|ocr_word)['"][^>]*title=['"]bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)[^'"]*['"][^>]*>([\s\S]*?)<\/span>/gi;
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
                confidence: ret.data.confidence || 95,
              });
            }
          }
        }

        // Fallback a TSV si HOCR no devolvió palabras
        if (
          extractedItems.length === 0 &&
          typeof dataAny.tsv === 'string' &&
          dataAny.tsv.trim().length > 0
        ) {
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
      }

      let rawText = pageText;
      if (opts.numericMode) {
        rawText = rawText.replace(/(\d+[.,]?\d*)/g, '$1');
      }
      fullTextAccumulator += `--- PÁGINA ${pageNum} ---\n${rawText}\n\n`;

      const { width: pdfW, height: pdfH } = pdfjsPage.getViewport({ scale: 1 });

      totalConfidenceSum += pageConfidence;
      totalWordCount += extractedItems.length;

      post({
        type: 'progress',
        percent: pct,
        message: `Pág. ${pageNum}: ${extractedItems.length} palabras indexadas (${pageConfidence.toFixed(0)}% confianza)`,
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
        jpegBytes: uint8,
        deskewAngle,
      });

      jsonResults.push({
        page: pageNum,
        confidence: `${pageConfidence.toFixed(1)}%`,
        deskewAngleDegrees: deskewAngle,
        wordCount: extractedItems.length,
        words: extractedItems.map((w) => ({
          text: w.text,
          bbox: [w.rect.left, w.rect.top, w.rect.right, w.rect.bottom],
        })),
      });
    }

    await tessWorker.terminate();

    // ── ENSAMBLAJE DE SALIDA ENTERPRISE ──
    post({
      type: 'progress',
      percent: 80,
      message: 'Ensamblando PDF Sandwich ISO 32000-1 con capa invisible...',
    });

    const originalName = opts.filePrefix;
    let outputBuffer: ArrayBuffer;
    let filename: string;

    if (opts.outputFormat === 'pdf') {
      let outPdf: PDFDocument;
      let usedDirectInjection = false;

      // Si se procesan todas las páginas y no hubo rotación de deskew que modifique la imagen base,
      // podemos usar inyección vectorial directa sobre el PDF original
      if (opts.pageScope === 'all' && deskewedCount === 0) {
        try {
          outPdf = await PDFDocument.load(opts.pdfBuffer.slice(0), { ignoreEncryption: true });
          usedDirectInjection = true;
        } catch (loadErr) {
          console.warn('Fallback a reconstrucción PDF:', loadErr);
          outPdf = await PDFDocument.create();
        }
      } else {
        outPdf = await PDFDocument.create();
      }

      // Metadatos
      if (opts.metaTitle) outPdf.setTitle(opts.metaTitle);
      if (opts.metaAuthor) outPdf.setAuthor(opts.metaAuthor);
      if (opts.metaSubject) outPdf.setSubject(opts.metaSubject);
      outPdf.setProducer(
        opts.ocrEngine === 'paddleocr'
          ? 'PDFBlack — PaddleOCR AI Engine (Deep Learning ONNX Web)'
          : 'PDFBlack — Tesseract LSTM Engine v5.0 (WASM)',
      );
      outPdf.setCreationDate(new Date());
      outPdf.setModificationDate(new Date());

      const outFont = await outPdf.embedFont(StandardFonts.Helvetica);
      const effectiveOpacity = opts.textOpacity > 0 ? opts.textOpacity / 100 : 0;

      if (usedDirectInjection) {
        // Inyección directa: el PDF original se mantiene 100% idéntico y solo se inyecta la capa invisible
        for (let pi = 0; pi < pageResults.length; pi++) {
          const pct = 80 + Math.round((pi / pageResults.length) * 16);
          post({
            type: 'progress',
            percent: pct,
            message: `Inyectando capa invisible en página ${pageResults[pi].pageNum}...`,
          });

          const imgData = pageResults[pi];
          const outPage = outPdf.getPage(imgData.pageNum - 1);
          const pageW = outPage.getWidth();
          const pageH = outPage.getHeight();

          const scaleX = pageW / imgData.canvasW;
          const scaleY = pageH / imgData.canvasH;

          drawWordsOnPage(outPage, imgData.words, outFont, pageH, scaleX, scaleY, effectiveOpacity);
        }
      } else {
        // Reconstrucción optimizada: páginas seleccionadas o páginas con corrección de deskew
        for (let pi = 0; pi < pageResults.length; pi++) {
          const pct = 80 + Math.round((pi / pageResults.length) * 16);
          post({
            type: 'progress',
            percent: pct,
            message: `Ensamblando página sandwich ${pi + 1}/${pageResults.length}...`,
          });

          const imgData = pageResults[pi];
          const outPage = outPdf.addPage([imgData.pdfW, imgData.pdfH]);

          if (imgData.jpegBytes) {
            const jpgImage = await outPdf.embedJpg(imgData.jpegBytes);
            outPage.drawImage(jpgImage, { x: 0, y: 0, width: imgData.pdfW, height: imgData.pdfH });
          } else {
            const pngImage = await outPdf.embedPng(imgData.imageDataUrl);
            outPage.drawImage(pngImage, { x: 0, y: 0, width: imgData.pdfW, height: imgData.pdfH });
          }

          const scaleX = imgData.pdfW / imgData.canvasW;
          const scaleY = imgData.pdfH / imgData.canvasH;

          drawWordsOnPage(
            outPage,
            imgData.words,
            outFont,
            imgData.pdfH,
            scaleX,
            scaleY,
            effectiveOpacity,
          );
        }
      }

      post({ type: 'progress', percent: 96, message: 'Finalizando y guardando PDF indexado...' });
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
      filename = `${originalName}_OCR_Buscable.pdf`;
    } else if (opts.outputFormat === 'docx') {
      const enc = new TextEncoder().encode(fullTextAccumulator);
      outputBuffer = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
      filename = `${originalName}_OCR_Editable.docx`;
    } else if (opts.outputFormat === 'json') {
      const jsonStr = JSON.stringify(
        {
          filename: opts.filePrefix,
          totalPages: targetPages.size,
          avgConfidence: (totalConfidenceSum / Math.max(1, processedCount)).toFixed(1) + '%',
          totalWords: totalWordCount,
          deskewedCount,
          pages: jsonResults,
        },
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

    // Liberar recursos de motores OCR
    if (tessWorker) {
      try {
        await tessWorker.terminate();
      } catch {}
    }
    if (paddleService) {
      try {
        await paddleService.destroy();
      } catch {}
    }

    const duration = Date.now() - startTime;
    post({ type: 'progress', percent: 100, message: '¡Reconocimiento OCR completado con éxito!' });
    post({
      type: 'success',
      outputBuffer,
      outputFormat: opts.outputFormat,
      filename,
      extractedText: fullTextAccumulator,
      stats: {
        totalPages: processedCount,
        totalWords: totalWordCount,
        avgConfidence: totalConfidenceSum / Math.max(1, processedCount),
        deskewedCount,
        processingTimeMs: duration,
        ocrEngine: opts.ocrEngine === 'paddleocr' ? 'PaddleOCR AI (ONNX)' : 'Tesseract v5 (LSTM)',
      },
      jsonData: opts.outputFormat === 'json' ? JSON.stringify(jsonResults) : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message: msg });
  }
};
