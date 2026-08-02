import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface DeletePagesWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface DeletePagesWorkerMessageIn {
  action: 'delete_pages';
  arrayBuffer: ArrayBuffer;
  password?: string;
  pagesToKeep: number[];
  options: DeletePagesWorkerOptions;
}

export type DeletePagesWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<DeletePagesWorkerMessageIn>) => {
  const { action, arrayBuffer, password, pagesToKeep, options } = e.data;

  if (action !== 'delete_pages') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as DeletePagesWorkerMessageOut);
    };

    postProgress(10, 'Cargando estructura del documento PDF...');

    const loadOptions: any = {};
    if (password) {
      loadOptions.password = password;
    } else {
      loadOptions.ignoreEncryption = true;
    }

    const srcDoc = await PDFDocument.load(arrayBuffer, loadOptions);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0 || pagesToKeep.length === 0) {
      throw new Error('No hay páginas válidas para conservar en el documento.');
    }

    postProgress(35, `Extrayendo ${pagesToKeep.length} páginas conservadas...`);
    const newPdf = await PDFDocument.create();
    const font = await newPdf.embedFont(StandardFonts.Helvetica);

    if (options.metadata) {
      if (options.metadata.title) newPdf.setTitle(options.metadata.title);
      if (options.metadata.author) newPdf.setAuthor(options.metadata.author);
      if (options.metadata.subject) newPdf.setSubject(options.metadata.subject);
    }

    const copiedPages = await newPdf.copyPages(srcDoc, pagesToKeep);

    copiedPages.forEach((page, idx) => {
      if (options.renumberPages) {
        const { width } = page.getSize();
        page.drawText(`Página ${idx + 1} de ${copiedPages.length}`, {
          x: width / 2 - 30,
          y: 15,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
      newPdf.addPage(page);
    });

    postProgress(85, 'Guardando y optimizando bytes del PDF depurado...');
    const resultBytes = await newPdf.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Páginas eliminadas con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages: newPdf.getPageCount(),
      } as DeletePagesWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al eliminar páginas del PDF',
    } as DeletePagesWorkerMessageOut);
  }
};
