import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export interface ReorderPageItemPayload {
  fileIndex: number;
  originalPageNum: number;
  rotation: number;
  isBlank: boolean;
}

export interface ReorderWorkerOptions {
  filePrefix: string;
  renumberPages: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface ReorderWorkerFilePayload {
  arrayBuffer: ArrayBuffer;
  password?: string;
}

export interface ReorderWorkerMessageIn {
  action: 'reorder';
  files: ReorderWorkerFilePayload[];
  pageSequence: ReorderPageItemPayload[];
  options: ReorderWorkerOptions;
}

export type ReorderWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; totalPages: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<ReorderWorkerMessageIn>) => {
  const { action, files, pageSequence, options } = e.data;

  if (action !== 'reorder') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as ReorderWorkerMessageOut);
    };

    postProgress(10, 'Cargando documentos PDF fuente...');

    const fileDocs: PDFDocument[] = [];
    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const f = files[fIdx];
      const loadOptions: any = {};
      if (f.password) {
        loadOptions.password = f.password;
      } else {
        loadOptions.ignoreEncryption = true;
      }
      const doc = await PDFDocument.load(f.arrayBuffer, loadOptions);
      fileDocs.push(doc);
    }

    postProgress(30, 'Iniciando ensamblado del nuevo orden...');
    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

    if (options.metadata) {
      if (options.metadata.title) mergedPdf.setTitle(options.metadata.title);
      if (options.metadata.author) mergedPdf.setAuthor(options.metadata.author);
      if (options.metadata.subject) mergedPdf.setSubject(options.metadata.subject);
    }

    const totalSeq = pageSequence.length;

    for (let i = 0; i < totalSeq; i++) {
      const currentPercent = 30 + Math.floor(((i + 1) / totalSeq) * 55);
      postProgress(currentPercent, `Ensamblando página ${i + 1} de ${totalSeq}...`);

      const item = pageSequence[i];

      if (item.isBlank) {
        mergedPdf.addPage([595.28, 841.89]);
      } else {
        const sourceDoc = fileDocs[item.fileIndex];
        if (!sourceDoc) continue;

        const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [item.originalPageNum - 1]);

        if (item.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
        }

        if (options.renumberPages) {
          const { width } = copiedPage.getSize();
          copiedPage.drawText(`Página ${i + 1} de ${totalSeq}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }

        mergedPdf.addPage(copiedPage);
      }
    }

    postProgress(88, 'Guardando y optimizando bytes del PDF reordenado...');
    const resultBytes = await mergedPdf.save();
    const resultBuffer = resultBytes.buffer.slice(
      resultBytes.byteOffset,
      resultBytes.byteOffset + resultBytes.byteLength
    ) as ArrayBuffer;

    postProgress(100, '¡Documento PDF reordenado con éxito!');
    (self as unknown as Worker).postMessage(
      {
        type: 'result',
        buffer: resultBuffer,
        totalPages: mergedPdf.getPageCount(),
      } as ReorderWorkerMessageOut,
      [resultBuffer]
    );
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al reordenar el PDF',
    } as ReorderWorkerMessageOut);
  }
};
