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

  const postProgress = (percent: number, message: string) => {
    (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as EditWorkerMessageOut);
  };

  try {
    const hasMetadata = Boolean(
      options.metadata?.title?.trim() ||
      options.metadata?.author?.trim() ||
      options.metadata?.subject?.trim()
    );
    const needsPdfLib = options.renumberPages || hasMetadata;

    // Si no se requiere renumerar páginas ni metadatos, devolver directamente el buffer de Apryse WebViewer
    if (!needsPdfLib) {
      postProgress(100, '¡Documento PDF preparado con éxito!');
      (self as unknown as Worker).postMessage(
        {
          type: 'result',
          buffer: arrayBuffer,
          totalPages: 1,
        } as EditWorkerMessageOut,
        [arrayBuffer]
      );
      return;
    }

    postProgress(20, 'Analizando modificaciones y capas del PDF...');

    let resultBuffer = arrayBuffer;
    let totalPages = 1;

    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfPages = pdfDoc.getPages();
      totalPages = pdfPages.length;

      postProgress(50, 'Aplicando estampado de metadatos y numeración...');

      if (hasMetadata && options.metadata) {
        try {
          if (options.metadata.title?.trim()) pdfDoc.setTitle(options.metadata.title.trim());
          if (options.metadata.author?.trim()) pdfDoc.setAuthor(options.metadata.author.trim());
          if (options.metadata.subject?.trim()) pdfDoc.setSubject(options.metadata.subject.trim());
        } catch (mErr) {
          console.warn('No se pudieron aplicar metadatos secundarios:', mErr);
        }
      }

      if (options.renumberPages) {
        try {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          pdfPages.forEach((page, idx) => {
            const { width } = page.getSize();
            page.drawText(`Página ${idx + 1} de ${totalPages}`, {
              x: Math.max(10, width / 2 - 30),
              y: 15,
              size: 9,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
          });
        } catch (rErr) {
          console.warn('No se pudo aplicar numeración de páginas:', rErr);
        }
      }

      postProgress(85, 'Compilando y optimizando bytes del PDF editado...');
      const resultBytes = await pdfDoc.save();
      resultBuffer = resultBytes.buffer.slice(
        resultBytes.byteOffset,
        resultBytes.byteOffset + resultBytes.byteLength
      ) as ArrayBuffer;
    } catch (pdfLibErr) {
      console.warn('pdf-lib no pudo re-serializar el PDF de Apryse; usando buffer nativo:', pdfLibErr);
      resultBuffer = arrayBuffer;
    }

    postProgress(100, '¡Documento PDF editado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages,
      } as EditWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: errMsg || 'Error desconocido al procesar el documento PDF editado',
    } as EditWorkerMessageOut);
  }
};
