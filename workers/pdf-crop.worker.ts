import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type CropScope = 'all' | 'even' | 'odd' | 'current' | 'custom';

export interface CropWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  cropScope: CropScope;
  currentPage: number;
  customPages?: number[];
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface CropWorkerMessageIn {
  action: 'crop';
  arrayBuffer: ArrayBuffer;
  password?: string;
  options: CropWorkerOptions;
}

export type CropWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<CropWorkerMessageIn>) => {
  const { action, arrayBuffer, password, options } = e.data;

  if (action !== 'crop') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({
        type: 'progress',
        percent,
        message,
      } as CropWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pdfPages = pdfDoc.getPages();
    const totalPages = pdfPages.length;

    if (totalPages === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const {
      filePrefix,
      renumberPages,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      cropScope,
      currentPage,
      customPages,
      metadata,
    } = options;

    postProgress(30, 'Calculando coordenadas de márgenes en CropBox...');

    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    }

    // Convertir mm a puntos PDF (1 mm = 2.83465 pt)
    const mmToPoints = (mm: number) => mm * 2.83465;

    const topPt = mmToPoints(marginTop);
    const bottomPt = mmToPoints(marginBottom);
    const leftPt = mmToPoints(marginLeft);
    const rightPt = mmToPoints(marginRight);

    pdfPages.forEach((page, idx) => {
      const currentPercent = 30 + Math.floor(((idx + 1) / totalPages) * 55);
      postProgress(currentPercent, `Recortando página ${idx + 1} de ${totalPages}...`);

      const pageNum = idx + 1;
      let shouldCrop = false;

      if (cropScope === 'all') shouldCrop = true;
      else if (cropScope === 'even' && pageNum % 2 === 0) shouldCrop = true;
      else if (cropScope === 'odd' && pageNum % 2 !== 0) shouldCrop = true;
      else if (cropScope === 'current' && pageNum === currentPage) shouldCrop = true;
      else if (cropScope === 'custom' && customPages && customPages.includes(pageNum))
        shouldCrop = true;

      if (shouldCrop) {
        const { width, height } = page.getSize();
        const newX = Math.max(0, leftPt);
        const newY = Math.max(0, bottomPt);
        const newW = Math.max(10, width - leftPt - rightPt);
        const newH = Math.max(10, height - topPt - bottomPt);

        page.setCropBox(newX, newY, newW, newH);
      }

      if (renumberPages) {
        const { width } = page.getSize();
        page.drawText(`Página ${pageNum} de ${totalPages}`, {
          x: width / 2 - 30,
          y: 15,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
    });

    postProgress(85, 'Guardando y optimizando bytes del PDF recortado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength,
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF recortado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as CropWorkerMessageOut,
      [resultBuffer],
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al recortar el documento PDF',
    } as CropWorkerMessageOut);
  }
};
