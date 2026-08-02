/**
 * Web Worker para cifrado AES-256 de PDF sin bloquear el hilo principal.
 *
 * Utiliza @pdfsmaller/pdf-encrypt — motor de cifrado probado que implementa
 * AES-256 (V=5, R=6) según ISO 32000-2:2020 usando Web Crypto API + pdf-lib.
 *
 * Compatible con Adobe Acrobat, Chrome, Edge, Firefox, Foxit y visores
 * que soporten AES-256 (PDF 2.0).
 *
 * SEGURIDAD: 100% local. Las contraseñas se procesan en RAM del worker.
 * No se loguean, no se almacenan, no se transmiten a servidores.
 */

import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

// ============================================================
// INTERFACES
// ============================================================

export interface ProtectOptions {
  userPassword: string;
  ownerPassword: string;
  allowPrinting: boolean;
  allowHighQualityPrint: boolean;
  allowModifying: boolean;
  allowCopying: boolean;
  allowExtraction: boolean;
  allowAnnotating: boolean;
  allowFillingForms: boolean;
  allowAssembly: boolean;
  enableRasterize: boolean;
  customSuffix: string;
}

export interface ProtectProgress {
  type: 'progress';
  phase: 'reading' | 'rasterizing' | 'encrypting' | 'packaging';
  percent: number;
  message: string;
  currentFile?: number;
  totalFiles?: number;
}

export interface ProtectResult {
  type: 'result';
  protectedBytes: ArrayBuffer;
  fileName: string;
  pageCount: number;
  vectorPreserved: boolean;
  userPasswordSet: boolean;
  ownerPasswordSet: boolean;
  restrictions: string[];
}

export interface ProtectError {
  type: 'error';
  message: string;
  fileName: string;
}

export type WorkerMessage = ProtectProgress | ProtectResult | ProtectError;

// ============================================================
// UTILIDAD: Extraer ArrayBuffer exacto de un Uint8Array
// ============================================================

/**
 * pdf-lib internamente crea Uint8Arrays como vistas parciales de
 * ArrayBuffers más grandes. Si usamos .buffer.slice(0) directamente,
 * copiamos bytes basura al final del archivo PDF, causando que los
 * visores lo rechacen como "dañado".
 *
 * Esta función garantiza que extraemos exactamente los bytes del
 * Uint8Array en un ArrayBuffer limpio del tamaño correcto.
 */
function extractCleanBuffer(arr: Uint8Array): ArrayBuffer {
  // .slice() crea un NUEVO Uint8Array con su propio ArrayBuffer
  // del tamaño EXACTO de arr.length (sin importar byteOffset/byteLength)
  const copy: Uint8Array = arr.slice();
  return copy.buffer as ArrayBuffer;
}

// ============================================================
// RASTERIZER (via pdfjs-dist + pdf-lib)
// ============================================================

async function rasterizePdf(fileBuffer: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

  const srcDoc = await pdfjsLib
    .getDocument({ data: new Uint8Array(fileBuffer) })
    .promise;
  const rp = await PDFDocument.create();

  for (let pn = 1; pn <= srcDoc.numPages; pn++) {
    const pg = await srcDoc.getPage(pn);
    const vp = pg.getViewport({ scale: 2.0 });
    const cv = new OffscreenCanvas(vp.width, vp.height);
    const cx = cv.getContext('2d');
    if (cx) {
      await pg.render({ canvasContext: cx, viewport: vp } as any).promise;
      const blob = await cv.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
      const img = await rp.embedJpg(await blob.arrayBuffer());
      const ov = pg.getViewport({ scale: 1.0 });
      const np = rp.addPage([ov.width, ov.height]);
      np.drawImage(img, { x: 0, y: 0, width: ov.width, height: ov.height });
    }
  }
  return new Uint8Array(await rp.save({ useObjectStreams: false }));
}

// ============================================================
// PROTECCIÓN DE UN ARCHIVO
// ============================================================

async function protectSinglePdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: ProtectOptions,
  report: (msg: WorkerMessage) => void,
): Promise<ProtectResult> {
  let pdfBytes: Uint8Array;
  let vectorPreserved = true;

  const restrictions: string[] = [];
  if (!options.allowPrinting) restrictions.push('Impresión bloqueada');
  else if (!options.allowHighQualityPrint) restrictions.push('Solo impresión baja calidad');
  if (!options.allowCopying) restrictions.push('Copia bloqueada');
  if (!options.allowModifying) restrictions.push('Modificación bloqueada');
  if (!options.allowFillingForms) restrictions.push('Formularios bloqueados');
  if (!options.allowAssembly) restrictions.push('Ensamblaje bloqueado');
  if (!options.allowAnnotating) restrictions.push('Anotaciones bloqueadas');
  if (!options.allowExtraction) restrictions.push('Extracción bloqueada');

  report({ type: 'progress', phase: 'reading', percent: 5, message: 'Leyendo archivo PDF...' });

  if (options.enableRasterize) {
    report({
      type: 'progress', phase: 'rasterizing', percent: 15,
      message: 'Rasterizando páginas a capa única de alta seguridad...',
    });
    pdfBytes = await rasterizePdf(fileBuffer);
    vectorPreserved = false;
  } else {
    // Crear copia limpia del buffer original
    pdfBytes = new Uint8Array(fileBuffer);
    vectorPreserved = true;
  }

  report({
    type: 'progress', phase: 'encrypting', percent: 40,
    message: 'Aplicando cifrado AES-256 (PDF 2.0 / ISO 32000-2)...',
  });

  const userPwd = options.userPassword || '';
  const ownerPwd =
    options.ownerPassword ||
    (options.userPassword
      ? `${options.userPassword}_owner_master_2026`
      : 'PDFBLOCK_PROTECTED_MASTER_KEY_2026');

  // Cifrar con @pdfsmaller/pdf-encrypt (motor probado en producción)
  const rawOutput: Uint8Array = await encryptPDF(pdfBytes, userPwd, {
    ownerPassword: ownerPwd,
    algorithm: 'AES-256',
    allowPrinting: options.allowPrinting,
    allowHighQualityPrint: options.allowHighQualityPrint,
    allowModifying: options.allowModifying,
    allowCopying: options.allowCopying,
    allowExtraction: options.allowExtraction,
    allowAnnotating: options.allowAnnotating,
    allowFillingForms: options.allowFillingForms,
    allowAssembly: options.allowAssembly,
  });

  report({ type: 'progress', phase: 'packaging', percent: 100, message: 'Cifrado completado.' });

  // EXTRAER BUFFER LIMPIO: encryptPDF retorna un Uint8Array que puede ser
  // una vista parcial de un ArrayBuffer mayor (pdf-lib crea buffers así).
  // extractCleanBuffer usa .slice() que crea un nuevo Uint8Array con un
  // ArrayBuffer propio del tamaño exacto, eliminando bytes basura.
  return {
    type: 'result',
    protectedBytes: extractCleanBuffer(rawOutput),
    fileName,
    pageCount: 0,
    vectorPreserved,
    userPasswordSet: !!options.userPassword,
    ownerPasswordSet: !!options.ownerPassword,
    restrictions,
  };
}

// ============================================================
// WORKER LOOP
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const { fileBuffers, fileNames, options } = event.data as {
    fileBuffers: ArrayBuffer[];
    fileNames: string[];
    options: ProtectOptions;
  };

  const total = fileBuffers.length;

  for (let i = 0; i < total; i++) {
    try {
      self.postMessage({
        type: 'progress', phase: 'reading', percent: 0,
        message: `Archivo ${i + 1}/${total}: ${fileNames[i]}`,
        currentFile: i + 1, totalFiles: total,
      } as ProtectProgress);

      const result = await protectSinglePdf(fileBuffers[i], fileNames[i], options, (msg) => {
        self.postMessage({ ...msg, currentFile: i + 1, totalFiles: total });
      });

      self.postMessage({ ...result, currentFile: i + 1, totalFiles: total });
      await new Promise((r) => setTimeout(r, 10));
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: `Error en ${fileNames[i]}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        fileName: fileNames[i],
      } as ProtectError);
    }
  }

  self.postMessage({
    type: 'progress', phase: 'packaging', percent: 100,
    message: 'Completado.', currentFile: total, totalFiles: total,
  } as ProtectProgress);
};

export {};