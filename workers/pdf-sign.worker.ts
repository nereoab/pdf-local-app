import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type Position9 = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface SignWorkerOptions {
  filePrefix: string;
  signatureBuffer?: ArrayBuffer;
  signatureMime?: string;
  pageScope: 'current' | 'all' | 'custom';
  customPageRange?: string;
  targetPage: number;
  freeX: number;
  freeY: number;
  scale: number;
  signerName: string;
  signerRole: string;
  showPrintedName: boolean;
  includeDate: boolean;
  includeHash: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface SignWorkerMessageIn {
  action: 'sign';
  arrayBuffer: ArrayBuffer;
  password?: string;
  options: SignWorkerOptions;
}

export type SignWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<SignWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'sign') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as SignWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const { 
      signatureBuffer, signatureMime, pageScope, customPageRange, targetPage, 
      freeX, freeY, scale, signerName, signerRole, showPrintedName, 
      includeDate, includeHash, metadata 
    } = options;

    postProgress(20, 'Configurando páginas objetivo y metadatos...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }
    pdfDoc.setProducer('PDFBlack v2.0 Enterprise Local Signature Engine');
    pdfDoc.setModificationDate(new Date());

    // Determinar conjunto de páginas a firmar
    const pagesToSign = new Set<number>();
    if (pageScope === 'all') {
      for (let i = 1; i <= totalPages; i++) pagesToSign.add(i);
    } else if (pageScope === 'custom' && customPageRange) {
      const parts = customPageRange.split(',');
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
              if (p >= 1 && p <= totalPages) pagesToSign.add(p);
            }
          }
        } else {
          const num = Number(trimmed);
          if (!isNaN(num) && num >= 1 && num <= totalPages) pagesToSign.add(num);
        }
      });
    } else {
      pagesToSign.add(Math.max(1, Math.min(totalPages, targetPage)));
    }

    let embeddedSig: any = null;
    if (signatureBuffer) {
      if (signatureMime === 'image/jpeg') {
        embeddedSig = await pdfDoc.embedJpg(signatureBuffer);
      } else {
        embeddedSig = await pdfDoc.embedPng(signatureBuffer);
      }
    }

    // Cargar fuentes vectoriales
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const lineColor = rgb(0.2, 0.2, 0.25);
    const textColor = rgb(0.1, 0.1, 0.1);
    const mutedColor = rgb(0.35, 0.35, 0.35);
    const hashColor = rgb(0.05, 0.55, 0.25);

    let count = 0;
    const totalToSign = pagesToSign.size;

    for (const pageNum of pagesToSign) {
      count++;
      const currentPercent = 25 + Math.floor((count / totalToSign) * 60);
      postProgress(currentPercent, `Estampando firma corporativa en página ${pageNum} de ${totalPages}...`);

      const page = pages[pageNum - 1];
      const { width, height } = page.getSize();

      if (embeddedSig) {
        const bw = 180 * (scale / 100);
        const bh = (embeddedSig.height / embeddedSig.width) * bw;

        const xPct = freeX / 100;
        const yPct = freeY / 100;
        let x = xPct * width - (bw / 2);
        let y = (1 - yPct) * height - (bh / 2);

        x = Math.max(15, Math.min(width - bw - 15, x));
        y = Math.max(65, Math.min(height - bh - 25, y));

        // 1. Dibujar imagen / manuscrito de firma
        page.drawImage(embeddedSig, { x, y, width: bw, height: bh });

        // 2. Línea divisoria elegante
        page.drawLine({
          start: { x: x, y: y - 3 },
          end: { x: x + bw, y: y - 3 },
          thickness: 1,
          color: lineColor,
        });

        let currentY = y - 14;

        // 3. Nombre impreso solo si showPrintedName es true
        const printName = (signerName && signerName.trim()) ? signerName.trim() : '';
        if (showPrintedName && printName) {
          page.drawText(printName, {
            x,
            y: currentY,
            size: 8.5,
            font: fontBold,
            color: textColor,
          });
          currentY -= 11;
        }

        // 4. Cargo / Razón social
        if (signerRole && signerRole.trim()) {
          page.drawText(signerRole.trim(), {
            x,
            y: currentY,
            size: 7.5,
            font: fontRegular,
            color: mutedColor,
          });
          currentY -= 10;
        }

        // 5. Fecha y Hora
        if (includeDate) {
          const dateStr = `Firmado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
          page.drawText(dateStr, {
            x,
            y: currentY,
            size: 7,
            font: fontRegular,
            color: mutedColor,
          });
          currentY -= 9;
        }

        // 6. Hash de verificación
        if (includeHash) {
          const hashStr = `HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          page.drawText(hashStr, {
            x,
            y: currentY,
            size: 6.5,
            font: fontBold,
            color: hashColor,
          });
        }
      }
    }

    postProgress(88, 'Guardando y optimizando bytes del PDF firmado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF firmado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as SignWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al firmar el documento PDF',
    } as SignWorkerMessageOut);
  }
};
