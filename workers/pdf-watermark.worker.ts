import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export type WatermarkType = 'text' | 'image';
export type WatermarkPattern = 'single' | 'tile';
export type WatermarkLayer = 'over' | 'under';
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

export interface WatermarkWorkerOptions {
  filePrefix: string;
  renumberPages?: boolean;
  wmType: WatermarkType;
  wmPattern?: WatermarkPattern;
  layer?: WatermarkLayer;
  wmText: string;
  imageBuffer?: ArrayBuffer;
  imageMime?: string;
  imageScale?: number;
  position: Position9;
  rotation: number;
  opacity: number;
  fontSize: number;
  fontColor: string;
  fontFamily?: 'helvetica' | 'times' | 'courier';
  pageScope: 'all' | 'custom' | 'odds' | 'evens';
  customPageRange: string;
  skipFirstPage?: boolean;
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
      (self as unknown as Worker).postMessage({
        type: 'progress',
        percent,
        message,
      } as WatermarkWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura y fuentes del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);

    // Selección de tipografía estándar corporativa
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
      wmType,
      wmPattern = 'single',
      wmText,
      imageBuffer,
      imageMime,
      imageScale = 0.35,
      position,
      rotation,
      opacity,
      fontSize,
      fontColor,
      pageScope,
      customPageRange,
      skipFirstPage = false,
      metadata,
    } = options;

    postProgress(25, 'Incrustando recursos del sello de agua empresarial...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    // Paleta de color corporativo
    let colorRgb = rgb(0.85, 0.12, 0.12); // Rojo confidencial por defecto
    if (fontColor === 'dark') colorRgb = rgb(0.12, 0.12, 0.12);
    if (fontColor === 'blue') colorRgb = rgb(0.1, 0.35, 0.85);
    if (fontColor === 'emerald') colorRgb = rgb(0.05, 0.65, 0.35);
    if (fontColor === 'amber') colorRgb = rgb(0.88, 0.58, 0.08);
    if (fontColor === 'white') colorRgb = rgb(0.96, 0.96, 0.96);

    let embeddedImg: any = null;
    if (wmType === 'image' && imageBuffer) {
      if (imageMime === 'image/png') {
        embeddedImg = await pdfDoc.embedPng(imageBuffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imageBuffer);
      }
    }

    // Determinar páginas a estampar
    const targetPages = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) targetPages.add(i);
    } else if (pageScope === 'odds') {
      for (let i = 1; i <= totalPages; i += 2) targetPages.add(i);
    } else if (pageScope === 'evens') {
      for (let i = 2; i <= totalPages; i += 2) targetPages.add(i);
    } else {
      const parts = (customPageRange || '').split(',');
      parts.forEach((part) => {
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

    // Omitir carátula si skipFirstPage está activo
    if (skipFirstPage) {
      targetPages.delete(1);
    }

    const textToDraw = wmText?.trim() || 'CONFIDENCIAL';
    const stampOpacity = Math.max(0.05, Math.min(1, opacity / 100));

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      if (!targetPages.has(pageNum)) continue;

      const currentPercent = 25 + Math.floor(((i + 1) / totalPages) * 60);
      postProgress(
        currentPercent,
        `Estampando sello de agua en página ${pageNum} de ${totalPages}...`,
      );

      const page = pages[i];
      const { width, height } = page.getSize();
      const pageRotation = (((page.getRotation()?.angle || 0) % 360) + 360) % 360;

      // Dimensiones visuales considerando orientación real de la hoja
      const visualW = pageRotation === 90 || pageRotation === 270 ? height : width;
      const visualH = pageRotation === 90 || pageRotation === 270 ? width : height;

      // Conversión de coordenadas relativas visuales a coordenadas nativas de la página con compensación
      const transformVisualToNative = (
        vx: number,
        vy: number,
        w: number,
        h: number,
        itemRotation: number,
      ) => {
        let nativeX = vx;
        let nativeY = vy;
        let combinedRotation = (((pageRotation + itemRotation) % 360) + 360) % 360;

        if (pageRotation === 0) {
          nativeX = vx;
          nativeY = vy;
        } else if (pageRotation === 90) {
          nativeX = width - vy;
          nativeY = vx;
        } else if (pageRotation === 180) {
          nativeX = width - vx - w;
          nativeY = height - vy - h;
        } else if (pageRotation === 270) {
          nativeX = vy + h;
          nativeY = height - vx - w;
        }

        return { nativeX, nativeY, combinedRotation };
      };

      if (wmType === 'text') {
        const textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
        const textHeight = fontSize;

        if (wmPattern === 'tile') {
          // Modo Mosaico / Patrón Repetido Anti-Filtraciones (DLP Enterprise)
          const stepX = Math.max(textWidth + 80, 200);
          const stepY = Math.max(fontSize * 4, 140);

          for (let row = -1; row * stepY < visualH + stepY; row++) {
            const offsetX = row % 2 === 0 ? 0 : stepX / 2;
            for (let col = -1; col * stepX < visualW + stepX; col++) {
              const vx = col * stepX + offsetX;
              const vy = row * stepY;

              const { nativeX, nativeY, combinedRotation } = transformVisualToNative(
                vx,
                vy,
                textWidth,
                textHeight,
                rotation,
              );

              page.drawText(textToDraw, {
                x: nativeX,
                y: nativeY,
                size: fontSize,
                font,
                color: colorRgb,
                opacity: stampOpacity,
                rotate: degrees(combinedRotation),
              });
            }
          }
        } else {
          // Modo Sello Único en Matriz de 9 Puntos
          let vx = (visualW - textWidth) / 2;
          let vy = (visualH - textHeight) / 2;

          const margin = 40;
          switch (position) {
            case 'top-left':
              vx = margin;
              vy = visualH - textHeight - margin;
              break;
            case 'top-center':
              vx = (visualW - textWidth) / 2;
              vy = visualH - textHeight - margin;
              break;
            case 'top-right':
              vx = visualW - textWidth - margin;
              vy = visualH - textHeight - margin;
              break;
            case 'center-left':
              vx = margin;
              vy = (visualH - textHeight) / 2;
              break;
            case 'center':
              vx = (visualW - textWidth) / 2;
              vy = (visualH - textHeight) / 2;
              break;
            case 'center-right':
              vx = visualW - textWidth - margin;
              vy = (visualH - textHeight) / 2;
              break;
            case 'bottom-left':
              vx = margin;
              vy = margin;
              break;
            case 'bottom-center':
              vx = (visualW - textWidth) / 2;
              vy = margin;
              break;
            case 'bottom-right':
              vx = visualW - textWidth - margin;
              vy = margin;
              break;
          }

          const { nativeX, nativeY, combinedRotation } = transformVisualToNative(
            vx,
            vy,
            textWidth,
            textHeight,
            rotation,
          );

          page.drawText(textToDraw, {
            x: nativeX,
            y: nativeY,
            size: fontSize,
            font,
            color: colorRgb,
            opacity: stampOpacity,
            rotate: degrees(combinedRotation),
          });
        }
      } else if (wmType === 'image' && embeddedImg) {
        const scaleVal = Math.max(0.05, Math.min(1, imageScale));
        const imgScaled = embeddedImg.scale(scaleVal);
        const imgW = imgScaled.width;
        const imgH = imgScaled.height;

        if (wmPattern === 'tile') {
          // Mosaico de logotipo
          const stepX = Math.max(imgW + 60, 180);
          const stepY = Math.max(imgH + 60, 150);

          for (let row = -1; row * stepY < visualH + stepY; row++) {
            const offsetX = row % 2 === 0 ? 0 : stepX / 2;
            for (let col = -1; col * stepX < visualW + stepX; col++) {
              const vx = col * stepX + offsetX;
              const vy = row * stepY;

              const { nativeX, nativeY, combinedRotation } = transformVisualToNative(
                vx,
                vy,
                imgW,
                imgH,
                rotation,
              );

              page.drawImage(embeddedImg, {
                x: nativeX,
                y: nativeY,
                width: imgW,
                height: imgH,
                opacity: stampOpacity,
                rotate: degrees(combinedRotation),
              });
            }
          }
        } else {
          // Sello de imagen único en posición 9 puntos
          let vx = (visualW - imgW) / 2;
          let vy = (visualH - imgH) / 2;

          const margin = 40;
          switch (position) {
            case 'top-left':
              vx = margin;
              vy = visualH - imgH - margin;
              break;
            case 'top-center':
              vx = (visualW - imgW) / 2;
              vy = visualH - imgH - margin;
              break;
            case 'top-right':
              vx = visualW - imgW - margin;
              vy = visualH - imgH - margin;
              break;
            case 'center-left':
              vx = margin;
              vy = (visualH - imgH) / 2;
              break;
            case 'center':
              vx = (visualW - imgW) / 2;
              vy = (visualH - imgH) / 2;
              break;
            case 'center-right':
              vx = visualW - imgW - margin;
              vy = (visualH - imgH) / 2;
              break;
            case 'bottom-left':
              vx = margin;
              vy = margin;
              break;
            case 'bottom-center':
              vx = (visualW - imgW) / 2;
              vy = margin;
              break;
            case 'bottom-right':
              vx = visualW - imgW - margin;
              vy = margin;
              break;
          }

          const { nativeX, nativeY, combinedRotation } = transformVisualToNative(
            vx,
            vy,
            imgW,
            imgH,
            rotation,
          );

          page.drawImage(embeddedImg, {
            x: nativeX,
            y: nativeY,
            width: imgW,
            height: imgH,
            opacity: stampOpacity,
            rotate: degrees(combinedRotation),
          });
        }
      }
    }

    postProgress(85, 'Optimizando compresión y guardando bytes del documento sellado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength,
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF sellado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as WatermarkWorkerMessageOut,
      [resultBuffer],
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al sellar el documento PDF',
    } as WatermarkWorkerMessageOut);
  }
};
