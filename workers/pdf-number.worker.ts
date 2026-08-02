import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface NumberWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  position: Position9;
  textFormat: string;
  customPrefix: string;
  margin: 'small' | 'recommended' | 'big';
  fontSizeOption: 'small' | 'medium' | 'large';
  fontColor: string;
  numberStyle: 'arabic' | 'padded' | 'roman';
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

const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  let n = num;
  for (let i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  return roman || `${num}`;
};

self.onmessage = async (e: MessageEvent<NumberWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'number') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as NumberWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const { 
      position, textFormat, customPrefix, margin, fontSizeOption, fontColor, 
      numberStyle, skipFirstPage, firstNumber, startPage, endPage, metadata 
    } = options;

    postProgress(25, 'Configurando fuentes y estampa vectorial...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    let textSize = 13;
    if (fontSizeOption === 'small') textSize = 10;
    if (fontSizeOption === 'large') textSize = 16;

    let marginPts = 30;
    if (margin === 'small') marginPts = 15;
    if (margin === 'big') marginPts = 50;

    let colorRgb = rgb(0.1, 0.1, 0.1);
    if (fontColor === 'red') colorRgb = rgb(0.85, 0.1, 0.1);
    if (fontColor === 'blue') colorRgb = rgb(0.1, 0.3, 0.85);
    if (fontColor === 'white') colorRgb = rgb(0.95, 0.95, 0.95);

    const fromIndex = Math.max(0, startPage - 1);
    const toIndex = Math.min(totalPages - 1, endPage - 1);

    for (let i = fromIndex; i <= toIndex; i++) {
      if (skipFirstPage && i === 0) {
        continue;
      }

      const currentPercent = 25 + Math.floor(((i + 1) / totalPages) * 60);
      postProgress(currentPercent, `Estampando número en página ${i + 1} de ${totalPages}...`);

      const page = pages[i];
      const { width, height } = page.getSize();

      const rawNum = firstNumber + (i - fromIndex);
      let numValueStr = `${rawNum}`;

      if (numberStyle === 'padded') {
        numValueStr = String(rawNum).padStart(2, '0');
      } else if (numberStyle === 'roman') {
        numValueStr = toRoman(rawNum);
      }

      let folioText = numValueStr;
      if (textFormat === 'page-n-of-p') {
        folioText = `Página ${numValueStr} de ${totalPages}`;
      } else if (textFormat === 'folio-n') {
        folioText = `Folio ${numValueStr}`;
      } else if (textFormat === 'custom' && customPrefix.trim()) {
        folioText = `${customPrefix.trim()} ${numValueStr}`;
      }

      const textWidth = font.widthOfTextAtSize(folioText, textSize);

      let x = width - textWidth - marginPts;
      let y = marginPts;

      switch (position) {
        case 'top-left': x = marginPts; y = height - marginPts - textSize; break;
        case 'top-center': x = (width / 2) - (textWidth / 2); y = height - marginPts - textSize; break;
        case 'top-right': x = width - textWidth - marginPts; y = height - marginPts - textSize; break;
        case 'center-left': x = marginPts; y = (height / 2) - (textSize / 2); break;
        case 'center': x = (width / 2) - (textWidth / 2); y = (height / 2) - (textSize / 2); break;
        case 'center-right': x = width - textWidth - marginPts; y = (height / 2) - (textSize / 2); break;
        case 'bottom-left': x = marginPts; y = marginPts; break;
        case 'bottom-center': x = (width / 2) - (textWidth / 2); y = marginPts; break;
        case 'bottom-right': x = width - textWidth - marginPts; y = marginPts; break;
      }

      page.drawText(folioText, { x, y, size: textSize, font, color: colorRgb });
    }

    postProgress(85, 'Guardando y optimizando bytes del PDF foliado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF foliado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as NumberWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al foliar el documento PDF',
    } as NumberWorkerMessageOut);
  }
};
