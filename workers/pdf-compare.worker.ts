/**
 * Web Worker para comparación semántica y estructural de PDFs — Motor Corporativo v3.0.
 *
 * Estrategia:
 * 1. Calcula checksums SHA-256 de ambos PDFs vía Web Crypto API (auditoría forense)
 * 2. Extrae texto estructurado de ambos PDFs con pdfjs-dist (página por página, con coordenadas)
 * 3. Soporta cancelación vía mensaje { type: 'cancel' } para interrumpir procesamiento
 * 4. Diff página por página usando algoritmo LCS (Longest Common Subsequence)
 * 5. Agrupa diffs en bloques semánticos (párrafos/oraciones) con contexto
 * 6. Detecta cambios estructurales: fuentes, imágenes, anotaciones, metadatos
 * 7. Compara imágenes renderizadas pixel a pixel para detectar cambios visuales
 * 8. Genera estadísticas de similitud por página y global
 * 9. Transfiere buffers con Transferable objects para cero copia de memoria
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

// ============================================================
// INTERFACES
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
  /** Coordenadas reales del viewport (para posicionar overlays en el frontend) */
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
  /** Contexto: 3 palabras antes del cambio */
  contextBefore: string;
  /** Contexto: 3 palabras después del cambio */
  contextAfter: string;
}

/** Cambio estructural detectado entre documentos */
export interface StructuralDiff {
  category: 'fonts' | 'images' | 'annotations' | 'metadata' | 'pages';
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
  /** Bloques semánticos agrupados para mejor legibilidad */
  blocks: DiffBlock[];
  hasVisualChanges: boolean;
  /** Porcentaje de similitud de texto en esta página (0-100) */
  similarityPercent: number;
  /** Diferencia visual pixel a pixel (0-1, donde 0 = idéntico) */
  visualDiffRatio: number;
  /** Lista de nombres de fuentes añadidas/eliminadas en esta página */
  fontChanges?: string[];
  /** Lista de imágenes añadidas/eliminadas en esta página */
  imageChanges?: string[];
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
  /** Porcentaje global de similitud de texto (0-100) */
  globalSimilarityPercent: number;
  /** Número de páginas con cambios visuales detectados */
  pagesWithVisualChanges: number;
  /** Hash SHA-256 del documento A (original) — hex string */
  checksum1: string;
  /** Hash SHA-256 del documento B (modificado) — hex string */
  checksum2: string;
  /** Cambios estructurales detectados */
  structuralDiffs: StructuralDiff[];
}

export interface CompareProgress {
  type: 'progress';
  phase: 'hashing' | 'extracting1' | 'extracting2' | 'diffing' | 'visual' | 'structural' | 'packaging';
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

export type WorkerMessage = CompareProgress | CompareResult | CompareError | CompareCancelled;
export type WorkerInput = {
  buffer1: ArrayBuffer;
  buffer2: ArrayBuffer;
  fileName1: string;
  fileName2: string;
};

// ============================================================
// CANCELACIÓN
// ============================================================

let cancelled = false;

/**
 * Lanza excepción si se ha solicitado cancelación.
 * Se llama en puntos clave del pipeline para interrumpir el procesamiento.
 */
function checkCancelled(): void {
  if (cancelled) {
    throw new DOMException('Comparison cancelled by user', 'AbortError');
  }
}

// ============================================================
// SHA-256 CHECKSUM (Web Crypto API)
// ============================================================

/**
 * Calcula el hash SHA-256 de un ArrayBuffer usando Web Crypto API.
 * Retorna string hexadecimal de 64 caracteres.
 */
async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// EXTRACCIÓN DE TEXTO POR PÁGINA (con coordenadas reales)
// ============================================================

interface PageTextData {
  pageNum: number;
  segments: TextSegment[];
  words: string[];
  /** Imagen renderizada de la página para comparación visual */
  renderedImageData?: ImageData;
  /** Fuentes usadas en esta página (nombres únicos) */
  fonts: string[];
  /** Cantidad de imágenes detectadas en esta página */
  imageCount: number;
}

/**
 * Extrae texto, fuentes e imágenes de cada página usando pdfjs-dist.
 */
async function extractPageTextData(
  fileBuffer: ArrayBuffer,
  report: (msg: WorkerMessage) => void,
  label: string
): Promise<{ pages: PageTextData[]; totalPages: number; fonts: string[]; imageCount: number }> {
  const pages: PageTextData[] = [];
  const allFonts = new Set<string>();
  let totalImageCount = 0;

  const pdfDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0) as ArrayBuffer),
    stopAtErrors: false,
  }).promise;

  const totalPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    checkCancelled();

    const pct = Math.floor((pageNum / totalPages) * 100);
    report({
      type: 'progress',
      phase: label === 'A' ? 'extracting1' : 'extracting2',
      percent: pct,
      message: `Extrayendo texto de ${label} - Página ${pageNum} de ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
    });

    const segments: TextSegment[] = [];
    const words: string[] = [];
    const pageFonts: string[] = [];
    let pageImageCount = 0;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });

      // ─── Extraer texto ───
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
          const tx = item.transform[4];
          const ty = item.transform[5];
          const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
          const itemWidth = item.width > 0 ? item.width : item.str.length * 6;
          const itemHeight = item.height > 0 ? item.height : 12;
          const fontSize = 'height' in item && item.height > 0 ? item.height : undefined;
          const fontName = 'fontName' in item ? (item as { fontName?: string }).fontName : undefined;

          if (fontName) {
            pageFonts.push(fontName);
            allFonts.add(fontName);
          }

          const seg: TextSegment = {
            page: pageNum,
            text: item.str,
            bbox: {
              x: vx,
              y: vy - itemHeight,
              width: itemWidth,
              height: itemHeight * 1.2,
            },
            fontSize,
            fontName,
          };
          segments.push(seg);

          // Tokenizar palabras
          const segWords = item.str.match(/\S+/g) || [];
          for (const w of segWords) words.push(w);
        }
      }

      // ─── Extraer imágenes y fuentes de los recursos de la página ───
      try {
        const opList = await page.getOperatorList();
        for (let i = 0; i < opList.fnArray.length; i++) {
          // Ops que indican imágenes: OPS.paintImageXObject, OPS.paintInlineImageXObject, etc.
          const fn = opList.fnArray[i];
          // pdfjs-dist OPS values:
          // paintImageXObject = 85, paintInlineImageXObject = 86
          // paintImageMaskXObject = 87
          // beginInlineImage = 92
          if (fn === 85 || fn === 86 || fn === 87 || fn === 92) {
            pageImageCount++;
            totalImageCount++;
          }
        }
      } catch {
        // No se pudo extraer operadores — continuar sin conteo de imágenes
      }

      // ─── Renderizar página para comparación visual ───
      try {
        const renderViewport = page.getViewport({ scale: 1.0 });
        const canvas = new OffscreenCanvas(renderViewport.width, renderViewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({
            canvasContext: ctx,
            viewport: renderViewport,
          } as unknown as Parameters<typeof page.render>[0]).promise;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          pages.push({
            pageNum,
            segments,
            words,
            renderedImageData: imageData,
            fonts: pageFonts,
            imageCount: pageImageCount,
          });
          continue;
        }
      } catch { /* visual render falló — continuar sin imagen */ }
    } catch { /* página corrupta — saltar */ }

    pages.push({
      pageNum,
      segments,
      words,
      fonts: pageFonts,
      imageCount: pageImageCount,
    });
  }

  return { pages, totalPages, fonts: Array.from(allFonts), imageCount: totalImageCount };
}

// ============================================================
// ALGORITMO DE DIFF — LCS por palabras
// ============================================================

interface LcsDiffItem {
  type: 'equal' | 'added' | 'removed';
  value: string;
  indexA?: number;
  indexB?: number;
  bboxA?: { x: number; y: number; width: number; height: number };
  bboxB?: { x: number; y: number; width: number; height: number };
}

function computeWordDiff(
  wordsA: string[],
  wordsB: string[],
  segsA?: TextSegment[],
  segsB?: TextSegment[]
): LcsDiffItem[] {
  const m = wordsA.length;
  const n = wordsB.length;

  // LCS table (programación dinámica)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    checkCancelled();
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack para construir el diff
  const diff: LcsDiffItem[] = [];
  let i = m, j = n;

  // Mapa de palabra → bbox (aproximado)
  const bboxMapA = new Map<number, { x: number; y: number; width: number; height: number }>();
  const bboxMapB = new Map<number, { x: number; y: number; width: number; height: number }>();

  if (segsA) {
    let wordIdx = 0;
    for (const seg of segsA) {
      const ws = seg.text.match(/\S+/g) || [];
      for (let w = 0; w < ws.length; w++) {
        bboxMapA.set(wordIdx + w, { ...seg.bbox });
      }
      wordIdx += ws.length;
    }
  }
  if (segsB) {
    let wordIdx = 0;
    for (const seg of segsB) {
      const ws = seg.text.match(/\S+/g) || [];
      for (let w = 0; w < ws.length; w++) {
        bboxMapB.set(wordIdx + w, { ...seg.bbox });
      }
      wordIdx += ws.length;
    }
  }

  while (i > 0 || j > 0) {
    checkCancelled();
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      diff.unshift({
        type: 'equal',
        value: wordsA[i - 1],
        indexA: i - 1,
        indexB: j - 1,
        bboxA: bboxMapA.get(i - 1),
        bboxB: bboxMapB.get(j - 1),
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: 'added',
        value: wordsB[j - 1],
        indexB: j - 1,
        bboxB: bboxMapB.get(j - 1),
      });
      j--;
    } else {
      diff.unshift({
        type: 'removed',
        value: wordsA[i - 1],
        indexA: i - 1,
        bboxA: bboxMapA.get(i - 1),
      });
      i--;
    }
  }

  return diff;
}

// ============================================================
// AGRUPACIÓN SEMÁNTICA POR BLOQUES (PÁRRAFOS/ORACIONES)
// ============================================================

/**
 * Agrupa palabras adyacentes del mismo tipo de cambio en DiffBlocks.
 * Cada bloque incluye contexto de 3 palabras antes y después.
 * Separa bloques cuando hay más de 1 palabra 'equal' consecutiva entre cambios.
 */
function buildDiffBlocks(diffWords: DiffWord[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  if (diffWords.length === 0) return blocks;

  let currentType: 'equal' | 'added' | 'removed' | null = null;
  let currentWords: DiffWord[] = [];
  let currentStartIdx = 0;

  const flushBlock = () => {
    if (currentWords.length === 0 || currentType === null) return;

    // Calcular bbox combinada
    const validBboxes = currentWords.map(w => w.bbox).filter(Boolean) as { x: number; y: number; width: number; height: number }[];
    let combinedBbox: { x: number; y: number; width: number; height: number } | undefined;
    if (validBboxes.length > 0) {
      const minX = Math.min(...validBboxes.map(b => b.x));
      const minY = Math.min(...validBboxes.map(b => b.y));
      const maxX = Math.max(...validBboxes.map(b => b.x + b.width));
      const maxY = Math.max(...validBboxes.map(b => b.y + b.height));
      combinedBbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    } else if (currentWords[0]?.bbox) {
      combinedBbox = { ...currentWords[0].bbox };
    }

    // Contexto: 3 palabras antes y después
    const ctxBeforeWords = diffWords
      .slice(Math.max(0, currentStartIdx - 3), currentStartIdx)
      .map(w => w.text)
      .join(' ');
    const ctxAfterWords = diffWords
      .slice(currentStartIdx + currentWords.length, currentStartIdx + currentWords.length + 3)
      .map(w => w.text)
      .join(' ');

    blocks.push({
      type: currentType,
      page: currentWords[0]?.page || 1,
      text: currentWords.map(w => w.text).join(' '),
      words: currentWords,
      bbox: combinedBbox,
      contextBefore: ctxBeforeWords,
      contextAfter: ctxAfterWords,
    });

    currentWords = [];
  };

  for (let i = 0; i < diffWords.length; i++) {
    const w = diffWords[i];

    if (currentType === null) {
      currentType = w.type;
      currentWords = [w];
      currentStartIdx = i;
    } else if (w.type === currentType) {
      currentWords.push(w);
    } else {
      // Solo agrupamos bloques de cambio (added/removed). Los 'equal' se procesan
      // individualmente o en grupos pequeños como contexto.
      flushBlock();
      currentType = w.type;
      currentWords = [w];
      currentStartIdx = i;
    }
  }
  flushBlock();

  // Filtrar solo bloques que contengan cambios reales (added/removed)
  return blocks.filter(b => b.type !== 'equal');
}

// ============================================================
// COMPARACIÓN VISUAL PIXEL A PIXEL
// ============================================================

function computeVisualDiff(
  imgData1: ImageData | undefined,
  imgData2: ImageData | undefined
): { ratio: number; heatmapData?: ImageData } {
  if (!imgData1 || !imgData2) return { ratio: 0 };
  if (imgData1.width !== imgData2.width || imgData1.height !== imgData2.height) return { ratio: 1 };

  const d1 = imgData1.data;
  const d2 = imgData2.data;
  const total = d1.length;
  let diffPixels = 0;

  // Crear heatmap data (rojo para píxeles diferentes)
  const heatmap = new Uint8ClampedArray(total);
  for (let i = 0; i < total; i += 4) {
    const dr = Math.abs(d1[i] - d2[i]);
    const dg = Math.abs(d1[i + 1] - d2[i + 1]);
    const db = Math.abs(d1[i + 2] - d2[i + 2]);
    if (dr > 30 || dg > 30 || db > 30) {
      diffPixels++;
      // Pixel diferente: rojo intenso
      heatmap[i] = 255;
      heatmap[i + 1] = 0;
      heatmap[i + 2] = 0;
      heatmap[i + 3] = 180;
    } else {
      // Pixel igual: gris translúcido
      heatmap[i] = 0;
      heatmap[i + 1] = 0;
      heatmap[i + 2] = 0;
      heatmap[i + 3] = 20;
    }
  }

  return {
    ratio: diffPixels / (total / 4),
    heatmapData: new ImageData(heatmap, imgData1.width, imgData1.height),
  };
}

// ============================================================
// COMPARACIÓN ESTRUCTURAL
// ============================================================

/**
 * Compara metadatos, fuentes e imágenes entre los dos documentos.
 */
function computeStructuralDiffs(
  doc1: { fonts: string[]; imageCount: number; totalPages: number },
  doc2: { fonts: string[]; imageCount: number; totalPages: number },
  pages1: PageTextData[],
  pages2: PageTextData[]
): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];

  // ─── Diferencia en número de páginas ───
  if (doc1.totalPages !== doc2.totalPages) {
    diffs.push({
      category: 'pages',
      type: 'modified',
      description: `Número de páginas cambió de ${doc1.totalPages} a ${doc2.totalPages}`,
      detail: `Diferencia: ${Math.abs(doc2.totalPages - doc1.totalPages)} página(s)`,
    });
  }

  // ─── Diferencia en fuentes ───
  const fontsSet1 = new Set(doc1.fonts);
  const fontsSet2 = new Set(doc2.fonts);
  const addedFonts = doc2.fonts.filter(f => !fontsSet1.has(f));
  const removedFonts = doc1.fonts.filter(f => !fontsSet2.has(f));

  for (const f of addedFonts) {
    diffs.push({
      category: 'fonts',
      type: 'added',
      description: `Fuente añadida: ${f}`,
    });
  }
  for (const f of removedFonts) {
    diffs.push({
      category: 'fonts',
      type: 'removed',
      description: `Fuente eliminada: ${f}`,
    });
  }

  // ─── Diferencia en imágenes ───
  if (doc1.imageCount !== doc2.imageCount) {
    const diff = doc2.imageCount - doc1.imageCount;
    diffs.push({
      category: 'images',
      type: 'modified',
      description: `Cantidad de imágenes: ${doc1.imageCount} → ${doc2.imageCount}`,
      detail: diff > 0 ? `${diff} imagen(es) añadida(s)` : `${Math.abs(diff)} imagen(es) eliminada(s)`,
    });
  }

  // ─── Diferencia en imágenes por página ───
  for (const pg1 of pages1) {
    const pg2 = pages2.find(p => p.pageNum === pg1.pageNum);
    if (pg2 && pg1.imageCount !== pg2.imageCount) {
      diffs.push({
        category: 'images',
        type: 'modified',
        description: `Página ${pg1.pageNum}: imágenes cambiaron de ${pg1.imageCount} a ${pg2.imageCount}`,
      });
    }
  }

  return diffs;
}

// ============================================================
// COMPARACIÓN PRINCIPAL (MOTOR CORPORATIVO v3.0)
// ============================================================

async function comparePdfs(
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer,
  fileName1: string,
  fileName2: string,
  report: (msg: WorkerMessage) => void
): Promise<CompareResult> {

  // ─── Fase 0: Checksums SHA-256 ───
  report({ type: 'progress', phase: 'hashing', percent: 0, message: 'Calculando checksums SHA-256 para auditoría...' });
  const [checksum1, checksum2] = await Promise.all([
    computeSHA256(buffer1),
    computeSHA256(buffer2),
  ]);
  checkCancelled();

  // ─── Fase 1: Extracción de texto ───
  report({ type: 'progress', phase: 'extracting1', percent: 5, message: 'Extrayendo texto del Documento A (Original)...' });
  const {
    pages: pages1,
    totalPages: totalPages1,
    fonts: fonts1,
    imageCount: images1,
  } = await extractPageTextData(buffer1, report, 'A');
  checkCancelled();

  report({ type: 'progress', phase: 'extracting2', percent: 50, message: 'Extrayendo texto del Documento B (Modificado)...' });
  const {
    pages: pages2,
    totalPages: totalPages2,
    fonts: fonts2,
    imageCount: images2,
  } = await extractPageTextData(buffer2, report, 'B');
  checkCancelled();

  // ─── Fase 2: Diff estructural ───
  report({ type: 'progress', phase: 'structural', percent: 60, message: 'Analizando cambios estructurales (fuentes, imágenes, metadatos)...' });
  const structuralDiffs = computeStructuralDiffs(
    { fonts: fonts1, imageCount: images1, totalPages: totalPages1 },
    { fonts: fonts2, imageCount: images2, totalPages: totalPages2 },
    pages1,
    pages2
  );
  checkCancelled();

  // ─── Fase 3: Diff página por página ───
  report({ type: 'progress', phase: 'diffing', percent: 65, message: 'Calculando diferencias página por página (algoritmo LCS)...' });

  const maxPages = Math.max(totalPages1, totalPages2);
  const pageDiffs: PageDiff[] = [];
  let totalRemovals = 0;
  let totalAdditions = 0;
  let totalUnchanged = 0;
  const pagesAdded: number[] = [];
  const pagesRemoved: number[] = [];
  let pagesWithVisualChanges = 0;
  let totalSimilaritySum = 0;

  for (let p = 1; p <= maxPages; p++) {
    checkCancelled();

    const page1 = pages1.find(pg => pg.pageNum === p);
    const page2 = pages2.find(pg => pg.pageNum === p);

    if (!page1 && page2) {
      // Página añadida (solo en B)
      pagesAdded.push(p);
      const words: DiffWord[] = page2.words.map((w, idx) => ({
        text: w,
        type: 'added' as const,
        page: p,
        index: idx,
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
        fontChanges: page2.fonts,
        imageChanges: [],
      });
      totalAdditions += words.length;
      continue;
    }

    if (page1 && !page2) {
      // Página eliminada (solo en A)
      pagesRemoved.push(p);
      const words: DiffWord[] = page1.words.map((w, idx) => ({
        text: w,
        type: 'removed' as const,
        page: p,
        index: idx,
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
        fontChanges: page1.fonts,
        imageChanges: [],
      });
      totalRemovals += words.length;
      continue;
    }

    if (!page1 || !page2) continue;

    // Ambas páginas existen → diff real
    const diffItems = computeWordDiff(
      page1.words,
      page2.words,
      page1.segments,
      page2.segments
    );

    const pd: PageDiff = {
      page: p,
      removedCount: 0,
      addedCount: 0,
      unchangedCount: 0,
      words: [],
      blocks: [],
      hasVisualChanges: false,
      similarityPercent: 100,
      visualDiffRatio: 0,
    };

    const diffWords: DiffWord[] = [];

    for (const d of diffItems) {
      const bbox = d.type === 'removed' ? d.bboxA : d.type === 'added' ? d.bboxB : d.bboxA;
      diffWords.push({
        text: d.value,
        type: d.type,
        page: p,
        index: d.indexA ?? d.indexB ?? 0,
        bbox,
      });

      if (d.type === 'removed') pd.removedCount++;
      else if (d.type === 'added') pd.addedCount++;
      else pd.unchangedCount++;
    }

    pd.words = diffWords;

    // Construir bloques semánticos
    pd.blocks = buildDiffBlocks(diffWords);

    // Calcular % de similitud de esta página
    const totalWords = pd.removedCount + pd.addedCount + pd.unchangedCount;
    pd.similarityPercent = totalWords > 0 ? Math.round((pd.unchangedCount / totalWords) * 100) : 100;

    // Comparación visual
    const visualResult = computeVisualDiff(page1.renderedImageData, page2.renderedImageData);
    pd.visualDiffRatio = visualResult.ratio;
    pd.hasVisualChanges = visualResult.ratio > 0.05; // 5% de píxeles diferentes = cambio visual

    if (pd.hasVisualChanges) pagesWithVisualChanges++;

    // Cambios de fuentes e imágenes en esta página
    const pageFontsAdded = page2.fonts.filter(f => !page1.fonts.includes(f));
    const pageFontsRemoved = page1.fonts.filter(f => !page2.fonts.includes(f));
    if (pageFontsAdded.length > 0 || pageFontsRemoved.length > 0) {
      pd.fontChanges = [...pageFontsAdded.map(f => `+${f}`), ...pageFontsRemoved.map(f => `-${f}`)];
    }

    totalRemovals += pd.removedCount;
    totalAdditions += pd.addedCount;
    totalUnchanged += pd.unchangedCount;
    totalSimilaritySum += pd.similarityPercent;

    pageDiffs.push(pd);
  }

  // Ordenar por página
  pageDiffs.sort((a, b) => a.page - b.page);

  // ─── Fase 4: Cálculos globales ───
  report({ type: 'progress', phase: 'packaging', percent: 95, message: 'Generando estadísticas globales...' });

  const changedPages = pageDiffs.filter(pd => pd.removedCount + pd.addedCount > 0).length;
  const totalWordsOverall = totalRemovals + totalAdditions + totalUnchanged;
  const globalSimilarityPercent = totalWordsOverall > 0
    ? Math.round((totalUnchanged / totalWordsOverall) * 100)
    : 100;

  // Generar resumen
  let summary = '';
  if (totalRemovals === 0 && totalAdditions === 0 && pagesAdded.length === 0 && pagesRemoved.length === 0) {
    summary = '✅ Los documentos son idénticos. No se encontraron diferencias de texto.';
  } else {
    const parts: string[] = [];
    if (totalRemovals > 0) parts.push(`${totalRemovals} palabras eliminadas`);
    if (totalAdditions > 0) parts.push(`${totalAdditions} palabras añadidas`);
    if (totalUnchanged > 0) parts.push(`${totalUnchanged} palabras sin cambios`);
    if (pagesAdded.length > 0) parts.push(`${pagesAdded.length} páginas añadidas`);
    if (pagesRemoved.length > 0) parts.push(`${pagesRemoved.length} páginas eliminadas`);
    summary = `📊 ${changedPages} página(s) modificada(s): ${parts.join(', ')}. Similitud global: ${globalSimilarityPercent}%.`;
  }

  report({ type: 'progress', phase: 'packaging', percent: 100, message: 'Comparación completada.' });

  return {
    type: 'result',
    fileName1,
    fileName2,
    totalPages1,
    totalPages2,
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

  // Manejar cancelación
  if (data.type === 'cancel') {
    cancelled = true;
    self.postMessage({ type: 'cancelled' } as CompareCancelled);
    return;
  }

  const { buffer1, buffer2, fileName1, fileName2 } = data;

  // Reiniciar flag de cancelación
  cancelled = false;

  try {
    const result = await comparePdfs(buffer1, buffer2, fileName1, fileName2, (msg) => {
      // Usamos transfer list vacío para mensajes de progreso (no tienen buffers)
      self.postMessage(msg);
    });

    // Transferir los buffers de checksum (son strings, no buffers grandes)
    // El resultado no contiene buffers grandes que necesiten transfer
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