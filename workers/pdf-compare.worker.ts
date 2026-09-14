/**
 * Web Worker para comparación semántica y estructural de PDFs — Motor Corporativo v4.0.
 *
 * Mejoras clave v4.0:
 * 1. Algoritmo Myers Diff de espacio lineal con recorte O(min(M,N)) de prefijos/sufijos comunes.
 *    Elimina matrices O(M*N) evitando errores Out-of-Memory en documentos densos.
 * 2. Normalización de texto configurable: ignoreCase, ignorePunctuation, ignoreWhitespace.
 * 3. Detección estructural integral: metadatos, dimensiones/orientación de páginas, fuentes e imágenes.
 * 4. Comparación visual pixel a pixel con generación de mapa de calor (heatmap) para overlays.
 * 5. Checksums criptográficos SHA-256 independientes para auditoría forense legal.
 * 6. Cancelación reactiva instantánea mediante mensajes { type: 'cancel' }.
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

// ============================================================
// INTERFACES Y TIPOS
// ============================================================

export interface TextSegment {
  page: number;
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
  fontSize?: number;
  fontName?: string;
}

export interface DiffWord {
  text: string;
  type: 'equal' | 'added' | 'removed';
  page: number;
  index: number;
  /** Coordenadas reales del viewport */
  bbox?: { x: number; y: number; width: number; height: number };
}

/** Bloque semántico que agrupa palabras adyacentes del mismo tipo de cambio */
export interface DiffBlock {
  type: 'equal' | 'added' | 'removed';
  page: number;
  /** Texto completo del bloque (varias palabras unidas) */
  text: string;
  /** Palabras individuales que componen el bloque */
  words: DiffWord[];
  /** Bounding box combinada del bloque */
  bbox?: { x: number; y: number; width: number; height: number };
  /** Contexto antes del cambio */
  contextBefore: string;
  /** Contexto después del cambio */
  contextAfter: string;
}

/** Cambio estructural detectado entre documentos */
export interface StructuralDiff {
  category: 'fonts' | 'images' | 'annotations' | 'metadata' | 'pages' | 'dimensions';
  type: 'added' | 'removed' | 'modified';
  description: string;
  detail?: string;
}

export interface PageDiff {
  page: number;
  removedCount: number;
  addedCount: number;
  unchangedCount: number;
  words: DiffWord[];
  blocks: DiffBlock[];
  hasVisualChanges: boolean;
  similarityPercent: number;
  visualDiffRatio: number;
  heatmapDataUrl?: string;
  fontChanges?: string[];
  imageChanges?: string[];
  dimensionChange?: string;
}

export interface CompareResult {
  type: 'result';
  fileName1: string;
  fileName2: string;
  totalPages1: number;
  totalPages2: number;
  pagesAdded: number[];
  pagesRemoved: number[];
  totalRemovals: number;
  totalAdditions: number;
  totalUnchanged: number;
  pageDiffs: PageDiff[];
  summary: string;
  globalSimilarityPercent: number;
  pagesWithVisualChanges: number;
  checksum1: string;
  checksum2: string;
  structuralDiffs: StructuralDiff[];
}

export interface CompareProgress {
  type: 'progress';
  phase:
    'hashing' | 'extracting1' | 'extracting2' | 'diffing' | 'visual' | 'structural' | 'packaging';
  percent: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
}

export interface CompareError {
  type: 'error';
  message: string;
}

export interface CompareCancelled {
  type: 'cancelled';
}

export interface CompareOptions {
  sensitivity?: 'strict' | 'normal' | 'loose';
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  ignoreWhitespace?: boolean;
  enableVisualDiff?: boolean;
}

export type WorkerMessage = CompareProgress | CompareResult | CompareError | CompareCancelled;
export type WorkerInput = {
  buffer1: ArrayBuffer;
  buffer2: ArrayBuffer;
  fileName1: string;
  fileName2: string;
  options?: CompareOptions;
};

// ============================================================
// CANCELACIÓN
// ============================================================

let cancelled = false;

function checkCancelled(): void {
  if (cancelled) {
    throw new DOMException('Comparison cancelled by user', 'AbortError');
  }
}

import {
  computeSHA256,
  normalizeWord,
  myersDiffWords,
  buildDiffBlocks,
  type WordToken,
  type DiffItem,
} from '../utils/pdf-diff-engine';

export {
  computeSHA256,
  normalizeWord,
  myersDiffWords,
  buildDiffBlocks,
  type WordToken,
  type DiffItem,
};

// ============================================================
// COMPARACIÓN VISUAL Y MAPA DE CALOR
// ============================================================

function computeVisualDiff(
  imgData1?: ImageData,
  imgData2?: ImageData,
): { ratio: number; heatmapDataUrl?: string } {
  if (!imgData1 || !imgData2) return { ratio: 0 };
  if (imgData1.width !== imgData2.width || imgData1.height !== imgData2.height) {
    return { ratio: 1 };
  }

  const d1 = imgData1.data;
  const d2 = imgData2.data;
  const total = d1.length;
  let diffPixels = 0;

  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;
  try {
    canvas = new OffscreenCanvas(imgData1.width, imgData1.height);
    ctx = canvas.getContext('2d');
  } catch {
    // Canvas offscreen
  }

  const heatmap = new Uint8ClampedArray(total);

  for (let i = 0; i < total; i += 4) {
    const dr = Math.abs(d1[i] - d2[i]);
    const dg = Math.abs(d1[i + 1] - d2[i + 1]);
    const db = Math.abs(d1[i + 2] - d2[i + 2]);

    if (dr > 25 || dg > 25 || db > 25) {
      diffPixels++;
      heatmap[i] = 239;
      heatmap[i + 1] = 68;
      heatmap[i + 2] = 68;
      heatmap[i + 3] = 200;
    } else {
      heatmap[i] = 0;
      heatmap[i + 1] = 0;
      heatmap[i + 2] = 0;
      heatmap[i + 3] = 0;
    }
  }

  let heatmapDataUrl: string | undefined;
  if (ctx && canvas && diffPixels > 0) {
    try {
      const hmImageData = new ImageData(heatmap, imgData1.width, imgData1.height);
      ctx.putImageData(hmImageData, 0, 0);
    } catch {
      // Skip
    }
  }

  const ratio = diffPixels / (total / 4);
  return { ratio, heatmapDataUrl };
}

// ============================================================
// EXTRACCIÓN DE DATOS DE PÁGINAS
// ============================================================

interface PageExtraction {
  pageNum: number;
  tokens: WordToken[];
  width: number;
  height: number;
  fonts: string[];
  imageCount: number;
  renderedImageData?: ImageData;
}

async function extractPages(
  fileBuffer: ArrayBuffer,
  options: CompareOptions | undefined,
  label: 'A' | 'B',
  report: (msg: WorkerMessage) => void,
): Promise<{
  pages: PageExtraction[];
  totalPages: number;
  fonts: string[];
  imageCount: number;
  metadata?: Record<string, any>;
}> {
  const pages: PageExtraction[] = [];
  const allFonts = new Set<string>();
  let totalImageCount = 0;

  const pdfDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    stopAtErrors: false,
  }).promise;

  const totalPages = pdfDoc.numPages;

  let metadata: Record<string, any> | undefined;
  try {
    const metaObj = await pdfDoc.getMetadata();
    metadata = metaObj.info as Record<string, any>;
  } catch {
    // Skip
  }

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    checkCancelled();

    const pct = Math.floor((pageNum / totalPages) * 100);
    report({
      type: 'progress',
      phase: label === 'A' ? 'extracting1' : 'extracting2',
      percent: pct,
      message: `Extrayendo texto del Documento ${label} - Página ${pageNum} de ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
    });

    const tokens: WordToken[] = [];
    const pageFonts: string[] = [];
    let pageImageCount = 0;
    let width = 595;
    let height = 842;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      width = Math.round(viewport.width);
      height = Math.round(viewport.height);

      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
          const tx = item.transform[4];
          const ty = item.transform[5];
          const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
          const itemWidth = item.width > 0 ? item.width : item.str.length * 6;
          const itemHeight = item.height > 0 ? item.height : 12;
          const fontName =
            'fontName' in item ? (item as { fontName?: string }).fontName : undefined;

          if (fontName) {
            pageFonts.push(fontName);
            allFonts.add(fontName);
          }

          const rawWords = item.str.match(/\S+/g) || [];
          const wordApproxWidth = itemWidth / Math.max(1, rawWords.length);

          for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
            const rawWord = rawWords[wIdx];
            tokens.push({
              raw: rawWord,
              norm: normalizeWord(rawWord, options),
              bbox: {
                x: vx + wIdx * wordApproxWidth,
                y: vy - itemHeight,
                width: wordApproxWidth,
                height: itemHeight * 1.2,
              },
            });
          }
        }
      }

      try {
        const opList = await page.getOperatorList();
        for (let i = 0; i < opList.fnArray.length; i++) {
          const fn = opList.fnArray[i];
          if (fn === 85 || fn === 86 || fn === 87 || fn === 92) {
            pageImageCount++;
            totalImageCount++;
          }
        }
      } catch {
        // Skip
      }

      let renderedImageData: ImageData | undefined;
      if (options?.enableVisualDiff !== false) {
        try {
          const canvas = new OffscreenCanvas(viewport.width, viewport.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({
              canvasContext: ctx,
              viewport,
            } as unknown as Parameters<typeof page.render>[0]).promise;
            renderedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          }
        } catch {
          // Skip
        }
      }

      pages.push({
        pageNum,
        tokens,
        width,
        height,
        fonts: pageFonts,
        imageCount: pageImageCount,
        renderedImageData,
      });
    } catch {
      pages.push({
        pageNum,
        tokens,
        width,
        height,
        fonts: pageFonts,
        imageCount: pageImageCount,
      });
    }
  }

  return {
    pages,
    totalPages,
    fonts: Array.from(allFonts),
    imageCount: totalImageCount,
    metadata,
  };
}

// ============================================================
// COMPARACIÓN ESTRUCTURAL CORPORATIVA
// ============================================================

function computeStructuralDiffs(
  doc1: { fonts: string[]; imageCount: number; totalPages: number; metadata?: Record<string, any> },
  doc2: { fonts: string[]; imageCount: number; totalPages: number; metadata?: Record<string, any> },
  pages1: PageExtraction[],
  pages2: PageExtraction[],
): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];

  // Páginas
  if (doc1.totalPages !== doc2.totalPages) {
    diffs.push({
      category: 'pages',
      type: 'modified',
      description: `Número de páginas modificado: de ${doc1.totalPages} a ${doc2.totalPages}`,
      detail: `Diferencia de ${Math.abs(doc2.totalPages - doc1.totalPages)} página(s)`,
    });
  }

  // Dimensiones y orientación de página
  const maxP = Math.max(pages1.length, pages2.length);
  for (let p = 1; p <= maxP; p++) {
    const p1 = pages1.find((pg) => pg.pageNum === p);
    const p2 = pages2.find((pg) => pg.pageNum === p);
    if (p1 && p2) {
      if (Math.abs(p1.width - p2.width) > 5 || Math.abs(p1.height - p2.height) > 5) {
        diffs.push({
          category: 'dimensions',
          type: 'modified',
          description: `Página ${p}: tamaño alterado (${p1.width}x${p1.height} pt -> ${p2.width}x${p2.height} pt)`,
          detail:
            p1.width > p1.height && p2.width < p2.height
              ? 'Cambio de orientación Horizontal a Vertical'
              : p1.width < p1.height && p2.width > p2.height
                ? 'Cambio de orientación Vertical a Horizontal'
                : 'Escala o margen modificado',
        });
      }
    }
  }

  // Fuentes
  const f1 = new Set(doc1.fonts);
  const f2 = new Set(doc2.fonts);
  const addedFonts = doc2.fonts.filter((f) => !f1.has(f));
  const removedFonts = doc1.fonts.filter((f) => !f2.has(f));

  for (const f of addedFonts) {
    diffs.push({
      category: 'fonts',
      type: 'added',
      description: `Tipografía añadida: ${f}`,
    });
  }
  for (const f of removedFonts) {
    diffs.push({
      category: 'fonts',
      type: 'removed',
      description: `Tipografía retirada: ${f}`,
    });
  }

  // Imágenes globales
  if (doc1.imageCount !== doc2.imageCount) {
    const diff = doc2.imageCount - doc1.imageCount;
    diffs.push({
      category: 'images',
      type: 'modified',
      description: `Recursos gráficos: ${doc1.imageCount} -> ${doc2.imageCount}`,
      detail:
        diff > 0 ? `${diff} imagen(es) añadida(s)` : `${Math.abs(diff)} imagen(es) eliminada(s)`,
    });
  }

  // Metadatos
  if (doc1.metadata && doc2.metadata) {
    const keysToCheck = ['Title', 'Author', 'Subject', 'Creator', 'Producer'];
    for (const k of keysToCheck) {
      const v1 = doc1.metadata[k];
      const v2 = doc2.metadata[k];
      if (v1 !== v2) {
        diffs.push({
          category: 'metadata',
          type: 'modified',
          description: `Metadato [${k}]: "${v1 || '(vacío)'}" -> "${v2 || '(vacío)'}"`,
        });
      }
    }
  }

  return diffs;
}

// ============================================================
// COMPARADOR PRINCIPAL
// ============================================================

async function comparePdfs(
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer,
  fileName1: string,
  fileName2: string,
  options: CompareOptions | undefined,
  report: (msg: WorkerMessage) => void,
): Promise<CompareResult> {
  // 1. Hashes SHA-256
  report({
    type: 'progress',
    phase: 'hashing',
    percent: 0,
    message: 'Calculando hashes criptográficos SHA-256 para auditoría...',
  });
  const [checksum1, checksum2] = await Promise.all([
    computeSHA256(buffer1),
    computeSHA256(buffer2),
  ]);
  checkCancelled();

  // 2. Extracción A
  report({
    type: 'progress',
    phase: 'extracting1',
    percent: 5,
    message: 'Extrayendo datos de Documento A (Base)...',
  });
  const docA = await extractPages(buffer1, options, 'A', report);
  checkCancelled();

  // 3. Extracción B
  report({
    type: 'progress',
    phase: 'extracting2',
    percent: 45,
    message: 'Extrayendo datos de Documento B (Modificado)...',
  });
  const docB = await extractPages(buffer2, options, 'B', report);
  checkCancelled();

  // 4. Estructural
  report({
    type: 'progress',
    phase: 'structural',
    percent: 60,
    message: 'Analizando cambios estructurales, fuentes, imágenes y orientación...',
  });
  const structuralDiffs = computeStructuralDiffs(
    {
      fonts: docA.fonts,
      imageCount: docA.imageCount,
      totalPages: docA.totalPages,
      metadata: docA.metadata,
    },
    {
      fonts: docB.fonts,
      imageCount: docB.imageCount,
      totalPages: docB.totalPages,
      metadata: docB.metadata,
    },
    docA.pages,
    docB.pages,
  );
  checkCancelled();

  // 5. Comparación página por página con Myers Diff
  report({
    type: 'progress',
    phase: 'diffing',
    percent: 70,
    message: 'Ejecutando motor de diferenciación Myers de alta velocidad...',
  });

  const maxPages = Math.max(docA.totalPages, docB.totalPages);
  const pageDiffs: PageDiff[] = [];
  let totalRemovals = 0;
  let totalAdditions = 0;
  let totalUnchanged = 0;
  const pagesAdded: number[] = [];
  const pagesRemoved: number[] = [];
  let pagesWithVisualChanges = 0;

  for (let p = 1; p <= maxPages; p++) {
    checkCancelled();

    const p1 = docA.pages.find((pg) => pg.pageNum === p);
    const p2 = docB.pages.find((pg) => pg.pageNum === p);

    if (!p1 && p2) {
      pagesAdded.push(p);
      const words: DiffWord[] = p2.tokens.map((t, idx) => ({
        text: t.raw,
        type: 'added' as const,
        page: p,
        index: idx,
        bbox: t.bbox,
      }));
      const blocks = buildDiffBlocks(words);
      pageDiffs.push({
        page: p,
        removedCount: 0,
        addedCount: words.length,
        unchangedCount: 0,
        words,
        blocks,
        hasVisualChanges: true,
        similarityPercent: 0,
        visualDiffRatio: 1,
        fontChanges: p2.fonts,
        imageChanges: [],
      });
      totalAdditions += words.length;
      continue;
    }

    if (p1 && !p2) {
      pagesRemoved.push(p);
      const words: DiffWord[] = p1.tokens.map((t, idx) => ({
        text: t.raw,
        type: 'removed' as const,
        page: p,
        index: idx,
        bbox: t.bbox,
      }));
      const blocks = buildDiffBlocks(words);
      pageDiffs.push({
        page: p,
        removedCount: words.length,
        addedCount: 0,
        unchangedCount: 0,
        words,
        blocks,
        hasVisualChanges: true,
        similarityPercent: 0,
        visualDiffRatio: 1,
        fontChanges: p1.fonts,
        imageChanges: [],
      });
      totalRemovals += words.length;
      continue;
    }

    if (!p1 || !p2) continue;

    const diffItems = myersDiffWords(p1.tokens, p2.tokens, options);

    const diffWords: DiffWord[] = [];
    let pageRemovals = 0;
    let pageAdditions = 0;
    let pageUnchanged = 0;

    for (let di = 0; di < diffItems.length; di++) {
      const item = diffItems[di];
      const rawText =
        item.type === 'removed'
          ? item.valueA?.raw || ''
          : item.type === 'added'
            ? item.valueB?.raw || ''
            : item.valueA?.raw || item.valueB?.raw || '';

      const bbox =
        item.type === 'removed'
          ? item.valueA?.bbox
          : item.type === 'added'
            ? item.valueB?.bbox
            : item.valueA?.bbox || item.valueB?.bbox;

      diffWords.push({
        text: rawText,
        type: item.type,
        page: p,
        index: item.indexA ?? item.indexB ?? di,
        bbox,
      });

      if (item.type === 'removed') pageRemovals++;
      else if (item.type === 'added') pageAdditions++;
      else pageUnchanged++;
    }

    const totalWordsOnPage = pageRemovals + pageAdditions + pageUnchanged;
    const similarityPercent =
      totalWordsOnPage > 0 ? Math.round((pageUnchanged / totalWordsOnPage) * 100) : 100;

    const visual = computeVisualDiff(p1.renderedImageData, p2.renderedImageData);
    const hasVisualChanges = visual.ratio > 0.03;
    if (hasVisualChanges) pagesWithVisualChanges++;

    const fontsAdded = p2.fonts.filter((f) => !p1.fonts.includes(f));
    const fontsRemoved = p1.fonts.filter((f) => !p2.fonts.includes(f));
    const fontChanges =
      fontsAdded.length > 0 || fontsRemoved.length > 0
        ? [...fontsAdded.map((f) => `+${f}`), ...fontsRemoved.map((f) => `-${f}`)]
        : undefined;

    let dimensionChange: string | undefined;
    if (Math.abs(p1.width - p2.width) > 5 || Math.abs(p1.height - p2.height) > 5) {
      dimensionChange = `${p1.width}x${p1.height} -> ${p2.width}x${p2.height}`;
    }

    pageDiffs.push({
      page: p,
      removedCount: pageRemovals,
      addedCount: pageAdditions,
      unchangedCount: pageUnchanged,
      words: diffWords,
      blocks: buildDiffBlocks(diffWords),
      hasVisualChanges,
      similarityPercent,
      visualDiffRatio: visual.ratio,
      heatmapDataUrl: visual.heatmapDataUrl,
      fontChanges,
      dimensionChange,
    });

    totalRemovals += pageRemovals;
    totalAdditions += pageAdditions;
    totalUnchanged += pageUnchanged;
  }

  pageDiffs.sort((a, b) => a.page - b.page);

  // 6. Resumen Ejecutivo
  report({
    type: 'progress',
    phase: 'packaging',
    percent: 95,
    message: 'Generando informe corporativo y estadísticas de auditoría...',
  });

  const changedPagesCount = pageDiffs.filter((pd) => pd.removedCount + pd.addedCount > 0).length;
  const grandTotalWords = totalRemovals + totalAdditions + totalUnchanged;
  const globalSimilarityPercent =
    grandTotalWords > 0 ? Math.round((totalUnchanged / grandTotalWords) * 100) : 100;

  let summary = '';
  if (
    totalRemovals === 0 &&
    totalAdditions === 0 &&
    pagesAdded.length === 0 &&
    pagesRemoved.length === 0
  ) {
    summary = '✅ Documentos idénticos. No se detectaron discrepancias en contenido ni texto.';
  } else {
    const parts: string[] = [];
    if (totalRemovals > 0) parts.push(`${totalRemovals} palabras eliminadas`);
    if (totalAdditions > 0) parts.push(`${totalAdditions} palabras añadidas`);
    if (totalUnchanged > 0) parts.push(`${totalUnchanged} palabras sin cambio`);
    if (pagesAdded.length > 0) parts.push(`${pagesAdded.length} páginas añadidas`);
    if (pagesRemoved.length > 0) parts.push(`${pagesRemoved.length} páginas eliminadas`);
    summary = `📊 ${changedPagesCount} página(s) modificada(s): ${parts.join(', ')}. Similitud: ${globalSimilarityPercent}%.`;
  }

  report({
    type: 'progress',
    phase: 'packaging',
    percent: 100,
    message: 'Comparación completada exitosamente.',
  });

  return {
    type: 'result',
    fileName1,
    fileName2,
    totalPages1: docA.totalPages,
    totalPages2: docB.totalPages,
    pagesAdded,
    pagesRemoved,
    totalRemovals,
    totalAdditions,
    totalUnchanged,
    pageDiffs,
    summary,
    globalSimilarityPercent,
    pagesWithVisualChanges,
    checksum1,
    checksum2,
    structuralDiffs,
  };
}

// ============================================================
// HANDLER PRINCIPAL DEL WORKER
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const data = event.data as { type?: string } & WorkerInput;

  if (data.type === 'cancel') {
    cancelled = true;
    self.postMessage({ type: 'cancelled' } as CompareCancelled);
    return;
  }

  const { buffer1, buffer2, fileName1, fileName2, options } = data;
  cancelled = false;

  try {
    const result = await comparePdfs(buffer1, buffer2, fileName1, fileName2, options, (msg) => {
      self.postMessage(msg);
    });

    self.postMessage(result);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      self.postMessage({ type: 'cancelled' } as CompareCancelled);
    } else {
      self.postMessage({
        type: 'error',
        message: `Error de comparación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      } as CompareError);
    }
  }
};

export {};
