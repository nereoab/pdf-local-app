import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export type Position9 =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface NumberWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  position: Position9;
  textFormat: string;
  customPrefix: string;
  margin: 'small' | 'recommended' | 'big';
  fontSizeOption: 'small' | 'medium' | 'large';
  fontColor: string;
  fontFamily?: 'helvetica' | 'times' | 'courier';
  numberStyle: 'arabic' | 'padded' | 'padded-3' | 'padded-6' | 'roman' | 'roman-lower';
  pageMode?: 'single' | 'facing';
  drawBackground?: boolean;
  skipFirstPage: boolean;
  firstNumber: number;
  startPage: number;
  endPage: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface NumberWorkerMessageIn {
  action: 'number';
  arrayBuffer: ArrayBuffer;
  password?: string;
  options: NumberWorkerOptions;
}

export type NumberWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

const toRoman = (num: number, lowercase = false): string => {
  const lookup: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  let n = num;
  for (const i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  const res = roman || `${num}`;
  return lowercase ? res.toLowerCase() : res;
};

// Mapeo simétrico para páginas enfrentadas (dúplex)
const getFacingPosition = (pos: Position9, isEvenPage: boolean): Position9 => {
  if (!isEvenPage) return pos;
  switch (pos) {
    case 'top-right':
      return 'top-left';
    case 'top-left':
      return 'top-right';
    case 'bottom-right':
      return 'bottom-left';
    case 'bottom-left':
      return 'bottom-right';
    case 'center-right':
      return 'center-left';
    case 'center-left':
      return 'center-right';
    default:
      return pos;
  }
};

self.onmessage = async (e: MessageEvent<NumberWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'number') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({
        type: 'progress',
        percent,
        message,
      } as NumberWorkerMessageOut);
    };

    postProgress(10, 'Iniciando motor empresarial de foliado PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);

    // Selección tipográfica empresarial
    let fontName = StandardFonts.HelveticaBold;
    if (options.fontFamily === 'times') fontName = StandardFonts.TimesRomanBold;
    if (options.fontFamily === 'courier') fontName = StandardFonts.CourierBold;
    const font = await pdfDoc.embedFont(fontName);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const {
      position,
      textFormat,
      customPrefix,
      margin,
      fontSizeOption,
      fontColor,
      numberStyle,
      pageMode = 'single',
      drawBackground = false,
      skipFirstPage,
      firstNumber,
      startPage,
      endPage,
      metadata,
    } = options;

    postProgress(20, 'Configurando estructura notarial y metadatos...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    // Tamaño de fuente calibrado
    let textSize = 12;
    if (fontSizeOption === 'small') textSize = 9;
    if (fontSizeOption === 'large') textSize = 15;

    // Márgenes físicos calibrados en puntos (72 dpi)
    let marginPts = 28; // ~1 cm
    if (margin === 'small') marginPts = 14; // ~0.5 cm
    if (margin === 'big') marginPts = 56; // ~2 cm

    // Color de tinta profesional
    let colorRgb = rgb(0.08, 0.08, 0.08); // Negro carbón
    if (fontColor === 'red') colorRgb = rgb(0.85, 0.1, 0.1);
    if (fontColor === 'blue') colorRgb = rgb(0.1, 0.3, 0.85);
    if (fontColor === 'white') colorRgb = rgb(0.98, 0.98, 0.98);

    const fromIndex = Math.max(0, startPage - 1);
    const toIndex = Math.min(totalPages - 1, endPage - 1);

    for (let i = fromIndex; i <= toIndex; i++) {
      if (skipFirstPage && i === 0) {
        continue;
      }

      const currentPercent = 20 + Math.floor(((i + 1) / totalPages) * 65);
      postProgress(currentPercent, `Foliando página ${i + 1} de ${totalPages}...`);

      const page = pages[i];
      const { width, height } = page.getSize();
      const pageRotation = (((page.getRotation()?.angle || 0) % 360) + 360) % 360;

      // Calcular número correlativo
      const pageSequence = i - fromIndex;
      const rawNum = firstNumber + pageSequence;
      const isEvenPage = (i + 1) % 2 === 0;

      let numValueStr = `${rawNum}`;
      if (numberStyle === 'padded') {
        numValueStr = String(rawNum).padStart(2, '0');
      } else if (numberStyle === 'padded-3') {
        numValueStr = String(rawNum).padStart(3, '0');
      } else if (numberStyle === 'padded-6') {
        numValueStr = String(rawNum).padStart(6, '0');
      } else if (numberStyle === 'roman') {
        numValueStr = toRoman(rawNum, false);
      } else if (numberStyle === 'roman-lower') {
        numValueStr = toRoman(rawNum, true);
      }

      // Estilo de formato textual (Bates, notarial, legal, páginas)
      let folioText = numValueStr;
      if (textFormat === 'page-n-of-p') {
        folioText = `Página ${numValueStr} de ${totalPages}`;
      } else if (textFormat === 'pag-n-of-p') {
        folioText = `Pág. ${numValueStr} de ${totalPages}`;
      } else if (textFormat === 'folio-n') {
        folioText = `Folio ${numValueStr}`;
      } else if (textFormat === 'folio-n-vto') {
        folioText = isEvenPage ? `Folio ${numValueStr} vto.` : `Folio ${numValueStr}`;
      } else if (textFormat === 'bates') {
        const batesPrefix = customPrefix.trim() || 'BATES';
        const batesPadded = String(rawNum).padStart(6, '0');
        folioText = `${batesPrefix}-${batesPadded}`;
      } else if (textFormat === 'custom' && customPrefix.trim()) {
        const rawTpl = customPrefix.trim();
        if (rawTpl.includes('{n}') || rawTpl.includes('{p}')) {
          folioText = rawTpl.replace(/{n}/g, numValueStr).replace(/{p}/g, String(totalPages));
        } else {
          folioText = `${rawTpl} ${numValueStr}`;
        }
      }

      // Posición efectiva (con soporte para páginas enfrentadas)
      const effectivePos =
        pageMode === 'facing' ? getFacingPosition(position, isEvenPage) : position;
      const textWidth = font.widthOfTextAtSize(folioText, textSize);

      // Dimensiones visuales considerando posible rotación nativa de la página
      const visualW = pageRotation === 90 || pageRotation === 270 ? height : width;
      const visualH = pageRotation === 90 || pageRotation === 270 ? width : height;

      let vx = marginPts;
      let vy = marginPts;

      switch (effectivePos) {
        case 'top-left':
          vx = marginPts;
          vy = visualH - marginPts - textSize;
          break;
        case 'top-center':
          vx = (visualW - textWidth) / 2;
          vy = visualH - marginPts - textSize;
          break;
        case 'top-right':
          vx = visualW - textWidth - marginPts;
          vy = visualH - marginPts - textSize;
          break;
        case 'center-left':
          vx = marginPts;
          vy = (visualH - textSize) / 2;
          break;
        case 'center':
          vx = (visualW - textWidth) / 2;
          vy = (visualH - textSize) / 2;
          break;
        case 'center-right':
          vx = visualW - textWidth - marginPts;
          vy = (visualH - textSize) / 2;
          break;
        case 'bottom-left':
          vx = marginPts;
          vy = marginPts;
          break;
        case 'bottom-center':
          vx = (visualW - textWidth) / 2;
          vy = marginPts;
          break;
        case 'bottom-right':
          vx = visualW - textWidth - marginPts;
          vy = marginPts;
          break;
      }

      // Coordenadas finales compensando rotación de página
      let finalX = vx;
      let finalY = vy;
      let textAngle = 0;

      if (pageRotation === 0) {
        finalX = vx;
        finalY = vy;
        textAngle = 0;
      } else if (pageRotation === 90) {
        finalX = width - vy;
        finalY = vx;
        textAngle = 90;
      } else if (pageRotation === 180) {
        finalX = width - vx - textWidth;
        finalY = height - vy - textSize;
        textAngle = 180;
      } else if (pageRotation === 270) {
        finalX = vy + textSize;
        finalY = height - vx - textWidth;
        textAngle = 270;
      }

      // Cuadro protector opcional para documentos con fondos oscuros o membretes
      if (drawBackground) {
        const padX = 4;
        const padY = 2.5;
        page.drawRectangle({
          x: finalX - padX,
          y: finalY - padY,
          width: textWidth + padX * 2,
          height: textSize + padY * 2,
          color: rgb(1, 1, 1),
          opacity: 0.92,
          rotate: degrees(textAngle),
        });
      }

      // Estampar texto vectorial en alta definición
      page.drawText(folioText, {
        x: finalX,
        y: finalY,
        size: textSize,
        font,
        color: colorRgb,
        rotate: degrees(textAngle),
      });
    }

    postProgress(90, 'Comprimiendo y finalizando documento...');
    const resultBytes = await pdfDoc.save({ useObjectStreams: true });
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength,
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF foliado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as NumberWorkerMessageOut,
      [resultBuffer],
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al foliar el documento PDF',
    } as NumberWorkerMessageOut);
  }
};
