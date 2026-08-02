import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface EditWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface EditWorkerMessageIn {
  action: 'process';
  arrayBuffer: ArrayBuffer;
  options: EditWorkerOptions;
}

export type EditWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<EditWorkerMessageIn>) => {
  const { action, arrayBuffer, options } = e.data;

  if (action !== 'process') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as EditWorkerMessageOut);
    };

    postProgress(20, 'Analizando modificaciones y capas del PDF...');

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pdfPages = pdfDoc.getPages();
    const totalPages = pdfPages.length;

    postProgress(50, 'Aplicando estampado de metadatos y numeración...');

    if (options.metadata) {
      if (options.metadata.title) pdfDoc.setTitle(options.metadata.title);
      if (options.metadata.author) pdfDoc.setAuthor(options.metadata.author);
      if (options.metadata.subject) pdfDoc.setSubject(options.metadata.subject);
    }

    if (options.renumberPages) {
      pdfPages.forEach((page, idx) => {
        const { width } = page.getSize();
        page.drawText(`Página ${idx + 1} de ${totalPages}`, {
          x: width / 2 - 30,
          y: 15,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });
    }

    postProgress(85, 'Compilando y optimizando bytes del PDF editado...');
    const resultBytes = await pdfDoc.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF editado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as EditWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al procesar el documento PDF editado',
    } as EditWorkerMessageOut);
  }
};
