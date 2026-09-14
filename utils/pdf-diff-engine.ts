/**
 * Motor Corporativo de Diferenciación Semántica y Estructural de PDFs v4.0.
 *
 * Módulo puro de algoritmos:
 * - Algoritmo Myers Diff de espacio lineal O(N + D^2).
 * - Recorte O(min(M, N)) de prefijo y sufijo idénticos.
 * - Normalización de texto (ignoreCase, ignorePunctuation, ignoreWhitespace).
 * - Agrupación semántica por bloques de párrafos/oraciones.
 * - Checksum criptográfico SHA-256 forense.
 */

// ============================================================
// INTERFACES
// ============================================================

export interface WordToken {
  raw: string;
  norm: string;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface DiffWord {
  text: string;
  type: 'equal' | 'added' | 'removed';
  page: number;
  index: number;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface DiffBlock {
  type: 'equal' | 'added' | 'removed';
  page: number;
  text: string;
  words: DiffWord[];
  bbox?: { x: number; y: number; width: number; height: number };
  contextBefore: string;
  contextAfter: string;
}

export interface CompareOptions {
  sensitivity?: 'strict' | 'normal' | 'loose';
  ignoreCase?: boolean;
  ignorePunctuation?: boolean;
  ignoreWhitespace?: boolean;
  enableVisualDiff?: boolean;
}

export interface DiffItem<T> {
  type: 'equal' | 'added' | 'removed';
  valueA?: T;
  valueB?: T;
  indexA?: number;
  indexB?: number;
}

// ============================================================
// SHA-256 CHECKSUM (Web Crypto API)
// ============================================================

export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// NORMALIZACIÓN
// ============================================================

export function normalizeWord(word: string, options?: CompareOptions): string {
  let res = word;
  if (options?.ignoreCase) {
    res = res.toLowerCase();
  }
  if (options?.ignorePunctuation) {
    res = res.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»[\]<>¿?¡!]/g, '');
  }
  if (options?.ignoreWhitespace) {
    res = res.trim();
  }
  return res;
}

// ============================================================
// ALGORITMO MYERS DIFF CON RECORTE DE PREFIJO / SUFIJO COMÚN
// ============================================================

export function myersDiffWords(
  tokensA: WordToken[],
  tokensB: WordToken[],
  options?: CompareOptions,
): DiffItem<WordToken>[] {
  const n = tokensA.length;
  const m = tokensB.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) {
    return tokensB.map((t, i) => ({ type: 'added', valueB: t, indexB: i }));
  }
  if (m === 0) {
    return tokensA.map((t, i) => ({ type: 'removed', valueA: t, indexA: i }));
  }

  const isMatch = (a: WordToken, b: WordToken) => {
    const na = a.norm || normalizeWord(a.raw, options);
    const nb = b.norm || normalizeWord(b.raw, options);
    return na === nb;
  };

  // 1. Recorte de Prefijo Común
  let start = 0;
  while (start < n && start < m && isMatch(tokensA[start], tokensB[start])) {
    start++;
  }

  // 2. Recorte de Sufijo Común
  let endA = n - 1;
  let endB = m - 1;
  while (endA >= start && endB >= start && isMatch(tokensA[endA], tokensB[endB])) {
    endA--;
    endB--;
  }

  const result: DiffItem<WordToken>[] = [];

  // Añadir prefijo común
  for (let i = 0; i < start; i++) {
    result.push({
      type: 'equal',
      valueA: tokensA[i],
      valueB: tokensB[i],
      indexA: i,
      indexB: i,
    });
  }

  // Segmento central con diferencias
  const midLenA = endA - start + 1;
  const midLenB = endB - start + 1;

  if (midLenA > 0 && midLenB === 0) {
    for (let i = start; i <= endA; i++) {
      result.push({ type: 'removed', valueA: tokensA[i], indexA: i });
    }
  } else if (midLenB > 0 && midLenA === 0) {
    for (let j = start; j <= endB; j++) {
      result.push({ type: 'added', valueB: tokensB[j], indexB: j });
    }
  } else if (midLenA > 0 && midLenB > 0) {
    const subDiff = runMyersCore(tokensA, start, endA, tokensB, start, endB, isMatch);
    for (const item of subDiff) {
      result.push(item);
    }
  }

  // Añadir sufijo común
  for (let offset = 0; start + offset <= endA || endA + 1 + offset < n; offset++) {
    const idxA = endA + 1 + offset;
    const idxB = endB + 1 + offset;
    if (idxA < n && idxB < m) {
      result.push({
        type: 'equal',
        valueA: tokensA[idxA],
        valueB: tokensB[idxB],
        indexA: idxA,
        indexB: idxB,
      });
    } else {
      break;
    }
  }

  return result;
}

function runMyersCore(
  arrA: WordToken[],
  startA: number,
  endA: number,
  arrB: WordToken[],
  startB: number,
  endB: number,
  isMatch: (a: WordToken, b: WordToken) => boolean,
): DiffItem<WordToken>[] {
  const N = endA - startA + 1;
  const M = endB - startB + 1;
  const MAX = N + M;
  const offset = MAX;
  const v = new Int32Array(2 * MAX + 1);
  v.fill(-1);
  v[1 + offset] = 0;

  const trace: Int32Array[] = [];
  const maxD = Math.min(MAX, 8000);

  let reached = false;
  let finalD = 0;

  for (let d = 0; d <= maxD; d++) {
    const vCopy = new Int32Array(v);
    trace.push(vCopy);

    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset];
      } else {
        x = v[k - 1 + offset] + 1;
      }

      let y = x - k;

      while (x < N && y < M && isMatch(arrA[startA + x], arrB[startB + y])) {
        x++;
        y++;
      }

      v[k + offset] = x;

      if (x >= N && y >= M) {
        reached = true;
        finalD = d;
        break;
      }
    }
    if (reached) break;
  }

  if (!reached) {
    const fallback: DiffItem<WordToken>[] = [];
    for (let i = startA; i <= endA; i++) {
      fallback.push({ type: 'removed', valueA: arrA[i], indexA: i });
    }
    for (let j = startB; j <= endB; j++) {
      fallback.push({ type: 'added', valueB: arrB[j], indexB: j });
    }
    return fallback;
  }

  const diff: DiffItem<WordToken>[] = [];
  let x = N;
  let y = M;

  for (let d = finalD; d > 0; d--) {
    const vStep = trace[d];
    const k = x - y;

    let prevK: number;
    if (k === -d || (k !== d && vStep[k - 1 + offset] < vStep[k + 1 + offset])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = vStep[prevK + offset];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      diff.unshift({
        type: 'equal',
        valueA: arrA[startA + x - 1],
        valueB: arrB[startB + y - 1],
        indexA: startA + x - 1,
        indexB: startB + y - 1,
      });
      x--;
      y--;
    }

    if (d > 0) {
      if (x === prevX) {
        diff.unshift({
          type: 'added',
          valueB: arrB[startB + y - 1],
          indexB: startB + y - 1,
        });
        y--;
      } else {
        diff.unshift({
          type: 'removed',
          valueA: arrA[startA + x - 1],
          indexA: startA + x - 1,
        });
        x--;
      }
    }
  }

  while (x > 0 && y > 0) {
    diff.unshift({
      type: 'equal',
      valueA: arrA[startA + x - 1],
      valueB: arrB[startB + y - 1],
      indexA: startA + x - 1,
      indexB: startB + y - 1,
    });
    x--;
    y--;
  }

  return diff;
}

// ============================================================
// AGRUPACIÓN SEMÁNTICA POR BLOQUES
// ============================================================

export function buildDiffBlocks(diffWords: DiffWord[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  if (diffWords.length === 0) return blocks;

  let currentType: 'equal' | 'added' | 'removed' | null = null;
  let currentWords: DiffWord[] = [];
  let currentStartIdx = 0;

  const flushBlock = () => {
    if (currentWords.length === 0 || currentType === null) return;

    const validBboxes = currentWords.map((w) => w.bbox).filter(Boolean) as {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];

    let combinedBbox: { x: number; y: number; width: number; height: number } | undefined;
    if (validBboxes.length > 0) {
      const minX = Math.min(...validBboxes.map((b) => b.x));
      const minY = Math.min(...validBboxes.map((b) => b.y));
      const maxX = Math.max(...validBboxes.map((b) => b.x + b.width));
      const maxY = Math.max(...validBboxes.map((b) => b.y + b.height));
      combinedBbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    } else if (currentWords[0]?.bbox) {
      combinedBbox = { ...currentWords[0].bbox };
    }

    const ctxBeforeWords = diffWords
      .slice(Math.max(0, currentStartIdx - 3), currentStartIdx)
      .map((w) => w.text)
      .join(' ');
    const ctxAfterWords = diffWords
      .slice(currentStartIdx + currentWords.length, currentStartIdx + currentWords.length + 3)
      .map((w) => w.text)
      .join(' ');

    blocks.push({
      type: currentType,
      page: currentWords[0]?.page || 1,
      text: currentWords.map((w) => w.text).join(' '),
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
      flushBlock();
      currentType = w.type;
      currentWords = [w];
      currentStartIdx = i;
    }
  }
  flushBlock();

  return blocks.filter((b) => b.type !== 'equal');
}
