import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export interface RotateWorkerPagePayload {
  pageNum: number;
  rotation: number;
}

export interface RotateWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface RotateWorkerMessageIn {
  action: 'rotate';
  arrayBuffer: ArrayBuffer;
  password?: string;
  pageRotations: RotateWorkerPagePayload[];
  options: RotateWorkerOptions;
}

export type RotateWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<RotateWorkerMessageIn>) => {
  const { action, arrayBuffer, password, pageRotations, options } = e.data;

  if (action !== 'rotate') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as RotateWorkerMessageOut);
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

    postProgress(30, 'Aplicando matriz de rotación a cada página...');

    if (options.metadata) {
      if (options.metadata.title) pdfDoc.setTitle(options.metadata.title);
      if (options.metadata.author) pdfDoc.setAuthor(options.metadata.author);
      if (options.metadata.subject) pdfDoc.setSubject(options.metadata.subject);
    }

    pdfPages.forEach((page, idx) => {
      const currentPercent = 30 + Math.floor(((idx + 1) / totalPages) * 55);
      postProgress(currentPercent, `Rotando página ${idx + 1} de ${totalPages}...`);

      const pageMeta = pageRotations[idx];
      if (pageMeta && pageMeta.rotation !== 0) {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + pageMeta.rotation) % 360));
      }

      if (options.renumberPages) {
        const { width } = page.getSize();
        page.drawText(`Página ${idx + 1} de ${totalPages}`, {
          x: width / 2 - 30,
          y: 15,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
    });

    postProgress(85, 'Guardando y optimizando bytes del PDF rotado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF rotado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as RotateWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al rotar el documento PDF',
    } as RotateWorkerMessageOut);
  }
};
