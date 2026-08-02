/**
 * PDF Content Stream Parser - Motor de Cirugía de Precisión v3.0
 * 
 * Parsea content streams de PDF (notación polaca inversa) para:
 *  - Identificar operadores de texto (Tj, TJ, ', ") y sus parámetros
 *  - Extraer coordenadas de texto vía matrices Tm/Td/T*
 *  - Modificar/reemplazar operadores de texto sin alterar la estructura del stream
 *  - Inyectar rectángulos de censura (re f) al final del stream preservando el resto
 * 
 * Compatible con pdf-lib 1.17.1 y pdfjs-dist 6.1.200
 */

// ============================================================
// TIPOS
// ============================================================

export interface TextOperator {
  /** Offset en bytes desde el inicio del stream decodificado */
  byteOffset: number;
  /** Longitud total del operador + operandos en bytes */
  byteLength: number;
  /** Tipo de operador */
  operator: 'Tj' | 'TJ' | 'quote' | 'doubleQuote';
  /** Texto plano extraído (concatenado para TJ arrays) */
  text: string;
  /** Posición estimada en espacio de usuario PDF (puntos, origen bottom-left) */
  x?: number;
  y?: number;
  /** Tamaño de fuente estimado */
  fontSize?: number;
  /** Índice de la fuente en la página */
  fontIndex?: number;
}

export interface ContentStreamAnalysis {
  /** Stream decodificado como string */
  decodedStream: string;
  /** Lista de operadores de texto encontrados */
  textOperators: TextOperator[];
  /** Posición actual de la matriz de texto [Tx, Ty] después de parsear */
  textMatrix: { tx: number; ty: number };
  /** Matriz de transformación de línea de texto actual */
  textLineMatrix: { tx: number; ty: number };
  /** Tamaño de fuente actual */
  currentFontSize: number;
}

export interface RedactionPatch {
  /** Operador original a reemplazar */
  originalOp: TextOperator;
  /** Nuevo texto (vacío o espacios) con el que reemplazar */
  replacementText: string;
}

// ============================================================
// PARSER PRINCIPAL
// ============================================================

/**
 * Analiza un content stream PDF decodificado y extrae todos
 * los operadores de texto con sus posiciones estimadas.
 */
export function analyzeContentStream(
  decodedStream: string,
  mediaBox?: { x: number; y: number; width: number; height: number }
): ContentStreamAnalysis {
  const textOperators: TextOperator[] = [];
  let textLineMatrix = { tx: 0, ty: 0 };
  let textMatrix = { tx: 0, ty: 0 };
  let currentFontSize = 12;
  let currentFontIndex = 0;

  let pos = 0;
  const len = decodedStream.length;

  while (pos < len) {
    // Saltar whitespace
    while (pos < len && /\s/.test(decodedStream[pos])) pos++;
    if (pos >= len) break;

    const startPos = pos;

    // Intentar parsear un token
    const token = parseToken(decodedStream, pos);
    if (!token) break;

    pos = token.nextPos;

    // Es un operador?
    if (isOperator(token.value)) {
      const opStart = findOperatorStart(decodedStream, startPos, token.value);
      const opLength = pos - opStart;

      switch (token.value) {
        case 'BT':
          // Begin text object - resetear matrices
          textMatrix = { tx: 0, ty: 0 };
          textLineMatrix = { tx: 0, ty: 0 };
          break;

        case 'ET':
          // End text object
          break;

        case 'Tm':
          // Set text matrix: a b c d e f Tm
          // Buscar los 6 números previos
          {
            const nums = extractPreviousNumbers(decodedStream, opStart, 6);
            if (nums && nums.length === 6) {
              textLineMatrix = { tx: nums[4], ty: nums[5] };
              textMatrix = { tx: nums[4], ty: nums[5] };
              // El escalado en y (d) puede dar el tamaño de fuente
              if (Math.abs(nums[3]) > 0.1) {
                currentFontSize = Math.abs(nums[3]);
              }
            }
          }
          break;

        case 'Td':
        case 'TD':
          // Move text position: tx ty Td
          {
            const nums = extractPreviousNumbers(decodedStream, opStart, 2);
            if (nums && nums.length === 2) {
              textLineMatrix = {
                tx: textLineMatrix.tx + nums[0],
                ty: textLineMatrix.ty + nums[1],
              };
              textMatrix = { ...textLineMatrix };
            }
          }
          break;

        case 'T*':
          // Move to next line
          textLineMatrix = {
            tx: textLineMatrix.tx,
            ty: textLineMatrix.ty - (currentFontSize * 1.2), // leading estimado
          };
          textMatrix = { ...textLineMatrix };
          break;

        case 'Tj':
          // Show text string: (string) Tj
          {
            const prevToken = findPreviousStringToken(decodedStream, opStart);
            if (prevToken) {
              const text = decodePdfString(prevToken.raw);
              textOperators.push({
                byteOffset: opStart - (opStart - prevToken.startPos),
                byteLength: opLength + (opStart - prevToken.startPos),
                operator: 'Tj',
                text,
                x: textMatrix.tx,
                y: textMatrix.ty,
                fontSize: currentFontSize,
                fontIndex: currentFontIndex,
              });
              // Avanzar posición de texto
              textMatrix = {
                tx: textMatrix.tx + estimateTextWidth(text, currentFontSize),
                ty: textMatrix.ty,
              };
            }
          }
          break;

        case 'TJ':
          // Show text array: [(string) num (string) ...] TJ
          {
            const arrayResult = parseTextArray(decodedStream, opStart);
            if (arrayResult) {
              const { texts, combinedText, arrayStart, arrayEnd } = arrayResult;
              textOperators.push({
                byteOffset: arrayStart,
                byteLength: pos - arrayStart,
                operator: 'TJ',
                text: combinedText,
                x: textMatrix.tx,
                y: textMatrix.ty,
                fontSize: currentFontSize,
                fontIndex: currentFontIndex,
              });
              // Avanzar posición de texto (aproximado)
              const totalWidth = texts.reduce((sum: number, t) => {
                if (typeof t === 'string') return sum + estimateTextWidth(t, currentFontSize);
                else return sum + (t / 1000) * currentFontSize; // kerning adjustment
              }, 0);
              textMatrix = {
                tx: textMatrix.tx + totalWidth,
                ty: textMatrix.ty,
              };
            }
          }
          break;

        case "'":
          // Move to next line and show text: (string) '
          {
            textLineMatrix = {
              tx: textLineMatrix.tx,
              ty: textLineMatrix.ty - (currentFontSize * 1.2),
            };
            textMatrix = { ...textLineMatrix };
            const prevToken = findPreviousStringToken(decodedStream, opStart);
            if (prevToken) {
              const text = decodePdfString(prevToken.raw);
              textOperators.push({
                byteOffset: prevToken.startPos,
                byteLength: pos - prevToken.startPos,
                operator: 'quote',
                text,
                x: textMatrix.tx,
                y: textMatrix.ty,
                fontSize: currentFontSize,
                fontIndex: currentFontIndex,
              });
              textMatrix = {
                tx: textMatrix.tx + estimateTextWidth(text, currentFontSize),
                ty: textMatrix.ty,
              };
            }
          }
          break;

        case '"':
          // Set word/char spacing, move to next line, show text: aw ac (string) "
          {
            textLineMatrix = {
              tx: textLineMatrix.tx,
              ty: textLineMatrix.ty - (currentFontSize * 1.2),
            };
            textMatrix = { ...textLineMatrix };
            const prevToken = findPreviousStringToken(decodedStream, opStart);
            if (prevToken) {
              const text = decodePdfString(prevToken.raw);
              textOperators.push({
                byteOffset: prevToken.startPos,
                byteLength: pos - prevToken.startPos,
                operator: 'doubleQuote',
                text,
                x: textMatrix.tx,
                y: textMatrix.ty,
                fontSize: currentFontSize,
                fontIndex: currentFontIndex,
              });
              textMatrix = {
                tx: textMatrix.tx + estimateTextWidth(text, currentFontSize),
                ty: textMatrix.ty,
              };
            }
          }
          break;

        case 'Tf':
          // Set font: /FontName size Tf
          {
            const nums = extractPreviousNumbers(decodedStream, opStart, 1);
            if (nums && nums.length === 1 && nums[0] > 0.1) {
              currentFontSize = nums[0];
            }
          }
          break;
      }
    }
  }

  return {
    decodedStream,
    textOperators,
    textMatrix,
    textLineMatrix,
    currentFontSize,
  };
}

// ============================================================
// MODIFICACIÓN DE CONTENT STREAMS
// ============================================================

/**
 * Genera un nuevo content stream donde los operadores de texto que caen
 * dentro de las áreas de censura son reemplazados por texto vacío,
 * y se agregan rectángulos negros (re f) al final del stream.
 * 
 * @param analysis - Resultado del análisis del stream
 * @param redactionBoxes - Áreas de censura en espacio de usuario PDF [{x, y, w, h}, ...]
 * @param boxColor - 'black' o 'gray'
 * @returns El nuevo stream modificado como string listo para codificar
 */
export function applyRedactionsToStream(
  analysis: ContentStreamAnalysis,
  redactionBoxes: Array<{ x: number; y: number; w: number; h: number }>,
  boxColor: 'black' | 'gray' = 'black'
): string {
  let modifiedStream = analysis.decodedStream;
  const patches: RedactionPatch[] = [];

  // Identificar operadores de texto que caen dentro de áreas de censura
  for (const textOp of analysis.textOperators) {
    if (!textOp.x || !textOp.y || !textOp.fontSize) continue;

    const textLeft = textOp.x;
    const textBottom = textOp.y - textOp.fontSize * 0.2;
    const textRight = textOp.x + estimateTextWidth(textOp.text, textOp.fontSize);
    const textTop = textOp.y + textOp.fontSize * 0.8;

    for (const box of redactionBoxes) {
      const boxLeft = box.x;
      const boxBottom = box.y;
      const boxRight = box.x + box.w;
      const boxTop = box.y + box.h;

      // Verificar solapamiento
      if (
        textLeft < boxRight &&
        textRight > boxLeft &&
        textBottom < boxTop &&
        textTop > boxBottom
      ) {
        // Este texto debe ser censurado
        patches.push({
          originalOp: textOp,
          replacementText: '',
        });
        break; // Ya marcado, no revisar más boxes
      }
    }
  }

  // Aplicar reemplazos (de atrás hacia adelante para mantener offsets)
  const sortedPatches = [...patches].sort((a, b) => b.originalOp.byteOffset - a.originalOp.byteOffset);

  for (const patch of sortedPatches) {
    const { byteOffset, byteLength, operator, text } = patch.originalOp;

    if (operator === 'Tj' || operator === 'quote' || operator === 'doubleQuote') {
      // Reemplazar (texto) por ( ) - cadena vacía con espacio
      const before = modifiedStream.substring(0, byteOffset);
      const after = modifiedStream.substring(byteOffset + byteLength);
      // Buscar el string literal y reemplazarlo
      const escapedText = escapePdfString(text);
      const pattern = `\\(${escapedText}\\)`;
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      // Usar un solo espacio para preservar la estructura
      const replacement = '() ';
      modifiedStream = before + replacement + after;
    } else if (operator === 'TJ') {
      // Para TJ arrays, más complejo: reemplazar el array entero
      const before = modifiedStream.substring(0, byteOffset);
      const after = modifiedStream.substring(byteOffset + byteLength);
      // Reemplazar el array con uno que solo tenga [ 0 ] TJ
      const replacement = '[ 0 ] TJ ';
      modifiedStream = before + replacement + after;
    }
  }

  // Agregar rectángulos de censura al final del stream (justo antes del último ET si existe)
  const colorOp = boxColor === 'gray'
    ? '0.25 0.25 0.25 RG 0.25 0.25 0.25 rg'
    : '0 0 0 RG 0 0 0 rg';

  let redactionOps = `\nq\n${colorOp}\n`;

  for (const box of redactionBoxes) {
    redactionOps += `${box.x} ${box.y} ${box.w} ${box.h} re f\n`;
  }

  redactionOps += 'Q\n';

  // Insertar los rectángulos justo antes del cierre del stream
  // Si el stream termina con ET, insertar antes
  const etIndex = modifiedStream.lastIndexOf('ET');
  if (etIndex >= 0) {
    modifiedStream = modifiedStream.substring(0, etIndex + 2) + redactionOps + modifiedStream.substring(etIndex + 2);
  } else {
    // Si no hay ET, agregar al final
    modifiedStream += redactionOps;
  }

  return modifiedStream;
}

/**
 * Reemplaza completamente operadores de texto que caen en áreas de censura
 * con espacios en blanco (preserva geometría pero elimina contenido).
 * Retorna el stream modificado.
 */
export function sanitizeTextInStream(
  analysis: ContentStreamAnalysis,
  redactionBoxes: Array<{ x: number; y: number; w: number; h: number }>
): string {
  let modified = analysis.decodedStream;
  const opsToSanitize: TextOperator[] = [];

  for (const op of analysis.textOperators) {
    if (!op.x || !op.y || !op.fontSize) continue;
    const opLeft = op.x;
    const opRight = op.x + estimateTextWidth(op.text, op.fontSize);
    const opBottom = op.y - op.fontSize * 0.2;
    const opTop = op.y + op.fontSize * 0.8;

    for (const box of redactionBoxes) {
      if (opLeft < box.x + box.w && opRight > box.x && opBottom < box.y + box.h && opTop > box.y) {
        opsToSanitize.push(op);
        break;
      }
    }
  }

  // Procesar de atrás hacia adelante
  opsToSanitize.sort((a, b) => b.byteOffset - a.byteOffset);

  for (const op of opsToSanitize) {
    const before = modified.substring(0, op.byteOffset);
    const after = modified.substring(op.byteOffset + op.byteLength);
    const spaces = ' '.repeat(Math.max(1, op.text.length));
    const replacement = `(${spaces}) Tj `;
    modified = before + replacement + after;
  }

  return modified;
}

// ============================================================
// FUNCIONES AUXILIARES DE PARSEO
// ============================================================

function parseToken(stream: string, startPos: number): { value: string; nextPos: number } | null {
  const ch = stream[startPos];
  if (!ch) return null;

  // Comentarios
  if (ch === '%') {
    let end = startPos + 1;
    while (end < stream.length && stream[end] !== '\n' && stream[end] !== '\r') end++;
    return { value: '%', nextPos: end + (stream[end] === '\r' && stream[end + 1] === '\n' ? 2 : 1) };
  }

  // Nombres de fuente/recursos: /Name
  if (ch === '/') {
    let end = startPos + 1;
    while (end < stream.length && !/\s|[\/\[\]<>(){}%]/.test(stream[end])) end++;
    return { value: '/', nextPos: end };
  }

  // Strings literales: (texto con \) escapados)
  if (ch === '(') {
    let depth = 1;
    let end = startPos + 1;
    while (end < stream.length && depth > 0) {
      if (stream[end] === '\\') {
        end += 2;
        continue;
      }
      if (stream[end] === '(') depth++;
      else if (stream[end] === ')') depth--;
      end++;
    }
    return { value: stream.substring(startPos, end), nextPos: end };
  }

  // Arrays: [ ... ]
  if (ch === '[') {
    return { value: '[', nextPos: startPos + 1 };
  }
  if (ch === ']') {
    return { value: ']', nextPos: startPos + 1 };
  }

  // Números y operadores
  let end = startPos;
  while (end < stream.length && !/\s/.test(stream[end]) && !'[]()<>{}%/'.includes(stream[end])) {
    end++;
  }
  const token = stream.substring(startPos, end);
  return { value: token, nextPos: end };
}

function isOperator(token: string): boolean {
  const operators = new Set([
    'BT', 'ET', 'Tm', 'Td', 'TD', 'T*', 'Tj', 'TJ', 'Tf',
    "'", '"', 're', 'f', 'F', 'f*', 'RG', 'rg', 'q', 'Q',
    'cm', 'w', 'J', 'j', 'M', 'd', 'ri', 'i', 'gs', 'Do',
    'CS', 'cs', 'SC', 'SCN', 'sc', 'scn', 'G', 'g', 'S',
    's', 'W', 'W*', 'n', 'm', 'l', 'c', 'v', 'y', 'h', 'B',
    'B*', 'b', 'b*', 'BI', 'ID', 'EI', 'BDC', 'BMC', 'EMC',
    'DP', 'MP'
  ]);
  return operators.has(token);
}

function findOperatorStart(stream: string, tokenStart: number, operator: string): number {
  // Navegar hacia atrás desde tokenStart para encontrar el comienzo del operador y sus operandos
  // Simplificación: buscar hacia atrás el inicio de la línea o un token blanco
  let pos = tokenStart;
  while (pos > 0) {
    pos--;
    if (pos > 0 && stream[pos] === '\n') {
      pos++;
      break;
    }
    if (pos === 0) break;
  }
  // Avanzar hasta encontrar el operador mismo
  let searchPos = pos;
  while (searchPos < stream.length) {
    if (stream.substring(searchPos).startsWith(operator)) {
      // Encontrar el inicio real de los operandos
      let opStart = searchPos;
      while (opStart > pos && !/\s/.test(stream[opStart - 1])) {
        opStart--;
      }
      return opStart;
    }
    searchPos++;
  }
  return tokenStart;
}

function extractPreviousNumbers(stream: string, opStart: number, count: number): number[] | null {
  const nums: number[] = [];
  let pos = opStart - 1;

  for (let i = 0; i < count; i++) {
    // Saltar whitespace hacia atrás
    while (pos >= 0 && /\s/.test(stream[pos])) pos--;
    if (pos < 0) return null;

    // Encontrar inicio del número
    let numStart = pos;
    while (numStart >= 0 && !/\s/.test(stream[numStart]) && stream[numStart] !== '(' && stream[numStart] !== ')' && stream[numStart] !== '[' && stream[numStart] !== ']') {
      numStart--;
    }
    numStart++;

    const numStr = stream.substring(numStart, pos + 1);
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;

    nums.unshift(num);
    pos = numStart - 1;
  }

  return nums;
}

function findPreviousStringToken(stream: string, opStart: number): { startPos: number; endPos: number; raw: string } | null {
  let pos = opStart - 1;

  // Saltar whitespace y el operador previo si es ' o "
  while (pos >= 0 && /\s/.test(stream[pos])) pos--;
  if (pos < 0) return null;

  // Si estamos en ' o ", retroceder más
  if (stream[pos] === "'" || stream[pos] === '"') {
    pos--;
    while (pos >= 0 && /\s/.test(stream[pos])) pos--;
    if (pos < 0) return null;
  }

  // Buscar paréntesis de cierre
  if (stream[pos] !== ')') return null;

  let depth = 1;
  let end = pos;
  pos--;

  while (pos >= 0 && depth > 0) {
    if (stream[pos] === ')') {
      if (pos + 1 < stream.length && stream[pos - 1] !== '\\') depth++;
      else pos--;
    } else if (stream[pos] === '(') {
      if (pos === 0 || stream[pos - 1] !== '\\') depth--;
      else pos--;
    }
    if (depth > 0) pos--;
  }

  if (depth !== 0 || pos < 0) return null;

  return {
    startPos: pos,
    endPos: end + 1,
    raw: stream.substring(pos, end + 1),
  };
}

interface TextArrayResult {
  texts: Array<string | number>;
  combinedText: string;
  arrayStart: number;
  arrayEnd: number;
}

function parseTextArray(stream: string, opStart: number): TextArrayResult | null {
  // Encontrar el '[' hacia atrás
  let pos = opStart - 1;
  while (pos >= 0 && /\s/.test(stream[pos])) pos--;
  if (pos < 0 || stream[pos] !== ']') return null;

  const arrayEnd = pos + 1;
  let depth = 1;
  pos--;

  while (pos >= 0 && depth > 0) {
    if (stream[pos] === ']') depth++;
    else if (stream[pos] === '[') depth--;
    if (depth > 0) pos--;
  }

  if (depth !== 0 || pos < 0) return null;

  const arrayStart = pos;
  const arrayContent = stream.substring(arrayStart + 1, arrayEnd - 1);

  // Parsear contenido del array
  const texts: Array<string | number> = [];
  let combined = '';
  let i = 0;

  while (i < arrayContent.length) {
    while (i < arrayContent.length && /\s/.test(arrayContent[i])) i++;
    if (i >= arrayContent.length) break;

    if (arrayContent[i] === '(') {
      let depth2 = 1;
      let j = i + 1;
      while (j < arrayContent.length && depth2 > 0) {
        if (arrayContent[j] === '\\') { j += 2; continue; }
        if (arrayContent[j] === '(') depth2++;
        else if (arrayContent[j] === ')') depth2--;
        j++;
      }
      const raw = arrayContent.substring(i, j);
      const decoded = decodePdfString(raw);
      texts.push(decoded);
      combined += decoded;
      i = j;
    } else {
      // Número
      let j = i;
      while (j < arrayContent.length && !/\s/.test(arrayContent[j]) && arrayContent[j] !== ']' && arrayContent[j] !== '(') j++;
      const num = parseFloat(arrayContent.substring(i, j));
      if (!isNaN(num)) {
        texts.push(num);
        if (num < -50) combined += ' '; // kerning negativo grande = espacio
      }
      i = j;
    }
  }

  return { texts, combinedText: combined, arrayStart, arrayEnd };
}

// ============================================================
// UTILIDADES DE DECODIFICACIÓN PDF
// ============================================================

/**
 * Decodifica una cadena literal PDF (entre paréntesis)
 * Maneja escapes: \\, \(, \), \n, \r, \t, \b, \f, \ddd (octal)
 */
export function decodePdfString(raw: string): string {
  // Quitar paréntesis exteriores
  let inner = raw;
  if (inner.startsWith('(') && inner.endsWith(')')) {
    inner = inner.substring(1, inner.length - 1);
  }

  let result = '';
  let i = 0;

  while (i < inner.length) {
    if (inner[i] === '\\' && i + 1 < inner.length) {
      const next = inner[i + 1];
      if (next === 'n') { result += '\n'; i += 2; }
      else if (next === 'r') { result += '\r'; i += 2; }
      else if (next === 't') { result += '\t'; i += 2; }
      else if (next === 'b') { result += '\b'; i += 2; }
      else if (next === 'f') { result += '\f'; i += 2; }
      else if (next === '\\') { result += '\\'; i += 2; }
      else if (next === '(') { result += '('; i += 2; }
      else if (next === ')') { result += ')'; i += 2; }
      else if (/[0-7]/.test(next)) {
        // Octal escape \ddd
        let octal = '';
        let j = i + 1;
        while (j < inner.length && j < i + 4 && /[0-7]/.test(inner[j])) {
          octal += inner[j];
          j++;
        }
        result += String.fromCharCode(parseInt(octal, 8));
        i = j;
      } else {
        result += inner[i + 1];
        i += 2;
      }
    } else {
      result += inner[i];
      i++;
    }
  }

  return result;
}

export function escapePdfString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// ============================================================
// UTILIDADES DE MÉTRICAS DE TEXTO
// ============================================================

/**
 * Estima el ancho de un texto en espacio de usuario PDF.
 * Asume fuente proporcional promedio: ~0.5 * fontSize por carácter.
 * Para fuentes monoespaciadas: ~0.6 * fontSize.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  if (!text || text.length === 0) return 0;
  // Factor empírico: en la mayoría de fuentes, un carácter ocupa ~0.5-0.6 del tamaño de fuente
  return text.length * fontSize * 0.55;
}

/**
 * Convierte coordenadas de porcentaje de viewport (0-100) a espacio de usuario PDF.
 * El espacio de usuario PDF usa:
 * - X: 0 a mediaBox.width (izquierda a derecha)
 * - Y: 0 a mediaBox.height (abajo hacia arriba)
 * 
 * La UI usa porcentajes donde Y crece hacia ABAJO (origen top-left),
 * mientras que PDF usa Y crece hacia ARRIBA (origen bottom-left).
 */
export function viewportPercentToPdfCoords(
  xPercent: number,
  yPercent: number,
  wPercent: number,
  hPercent: number,
  mediaBoxWidth: number,
  mediaBoxHeight: number
): { x: number; y: number; w: number; h: number } {
  // X: misma dirección (izquierda a derecha)
  const x = (xPercent / 100) * mediaBoxWidth;
  const w = (wPercent / 100) * mediaBoxWidth;

  // Y: invertir (UI top-down → PDF bottom-up)
  const yTop = (yPercent / 100) * mediaBoxHeight;
  const yBottom = mediaBoxHeight - yTop - (hPercent / 100) * mediaBoxHeight;
  const h = (hPercent / 100) * mediaBoxHeight;

  return { x, y: yBottom, w, h };
}