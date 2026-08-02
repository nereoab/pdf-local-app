import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';

export interface SplitWorkerOptions {
  filePrefix: string;
  createZip: boolean;
  mergeAllRanges?: boolean;
  addPageFooterNumbering?: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface SplitWorkerMessageIn {
  action: 'split';
  arrayBuffer: ArrayBuffer;
  password?: string;
  pageGroups: number[][];
  options: SplitWorkerOptions;
}

export type SplitWorkerMessageOut =
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; buffer: ArrayBuffer; filename: string; isZip: boolean; createdCount: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<SplitWorkerMessageIn>) => {
  const { action, arrayBuffer, password, pageGroups, options } = e.data;

  if (action !== 'split') return;

  try {
    const postProgress = (percent: number, message: string) => {
      (self as unknown as Worker).postMessage({ type: 'progress', percent, message } as SplitWorkerMessageOut);
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
    if (totalPages === 0 || pageGroups.length === 0) {
      throw new Error('El documento PDF no contiene páginas válidas para procesar.');
    }

    const { filePrefix, createZip, mergeAllRanges, addPageFooterNumbering, metadata } = options;

    // CASO 1: UNIR TODOS LOS RANGOS EN UN SOLO PDF
    if (mergeAllRanges) {
      postProgress(30, 'Uniendo todos los rangos en un único PDF...');
      const mergedPdf = await PDFDocument.create();
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

      if (metadata) {
        if (metadata.title) mergedPdf.setTitle(metadata.title);
        if (metadata.author) mergedPdf.setAuthor(metadata.author);
        if (metadata.subject) mergedPdf.setSubject(metadata.subject);
      }

      const allIndices = pageGroups.flat();
      const copiedPages = await mergedPdf.copyPages(srcDoc, allIndices);

      copiedPages.forEach((page, idx) => {
        if (addPageFooterNumbering) {
          const { width } = page.getSize();
          page.drawText(`Página ${idx + 1} de ${copiedPages.length}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        mergedPdf.addPage(page);
      });

      postProgress(80, 'Guardando archivo unificado...');
      const resultBytes = await mergedPdf.save();
      const resultBuffer = resultBytes.buffer.slice(
        resultBytes.byteOffset,
        resultBytes.byteOffset + resultBytes.byteLength
      ) as ArrayBuffer;

      postProgress(100, '¡PDF unificado completado!');
      (self as unknown as Worker).postMessage(
        {
          type: 'result',
          buffer: resultBuffer,
          filename: `${filePrefix}_Rangos_Unidos.pdf`,
          isZip: false,
          createdCount: 1,
        } as SplitWorkerMessageOut,
        [resultBuffer]
      );
      return;
    }

    // CASO 2: UN UNICO GRUPO DE PAGINAS GENERADO Y ZIP DESACTIVADO
    if (pageGroups.length === 1 && !createZip) {
      postProgress(40, 'Extrayendo rango de páginas en nuevo PDF...');
      const singlePdf = await PDFDocument.create();
      const font = await singlePdf.embedFont(StandardFonts.Helvetica);

      if (metadata) {
        if (metadata.title) singlePdf.setTitle(metadata.title);
        if (metadata.author) singlePdf.setAuthor(metadata.author);
        if (metadata.subject) singlePdf.setSubject(metadata.subject);
      }

      const copiedPages = await singlePdf.copyPages(srcDoc, pageGroups[0]);
      copiedPages.forEach((page, idx) => {
        if (addPageFooterNumbering) {
          const { width } = page.getSize();
          page.drawText(`Página ${idx + 1} de ${copiedPages.length}`, {
            x: width / 2 - 30,
            y: 15,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        singlePdf.addPage(page);
      });

      postProgress(85, 'Guardando documento dividido...');
      const resultBytes = await singlePdf.save();
      const resultBuffer = resultBytes.buffer.slice(
        resultBytes.byteOffset,
        resultBytes.byteOffset + resultBytes.byteLength
      ) as ArrayBuffer;

      postProgress(100, '¡PDF dividido con éxito!');
      (self as unknown as Worker).postMessage(
        {
          type: 'result',
          buffer: resultBuffer,
          filename: `${filePrefix}_Parte_1.pdf`,
          isZip: false,
          createdCount: 1,
        } as SplitWorkerMessageOut,
        [resultBuffer]
      );
      return;
    }

    // CASO 3: MULTIPLES GRUPOS DE PAGINAS
    if (createZip) {
      postProgress(25, `Iniciando división en ${pageGroups.length} archivos...`);
      const zip = new JSZip();

      for (let i = 0; i < pageGroups.length; i++) {
        const currentPercent = 25 + Math.floor((i / pageGroups.length) * 60);
        postProgress(currentPercent, `Generando parte ${i + 1} de ${pageGroups.length}...`);

        const partPdf = await PDFDocument.create();
        const font = await partPdf.embedFont(StandardFonts.Helvetica);

        if (metadata) {
          if (metadata.title) partPdf.setTitle(`${metadata.title} - Parte ${i + 1}`);
          if (metadata.author) partPdf.setAuthor(metadata.author);
          if (metadata.subject) partPdf.setSubject(metadata.subject);
        }

        const copiedPages = await partPdf.copyPages(srcDoc, pageGroups[i]);
        copiedPages.forEach((page, pIdx) => {
          if (addPageFooterNumbering) {
            const { width } = page.getSize();
            page.drawText(`Página ${pIdx + 1} de ${copiedPages.length}`, {
              x: width / 2 - 30,
              y: 15,
              size: 9,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
          partPdf.addPage(page);
        });

        const bytes = await partPdf.save();
        const partFilename = `${filePrefix}_Parte_${i + 1}.pdf`;
        zip.file(partFilename, bytes);
      }

      postProgress(90, 'Comprimiendo paquete en archivo .ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });

      postProgress(100, '¡Archivo .ZIP completado!');
      (self as unknown as Worker).postMessage(
        {
          type: 'result',
          buffer: zipBlob,
          filename: `${filePrefix}_Dividido.zip`,
          isZip: true,
          createdCount: pageGroups.length,
        } as SplitWorkerMessageOut,
        [zipBlob]
      );
    } else {
      // Descarga de la primera parte si ZIP está desactivado
      postProgress(50, 'Generando primera parte del PDF...');
      const partPdf = await PDFDocument.create();
      const copiedPages = await partPdf.copyPages(srcDoc, pageGroups[0]);
      copiedPages.forEach((p) => partPdf.addPage(p));

      const bytes = await partPdf.save();
      const resultBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;

      postProgress(100, '¡Parte 1 descargada!');
      (self as unknown as Worker).postMessage(
        {
          type: 'result',
          buffer: resultBuffer,
          filename: `${filePrefix}_Parte_1.pdf`,
          isZip: false,
          createdCount: pageGroups.length,
        } as SplitWorkerMessageOut,
        [resultBuffer]
      );
    }
  } catch (error: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      message: error?.message || 'Error desconocido al dividir el PDF',
    } as SplitWorkerMessageOut);
  }
};
