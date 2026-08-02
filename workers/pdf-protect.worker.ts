/**
 * Web Worker para cifrado AES-256 de PDF de grado corporativo.
 *
 * Cumple estrictamente con la especificación ISO 32000-2:2020 (PDF 2.0 / AES-256 V=5 R=6).
 *
 * CORRECCIÓN ADOBE ACROBAT:
 * 1. Todos los strings cifrados en diccionarios se serializan como PDFHexString (<HEX>)
 *    para evitar secuencias de escape corruptas o paréntesis no escapados (...).
 * 2. Se actualiza automáticamente la propiedad /Length en los diccionarios de stream
 *    para reflejar el tamaño exacto con relleno PKCS#7 e IV de 16 bytes.
 * 3. Procesamiento 100% local en RAM vía Web Crypto API (SubtleCrypto).
 */

import {
  PDFDocument,
  PDFName,
  PDFHexString,
  PDFString,
  PDFDict,
  PDFArray,
  PDFRawStream,
  PDFNumber,
} from 'pdf-lib';

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
// UTILIDADES CRIPTOGRÁFICAS WEB CRYPTO (ISO 32000-2 / AES-256)
// ============================================================

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
}

function concatBuffers(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return new Uint8Array(hash);
}

async function sha384(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-384', data as BufferSource);
  return new Uint8Array(hash);
}

async function sha512(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-512', data as BufferSource);
  return new Uint8Array(hash);
}

async function aes128CbcEncryptNoPad(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv as BufferSource }, cryptoKey, data as BufferSource);
  return new Uint8Array(encrypted).slice(0, data.byteLength);
}

async function aes256CbcEncryptNoPad(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv as BufferSource }, cryptoKey, data as BufferSource);
  return new Uint8Array(encrypted).slice(0, data.byteLength);
}

async function aes256EcbEncryptBlock(block: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const zeroIV = new Uint8Array(16);
  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, 'AES-CBC', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: zeroIV as BufferSource }, cryptoKey, block as BufferSource);
  return new Uint8Array(encrypted).slice(0, 16);
}

async function importAES256Key(key: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', key as BufferSource, 'AES-CBC', false, ['encrypt']);
}

async function aes256CbcEncryptWithKey(data: Uint8Array, cryptoKey: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv as BufferSource }, cryptoKey, data as BufferSource);
  return new Uint8Array(encrypted);
}

/**
 * Algoritmo 2.B (ISO 32000-2:2020) — Derivación de Clave Hardened para R=6
 */
async function computeHash2B(password: Uint8Array, salt: Uint8Array, userKey: Uint8Array): Promise<Uint8Array> {
  const input = concatBuffers(password, salt, userKey);
  let K = await sha256(input);

  let i = 0;
  let E: Uint8Array;

  while (true) {
    const block = concatBuffers(password, K, userKey);
    const K1 = new Uint8Array(block.length * 64);
    for (let j = 0; j < 64; j++) {
      K1.set(block, j * block.length);
    }

    const aesKey = K.slice(0, 16);
    const aesIV = K.slice(16, 32);
    E = await aes128CbcEncryptNoPad(K1, aesKey, aesIV);

    let byteSum = 0;
    for (let j = 0; j < 16; j++) {
      byteSum += E[j];
    }
    const hashSelect = byteSum % 3;

    if (hashSelect === 0) {
      K = await sha256(E);
    } else if (hashSelect === 1) {
      K = await sha384(E);
    } else {
      K = await sha512(E);
    }

    i++;
    if (i >= 64 && E[E.length - 1] <= i - 32) {
      break;
    }
  }

  return K.slice(0, 32);
}

function buildPermissions(options: ProtectOptions): number {
  let P = 0xFFFFF000 | 0x000000C0;
  if (options.allowPrinting !== false) P |= 0x00000004;
  if (options.allowModifying !== false) P |= 0x00000008;
  if (options.allowCopying !== false) P |= 0x00000010;
  if (options.allowAnnotating !== false) P |= 0x00000020;
  if (options.allowFillingForms !== false) P |= 0x00000100;
  if (options.allowExtraction !== false) P |= 0x00000200;
  if (options.allowAssembly !== false) P |= 0x00000400;
  if (options.allowHighQualityPrint !== false) P |= 0x00000800;
  return P | 0;
}

function saslPrepPassword(password: string): Uint8Array {
  const bytes = new TextEncoder().encode(password);
  return bytes.length > 127 ? bytes.slice(0, 127) : bytes;
}

async function computeUandUE(password: Uint8Array, fileKey: Uint8Array) {
  const validationSalt = randomBytes(8);
  const keySalt = randomBytes(8);
  const hash = await computeHash2B(password, validationSalt, new Uint8Array(0));
  const U = new Uint8Array(48);
  U.set(hash, 0);
  U.set(validationSalt, 32);
  U.set(keySalt, 40);

  const ueKey = await computeHash2B(password, keySalt, new Uint8Array(0));
  const zeroIV = new Uint8Array(16);
  const UE = await aes256CbcEncryptNoPad(fileKey, ueKey, zeroIV);
  return { U, UE };
}

async function computeOandOE(password: Uint8Array, fileKey: Uint8Array, U: Uint8Array) {
  const validationSalt = randomBytes(8);
  const keySalt = randomBytes(8);
  const hash = await computeHash2B(password, validationSalt, U);
  const O = new Uint8Array(48);
  O.set(hash, 0);
  O.set(validationSalt, 32);
  O.set(keySalt, 40);

  const oeKey = await computeHash2B(password, keySalt, U);
  const zeroIV = new Uint8Array(16);
  const OE = await aes256CbcEncryptNoPad(fileKey, oeKey, zeroIV);
  return { O, OE };
}

async function computePerms(permissions: number, fileKey: Uint8Array, encryptMetadata: boolean): Promise<Uint8Array> {
  const block = new Uint8Array(16);
  block[0] = permissions & 0xFF;
  block[1] = (permissions >> 8) & 0xFF;
  block[2] = (permissions >> 16) & 0xFF;
  block[3] = (permissions >> 24) & 0xFF;
  block[4] = 0xFF; block[5] = 0xFF; block[6] = 0xFF; block[7] = 0xFF;
  block[8] = encryptMetadata ? 0x54 : 0x46;
  block[9] = 0x61; block[10] = 0x64; block[11] = 0x62;
  const rand = randomBytes(4);
  block[12] = rand[0]; block[13] = rand[1]; block[14] = rand[2]; block[15] = rand[3];
  return await aes256EcbEncryptBlock(block, fileKey);
}

async function encryptObjectAES256(data: Uint8Array, cryptoKey: CryptoKey): Promise<Uint8Array> {
  const iv = randomBytes(16);
  const encrypted = await aes256CbcEncryptWithKey(data, cryptoKey, iv);
  const result = new Uint8Array(16 + encrypted.length);
  result.set(iv, 0);
  result.set(encrypted, 16);
  return result;
}

/**
 * Cifrado seguro de strings en estructuras jerárquicas PDF.
 * Convierte TODO string a PDFHexString (<HEX>) para evitar cualquier problema de sintaxis o escape.
 */
async function encryptStringsSafely(obj: unknown, cryptoKey: CryptoKey): Promise<void> {
  if (!obj) return;

  if (obj instanceof PDFDict) {
    for (const key of obj.keys()) {
      const keyName = key.asString();
      if (keyName === '/Length' || keyName === '/Filter' || keyName === '/DecodeParms') continue;
      const val = obj.get(key);
      if (val instanceof PDFString || val instanceof PDFHexString) {
        const bytes = val.asBytes();
        const encrypted = await encryptObjectAES256(bytes, cryptoKey);
        obj.set(key, PDFHexString.of(bytesToHex(encrypted)));
      } else {
        await encryptStringsSafely(val, cryptoKey);
      }
    }
  } else if (obj instanceof PDFArray) {
    const array = obj.asArray();
    for (let i = 0; i < array.length; i++) {
      const val = array[i];
      if (val instanceof PDFString || val instanceof PDFHexString) {
        const bytes = val.asBytes();
        const encrypted = await encryptObjectAES256(bytes, cryptoKey);
        obj.set(i, PDFHexString.of(bytesToHex(encrypted)));
      } else {
        await encryptStringsSafely(val, cryptoKey);
      }
    }
  }
}

// ============================================================
// UTILIDAD: Extraer ArrayBuffer limpio de Uint8Array
// ============================================================

function extractCleanBuffer(arr: Uint8Array): ArrayBuffer {
  const copy: Uint8Array = arr.slice();
  return copy.buffer as ArrayBuffer;
}

// ============================================================
// RASTERIZER (via pdfjs-dist + pdf-lib)
// ============================================================

async function rasterizePdf(fileBuffer: ArrayBuffer): Promise<Uint8Array> {
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
// PROTECCIÓN DE UN ARCHIVO PDF (MOTOR AES-256 ISO 32000-2)
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
    pdfBytes = new Uint8Array(fileBuffer);
    vectorPreserved = true;
  }

  report({
    type: 'progress', phase: 'encrypting', percent: 40,
    message: 'Aplicando cifrado AES-256 compatible con Adobe Acrobat DC (ISO 32000-2)...',
  });

  const userPwd = options.userPassword || '';
  const ownerPwd =
    options.ownerPassword ||
    (options.userPassword
      ? `${options.userPassword}_owner_master_2026`
      : 'PDFBLOCK_PROTECTED_MASTER_KEY_2026');

  // Cargamos el documento PDF
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const pageCount = pdfDoc.getPageCount();
  const context = pdfDoc.context;
  const permissions = buildPermissions(options);

  const fileId = randomBytes(16);
  const fileKey = randomBytes(32);

  const userPwdBytes = saslPrepPassword(userPwd);
  const ownerPwdBytes = saslPrepPassword(ownerPwd);

  const { U, UE } = await computeUandUE(userPwdBytes, fileKey);
  const { O, OE } = await computeOandOE(ownerPwdBytes, fileKey, U);
  const Perms = await computePerms(permissions, fileKey, true);
  const cryptoKey = await importAES256Key(fileKey);

  const indirectObjects = context.enumerateIndirectObjects();

  for (const [ref, obj] of indirectObjects) {
    // Ignorar diccionario de cifrado si ya existiera
    if (obj instanceof PDFDict) {
      const filter = obj.get(PDFName.of('Filter'));
      if (filter && filter.toString() === '/Standard') continue;
    }

    // Ignorar streams XRef o Sig
    if (obj instanceof PDFRawStream && obj.dict) {
      const type = obj.dict.get(PDFName.of('Type'));
      if (type) {
        const typeName = type.toString();
        if (typeName === '/XRef' || typeName === '/Sig') continue;
      }
    }

    // Cifrado de streams
    if (obj instanceof PDFRawStream) {
      const streamData = obj.contents;
      const encrypted = await encryptObjectAES256(streamData, cryptoKey);
      (obj as unknown as { contents: Uint8Array }).contents = encrypted;

      // ACTUALIZAR /Length OBLIGATORIAMENTE EN EL DICCIONARIO DEL STREAM
      obj.dict.set(PDFName.of('Length'), PDFNumber.of(encrypted.length));

      if (obj.dict) {
        await encryptStringsSafely(obj.dict, cryptoKey);
      }
    }

    // Cifrado de strings en objetos sin stream
    if (!(obj instanceof PDFRawStream)) {
      await encryptStringsSafely(obj, cryptoKey);
    }
  }

  // Construir el diccionario /Encrypt para AES-256 (PDF 2.0 / V=5 R=6)
  const stdCF = context.obj({
    Type: PDFName.of('CryptFilter'),
    CFM: PDFName.of('AESV3'),
    Length: PDFNumber.of(32),
    AuthEvent: PDFName.of('DocOpen'),
  });

  const cfDict = context.obj({});
  cfDict.set(PDFName.of('StdCF'), stdCF);

  const encryptDict = context.obj({
    Filter: PDFName.of('Standard'),
    V: PDFNumber.of(5),
    R: PDFNumber.of(6),
    Length: PDFNumber.of(256),
    P: PDFNumber.of(permissions),
    O: PDFHexString.of(bytesToHex(O)),
    U: PDFHexString.of(bytesToHex(U)),
    OE: PDFHexString.of(bytesToHex(OE)),
    UE: PDFHexString.of(bytesToHex(UE)),
    Perms: PDFHexString.of(bytesToHex(Perms)),
    StmF: PDFName.of('StdCF'),
    StrF: PDFName.of('StdCF'),
    CF: cfDict,
    EncryptMetadata: context.obj(true),
  });

  const encryptRef = context.register(encryptDict);

  // Actualizar Trailer Info
  const trailer = context.trailerInfo;
  trailer.Encrypt = encryptRef;

  if (!trailer.ID) {
    const idHex1 = PDFHexString.of(bytesToHex(fileId));
    const idHex2 = PDFHexString.of(bytesToHex(fileId));
    trailer.ID = context.obj([idHex1, idHex2]);
  }

  const rawOutput = await pdfDoc.save({ useObjectStreams: false });

  report({ type: 'progress', phase: 'packaging', percent: 100, message: 'Cifrado completado.' });

  return {
    type: 'result',
    protectedBytes: extractCleanBuffer(rawOutput),
    fileName,
    pageCount,
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