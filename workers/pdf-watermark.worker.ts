import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export type WatermarkType = 'text' | 'image';
export type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  wmType: WatermarkType;
  wmText: string;
  imageBuffer?: ArrayBuffer;
  imageMime?: string;
  position: Position9;
  rotation: number;
  opacity: number;
  fontSize: number;
  fontColor: string;
  pageScope: 'all' | 'custom';
  customPageRange: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface WatermarkWorkerMessageIn {
  action: 'watermark';
  arrayBuffer: ArrayBuffer;
  password?: string;
  options: WatermarkWorkerOptions;
}

export type WatermarkWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<WatermarkWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'watermark') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as WatermarkWorkerMessageOut);
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
      wmType, wmText, imageBuffer, imageMime, position, rotation, opacity, 
      fontSize, fontColor, pageScope, customPageRange, metadata 
    } = options;

    postProgress(25, 'Incrustando recursos del sello de agua...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    let colorRgb = rgb(0.85, 0.1, 0.1);
    if (fontColor === 'dark') colorRgb = rgb(0.15, 0.15, 0.15);
    if (fontColor === 'blue') colorRgb = rgb(0.1, 0.35, 0.85);
    if (fontColor === 'emerald') colorRgb = rgb(0.05, 0.65, 0.35);
    if (fontColor === 'white') colorRgb = rgb(0.95, 0.95, 0.95);

    let embeddedImg: any = null;
    if (wmType === 'image' && imageBuffer) {
      if (imageMime === 'image/png') {
        embeddedImg = await pdfDoc.embedPng(imageBuffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imageBuffer);
      }
    }

    // Helper para interpretar páginas seleccionadas
    const targetPages = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) targetPages.add(i);
    } else {
      const parts = customPageRange.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= totalPages) targetPages.add(i);
            }
          }
        } else {
          const num = Number(trimmed);
          if (!isNaN(num) && num >= 1 && num <= totalPages) {
            targetPages.add(num);
          }
        }
      });
    }

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      const currentPercent = 25 + Math.floor(((i + 1) / totalPages) * 60);
      postProgress(currentPercent, `Estampando sello de agua en página ${pageNum} de ${totalPages}...`);

      const page = pages[i];
      const { width, height } = page.getSize();

      if (wmType === 'text') {
        const textWidth = font.widthOfTextAtSize(wmText || 'CONFIDENCIAL', fontSize);
        let x = (width / 2) - (textWidth / 2);
        let y = (height / 2) - (fontSize / 2);

        if (position === 'top-left') { x = 40; y = height - 60; }
        if (position === 'top-center') { x = (width / 2) - (textWidth / 2); y = height - 60; }
        if (position === 'top-right') { x = width - textWidth - 40; y = height - 60; }
        if (position === 'bottom-left') { x = 40; y = 40; }
        if (position === 'bottom-center') { x = (width / 2) - (textWidth / 2); y = 40; }
        if (position === 'bottom-right') { x = width - textWidth - 40; y = 40; }

        page.drawText(wmText || 'CONFIDENCIAL', {
          x,
          y,
          size: fontSize,
          font,
          color: colorRgb,
          opacity: opacity / 100,
          rotate: degrees(rotation),
        });
      } else if (wmType === 'image' && embeddedImg) {
        const imgScaled = embeddedImg.scale(0.35);
        let x = (width / 2) - (imgScaled.width / 2);
        let y = (height / 2) - (imgScaled.height / 2);

        if (position === 'top-left') { x = 40; y = height - imgScaled.height - 40; }
        if (position === 'top-center') { x = (width / 2) - (imgScaled.width / 2); y = height - imgScaled.height - 40; }
        if (position === 'top-right') { x = width - imgScaled.width - 40; y = height - imgScaled.height - 40; }
        if (position === 'bottom-left') { x = 40; y = 40; }
        if (position === 'bottom-center') { x = (width / 2) - (imgScaled.width / 2); y = 40; }
        if (position === 'bottom-right') { x = width - imgScaled.width - 40; y = 40; }

        page.drawImage(embeddedImg, {
          x,
          y,
          width: imgScaled.width,
          height: imgScaled.height,
          opacity: opacity / 100,
          rotate: degrees(rotation),
        });
      }
    }

    postProgress(85, 'Guardando y optimizando bytes del PDF sellado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF sellado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as WatermarkWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al sellar el documento PDF',
    } as WatermarkWorkerMessageOut);
  }
};
