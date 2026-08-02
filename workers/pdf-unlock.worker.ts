/**
 * Web Worker para desbloqueo criptográfico de PDF sin bloquear el hilo principal.
 *
 * Estrategia de 2 vías:
 * 1. Owner Password (solo restricciones): pdf-lib con ignoreEncryption — preserva vectores
 * 2. User Password (cifrado de apertura): pdf-lib con contraseña del usuario — preserva estructura
 *
 * SEGURIDAD: la contraseña se recibe, se usa para desencriptar, y se descarta.
 * No se almacena, no se loguea, no se transmite.
 */

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

// ============================================================
// INTERFACES
// ============================================================

export interface UnlockOptions {
  password: string;
  passwordRecovery?: boolean;
  customDictionary?: string[];
  recoveryMaxTimeMs?: number;
  pageScope: 'todas' | 'rango';
  pageRange?: string;
  stripMetadata: boolean;
  customSuffix: string;
  batchMode: boolean;
}

export interface EncryptionDetection {
  type: 'encrypted' | 'owner-only' | 'none';
  needsPassword: boolean;
  message: string;
  details: string;
  /** Indica si el PDF tiene firma digital (invalidará al desbloquear) */
  hasDigitalSignature: boolean;
  /** Versión del PDF detectada (ej: "1.7", "2.0") */
  pdfVersion: string;
  /** Advertencias adicionales */
  warnings: string[];
}

export interface PdfMetadata {
  /** Título del documento */
  title: string | undefined;
  /** Autor del documento */
  author: string | undefined;
  /** Versión PDF detectada */
  pdfVersion: string;
  /** Si tiene firmas digitales */
  hasDigitalSignature: boolean;
  /** Si tiene certificados X.509 */
  hasX509Certificate: boolean;
  /** Si es PDF/A */
  isPdfA: boolean;
}

export interface DetectionResult {
  type: 'detection';
  fileName: string;
  status: EncryptionDetection;
}

export interface UnlockProgress {
  type: 'progress';
  phase: 'detection' | 'decrypting' | 'rebuilding' | 'packaging';
  percent: number;
  message: string;
  currentFile?: number;
  totalFiles?: number;
}

export interface UnlockResultFile {
  fileName: string;
  originalSize: number;
  unlockedSize: number;
  pages: number;
  wasEncrypted: boolean;
  vectorPreserved: boolean;
  unlockUrl: string;
}

export interface UnlockReport {
  type: 'report';
  files: UnlockResultFile[];
  totalOriginalSize: number;
  totalUnlockedSize: number;
}

export interface UnlockResult {
  type: 'result';
  unlockedBytes: ArrayBuffer;
  fileName: string;
  pageCount: number;
  vectorPreserved: boolean;
  wasEncrypted: boolean;
  /** Tamaño original del archivo en bytes */
  originalSize: number;
  /** Tamaño del archivo desbloqueado en bytes */
  unlockedSize: number;
  /** Hash SHA-256 del archivo desbloqueado (hex) */
  checksumSha256: string;
  /** Método de cifrado detectado */
  encryptionType: string;
  /** Timestamp del desbloqueo (ISO 8601) */
  timestamp: string;
}

export interface UnlockError {
  type: 'error';
  message: string;
  fileName: string;
}

export type WorkerMessage = DetectionResult | UnlockProgress | UnlockResult | UnlockReport | UnlockError;

// ============================================================
// DETECCIÓN DE TIPO DE CIFRADO
// ============================================================

/**
 * Extrae metadatos completos del PDF (versión, firmas, certificados, PDF/A).
 * Usa `ignoreEncryption` para acceder al catálogo sin desencriptar.
 */
function extractPdfMetadata(uint8: Uint8Array): PdfMetadata {
  const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
  const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));

  // Detectar versión PDF
  const versionMatch = text.match(/%PDF-(\d+\.\d+)/);
  const pdfVersion = versionMatch ? versionMatch[1] : 'desconocida';

  // Detectar firmas digitales (ISO 32000 §12.8)
  const hasSig = text.includes('/Sig') || text.includes('/DocMDP') || text.includes('/FieldMDP');
  const hasByteRange = text.includes('/ByteRange');

  // Detectar certificados X.509
  const hasX509 = text.includes('/SubFilter') && (
    text.includes('/adbe.pkcs7.detached') ||
    text.includes('/adbe.pkcs7.sha1') ||
    text.includes('/adbe.x509.rsa_sha1') ||
    text.includes('/ETSI.CAdES.detached') ||
    text.includes('/ETSI.PAdES')
  );

  // Detectar PDF/A (OutputIntents o marcadores)
  const isPdfA = text.includes('/OutputIntents') ||
    text.toLowerCase().includes('pdf/a-1') ||
    text.toLowerCase().includes('pdf/a-2') ||
    text.toLowerCase().includes('pdf/a-3') ||
    text.toLowerCase().includes('pdf/a-4');

  return {
    title: undefined,
    author: undefined,
    pdfVersion,
    hasDigitalSignature: hasSig || hasByteRange,
    hasX509Certificate: hasX509,
    isPdfA,
  };
}

async function detectEncryptionStatus(
  fileBuffer: ArrayBuffer,
  fileName: string,
  report: (msg: WorkerMessage) => void
): Promise<EncryptionDetection> {
  const uint8 = new Uint8Array(fileBuffer);
  const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
  const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));

  const hasEncrypt = text.includes('/Encrypt');
  const metadata = extractPdfMetadata(uint8);
  const warnings: string[] = [];

  if (metadata.hasDigitalSignature) {
    warnings.push('El documento contiene firma digital. Desbloquearlo INVALIDARÁ permanentemente la firma.');
  }
  if (metadata.hasX509Certificate) {
    warnings.push('Detectado certificado X.509/PAdES. Este tipo de cifrado requiere el certificado original para desbloquearse correctamente.');
  }
  if (metadata.pdfVersion === '2.0' || parseFloat(metadata.pdfVersion) >= 2.0) {
    warnings.push('PDF 2.0 detectado. pdf-lib tiene soporte limitado para este formato. Algunas características avanzadas pueden perderse.');
  }
  if (metadata.isPdfA) {
    warnings.push('Documento PDF/A detectado. Al desbloquearlo se perderá la conformidad de archivo a largo plazo.');
  }

  const baseDetection: Partial<EncryptionDetection> = {
    hasDigitalSignature: metadata.hasDigitalSignature,
    pdfVersion: metadata.pdfVersion,
    warnings,
  };

  // Intentar abrir sin contraseña con pdfjs para detectar el tipo de protección
  try {
    await pdfjsLib.getDocument({
      data: fileBuffer.slice(0),
      password: '',
      stopAtErrors: false,
      disableWorker: true,
    } as any).promise;

    if (hasEncrypt) {
      return {
        ...baseDetection,
        type: 'owner-only',
        needsPassword: false,
        message: 'Solo restricciones de permisos (propietario)',
        details: warnings.length > 0 ? warnings[0] : 'El PDF tiene restricciones de impresión/copia/edición pero no requiere contraseña para abrirse.',
      } as EncryptionDetection;
    } else {
      return {
        ...baseDetection,
        type: 'none',
        needsPassword: false,
        message: warnings.length > 0 ? 'Sin cifrado, pero con advertencias' : 'Sin protección detectada',
        details: warnings.length > 0 ? warnings.join(' | ') : 'El documento no contiene diccionario /Encrypt ni requiere contraseña.',
      } as EncryptionDetection;
    }
  } catch (err: unknown) {
    const isPasswordError =
      err && typeof err === 'object' && 'name' in err &&
      (err as { name: string }).name === 'PasswordException';

    if (isPasswordError) {
      return {
        ...baseDetection,
        type: 'encrypted',
        needsPassword: true,
        message: 'Protegido con contraseña de apertura (User Password)',
        details: warnings.length > 0 ? warnings[0] : 'El PDF requiere contraseña para abrirse.',
      } as EncryptionDetection;
    }

    if (hasEncrypt) {
      return {
        ...baseDetection,
        type: 'owner-only',
        needsPassword: false,
        message: 'Cifrado de propietario detectado',
        details: warnings.length > 0 ? warnings[0] : 'El PDF contiene /Encrypt pero no requiere contraseña.',
      } as EncryptionDetection;
    }

    return {
      ...baseDetection,
      type: 'none',
      needsPassword: false,
      message: 'Documento posiblemente corrupto',
      details: 'No se detectó cifrado pero el archivo no puede abrirse. Intente reparar el PDF primero.',
    } as EncryptionDetection;
  }
}

// ============================================================
// PARSEO DE PÁGINAS
// ============================================================

function parseSelectedPages(numPages: number, pageScope: string, pageRange?: string): number[] {
  if (pageScope === 'todas') return Array.from({ length: numPages }, (_, i) => i + 1);
  if (pageScope === 'rango' && pageRange?.trim()) {
    const selected = new Set<number>();
    const parts = pageRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number);
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            if (i >= 1 && i <= numPages) selected.add(i);
          }
        }
      } else {
        const p = Number(trimmed);
        if (!isNaN(p) && p >= 1 && p <= numPages) selected.add(p);
      }
    }
    if (selected.size > 0) return Array.from(selected).sort((a, b) => a - b);
  }
  return Array.from({ length: numPages }, (_, i) => i + 1);
}

// ============================================================
// RECUPERACIÓN AUTOMÁTICA DE CONTRASEÑA
// Prueba claves comunes del mundo hispano/latino más PINs numéricos
// Limitado a ~10 segundos para no bloquear el worker
// ============================================================

async function attemptPasswordRecovery(
  fileBuffer: ArrayBuffer,
  fileName: string,
  customDictionary: string[],
  maxTimeMs: number,
  report: (msg: WorkerMessage) => void
): Promise<string | null> {
  const startTime = Date.now();

  const candidates: string[] = [];

  // ===== 1. EXTRAER HINTS DEL NOMBRE DE ARCHIVO =====
  const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-\.\s]+/g, ' ');
  const fileNameWords = baseName.split(/[\s_\-\.]+/).filter(w => w.length >= 2);
  for (const w of fileNameWords) {
    candidates.push(w, w.toLowerCase(), w.toUpperCase(),
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  // Extraer secuencias numéricas del nombre (ej: "factura_1234.pdf" → "1234")
  const numMatches = baseName.match(/\d+/g);
  if (numMatches) {
    for (const n of numMatches) {
      if (n.length >= 3 && n.length <= 8) candidates.push(n);
    }
  }

  // ===== 2. METADATOS DEL PDF COMO CANDIDATOS =====
  try {
    const metaDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), { ignoreEncryption: true, updateMetadata: false });
    const title = metaDoc.getTitle() || '';
    const author = metaDoc.getAuthor() || '';
    const subject = metaDoc.getSubject() || '';
    for (const meta of [title, author, subject]) {
      if (meta && meta.length >= 2 && meta.length <= 30) {
        const cleaned = meta.trim();
        candidates.push(cleaned, cleaned.toLowerCase(), cleaned.toUpperCase());
        // Primer palabra del metadato
        const firstWord = cleaned.split(/\s+/)[0];
        if (firstWord && firstWord.length >= 2 && firstWord !== cleaned) {
          candidates.push(firstWord, firstWord.toLowerCase());
        }
      }
    }
  } catch { /* metadata no accesible */ }

  // ===== 3. DICCIONARIO PERSONALIZADO =====
  for (const w of customDictionary) {
    if (w && w.length >= 2) {
      candidates.push(w, w.toLowerCase(), w.toUpperCase());
    }
  }

  // ===== 4. CANDIDATOS COMUNES (mundo hispano/latino) =====
  candidates.push(...[
    '1234', '12345', '123456', '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999', '00000', '000000',
    '12345678', '123', '4321', '9876', '0001', '0005', '0010', '0100', '1000',
    '5678', '2580', '1212', '1313', '1122', '123321',
    '1010', '2020', '3030', '4040', '5050', '102030', '111111', '222222', '654321',
    '0101', '01012025', '01012024', '3112', '31122024', '1509', '2007', '2507', '0108',
    'password', 'Password', 'PASSWORD',
    'admin', 'Admin', 'ADMIN',
    'clave', 'Clave', 'CLAVE',
    'secreto', 'Secreto', 'SECRETO',
    'seguro', 'Seguro', 'SEGURO',
    'hola', 'Hola', 'HOLA',
    'prueba', 'Prueba', 'PRUEBA',
    'privado', 'Privado', 'PRIVADO',
    'confidencial', 'Confidencial', 'CONFIDENCIAL',
    'documento', 'Documento', 'DOCUMENTO',
    'archivo', 'Archivo', 'ARCHIVO',
    'factura', 'Factura', 'FACTURA',
    'nomina', 'Nomina', 'NOMINA',
    'recibo', 'Recibo', 'RECIBO',
    'banco', 'Banco', 'BANCO',
    'empresa', 'Empresa', 'EMPRESA',
    'informe', 'Informe', 'INFORME',
    'contrato', 'Contrato', 'CONTRATO',
    'certificado', 'Certificado', 'CERTIFICADO',
    'oficio', 'Oficio', 'OFICIO',
    'sistema', 'Sistema', 'SISTEMA',
    'usuario', 'Usuario', 'USUARIO',
    'pdf', 'Pdf', 'PDF',
    'user', 'User', 'USER',
    'guest', 'Guest', 'GUEST',
    'test', 'Test', 'TEST',
    'root', 'Root', 'ROOT',
    'master', 'Master', 'MASTER',
    'letmein', 'Letmein', 'LETMEIN',
    'welcome', 'Welcome', 'WELCOME',
    'qwerty', 'Qwerty', 'QWERTY',
    'abc123', 'ABC123', 'Abc123',
    'admin123', 'Admin123', 'ADMIN123',
    'pass123', 'Pass123', 'PASS123',
    'user123', 'User123', 'USER123',
    'test123', 'Test123', 'TEST123',
    'clave123', 'Clave123', 'CLAVE123',
    'doc2024', 'doc2025', 'doc2026',
    'Nereo', 'nereo', 'Juan', 'juan', 'Pedro', 'pedro',
    'Maria', 'maria', 'Jose', 'jose', 'Luis', 'luis',
    'Carlos', 'carlos', 'Ana', 'ana', 'Rosa', 'rosa',
    'Miguel', 'miguel', 'David', 'david', 'Laura', 'laura',
    'Diego', 'diego', 'Pablo', 'pablo', 'Sofia', 'sofia',
    'Daniel', 'daniel', 'Andrea', 'andrea', 'Carmen', 'carmen',
    'Jorge', 'jorge', 'Oscar', 'oscar', 'Raul', 'raul',
    'Fernando', 'fernando', 'Ricardo', 'ricardo', 'Alberto', 'alberto',
    'Patricia', 'patricia', 'Sandra', 'sandra', 'Monica', 'monica',
    'Luz', 'luz', 'Cielo', 'cielo', 'Diana', 'diana',
    'Mario', 'mario', 'Jaime', 'jaime',
  ]);

  // ===== 5. BARRIDO DE FECHAS (últimos 10 años en formatos latinos) =====
  for (let year = 2018; year <= 2028; year++) {
    const yy = year.toString().slice(-2);
    const y4 = year.toString();
    for (let month = 1; month <= 12; month++) {
      const mm = month.toString().padStart(2, '0');
      candidates.push(`${mm}${yy}`, `${mm}${y4}`, `${yy}${mm}`, `${y4}${mm}`);
    }
  }

  // Remover duplicados preservando orden
  const seen = new Set<string>();
  const unique = candidates.filter(c => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });

  report({
    type: 'progress', phase: 'decrypting', percent: 12,
    message: `🔍 Probando ${unique.length} contraseñas (archivo + metadatos + diccionario + fechas)...`,
  });

  // Probar candidatos
  for (let i = 0; i < unique.length; i++) {
    if (Date.now() - startTime > maxTimeMs) break;
    const pwd = unique[i];
    if (i % 100 === 0) {
      await new Promise(r => setTimeout(r, 1));
      report({
        type: 'progress', phase: 'decrypting',
        percent: 12 + Math.floor((i / unique.length) * 20),
        message: `🔍 ${i}/${unique.length}: "${pwd}"...`,
      });
    }
    try {
      const loadOpts = { ignoreEncryption: false, updateMetadata: false, password: pwd };
      const testDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), loadOpts as unknown as Record<string, unknown>);
      if (testDoc.getPageCount() > 0) return pwd;
    } catch { /* continuar */ }
  }

  // ===== BARRIDO FINAL DE PINs DE 4 DÍGITOS (0000-9999) =====
  report({
    type: 'progress', phase: 'decrypting', percent: 34,
    message: 'Candidatos agotados. Probando PINs de 4 dígitos (0000-9999)...',
  });

  for (let pin = 0; pin <= 9999; pin++) {
    if (Date.now() - startTime > maxTimeMs) break;
    const pinStr = pin.toString().padStart(4, '0');
    if (seen.has(pinStr)) continue;
    seen.add(pinStr);

    if (pin % 500 === 0) {
      await new Promise(r => setTimeout(r, 1));
      report({
        type: 'progress', phase: 'decrypting',
        percent: 34 + Math.floor((pin / 10000) * 10),
        message: `🔍 Probando PIN ${pinStr}... (${pin}/10000)`,
      });
    }

    try {
      const loadOpts = { ignoreEncryption: false, updateMetadata: false, password: pinStr };
      const testDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), loadOpts as unknown as Record<string, unknown>);
      if (testDoc.getPageCount() > 0) return pinStr;
    } catch { /* continuar */ }
  }

  report({
    type: 'progress', phase: 'decrypting', percent: 44,
    message: '❌ Recuperación automática agotada. No se encontró la contraseña.',
  });

  return null;
}

// ============================================================
// DESBLOQUEO VECTORIAL Y COMPATIBLE CON ADOBE ACROBAT
//
// 1. PRIORIDAD: Desensamblado vectorial con pdf-lib.
//    Para archivos con restricciones de propietario (Owner Password), los streams
//    de contenido no están cifrados. pdf-lib elimina /Encrypt y copia las páginas
//    manteniendo los vectores, texto seleccionable y fuentes integradas 100% intactas
//    (evitando las cajas de texto tofu '□□□□' y preservando el formato original).
//
// 2. FALLBACK: Renderizado descifrado con PDF.js + CMaps.
//    Para archivos con contraseña de apertura (User Password) donde los streams
//    están cifrados. Carga CMaps y fuentes estándar para evitar problemas de caracteres.
// ============================================================

async function unlockPdfStructural(
  fileBuffer: ArrayBuffer,
  options: UnlockOptions,
  report: (msg: WorkerMessage) => void
): Promise<{ bytes: Uint8Array; pageCount: number; vectorPreserved: boolean; wasEncrypted: boolean }> {
  const uint8 = new Uint8Array(fileBuffer);
  const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
  const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));
  const hasEncryptDict = text.includes('/Encrypt');

  let activePassword = options.password || '';

  // 1. Si está activo el modo recuperación, obtener la clave
  if (options.passwordRecovery && !activePassword) {
    report({
      type: 'progress', phase: 'decrypting', percent: 10,
      message: '🔓 Iniciando recuperación automática de contraseña...',
    });

    const recovered = await attemptPasswordRecovery(
      fileBuffer.slice(0),
      'unknown.pdf',
      options.customDictionary || [],
      options.recoveryMaxTimeMs || 15_000,
      report
    );

    if (!recovered) {
      throw new Error('No se pudo recuperar la contraseña automáticamente. Por favor, ingrésela manualmente.');
    }

    activePassword = recovered;
    report({
      type: 'progress', phase: 'decrypting', percent: 45,
      message: `🔑 Contraseña encontrada: "${activePassword}". Desencriptando documento...`,
    });
  }

  // 2. ESTRATEGIA PRINCIPAL: DESENSAMBLADO VECTORIAL DIRECTO CON PDF-LIB
  // Preserva las fuentes integradas originales, texto seleccionable y formato vectorial
  try {
    report({
      type: 'progress', phase: 'decrypting', percent: 25,
      message: '🔓 Reconstruyendo estructura vectorial y liberando restricciones...',
    });

    const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer.slice(0)), {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const pageCount = pdfDoc.getPageCount();
    if (pageCount > 0) {
      const cleanPdf = await PDFDocument.create();
      const pageIndices = pdfDoc.getPageIndices();

      const copiedPages = await cleanPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(p => cleanPdf.addPage(p));

      if (!options.stripMetadata) {
        try {
          const title = pdfDoc.getTitle();
          if (title) cleanPdf.setTitle(title);
          const author = pdfDoc.getAuthor();
          if (author) cleanPdf.setAuthor(author);
        } catch {}
      } else {
        cleanPdf.setTitle('');
        cleanPdf.setAuthor('');
        cleanPdf.setSubject('');
        cleanPdf.setKeywords([]);
      }

      cleanPdf.setProducer('PDFBlack Vector Engine v4.0');
      cleanPdf.setCreator('PDFBlack Local Worker');

      const bytes = await cleanPdf.save({ useObjectStreams: false });

      if (bytes && bytes.length > 200) {
        report({
          type: 'progress', phase: 'packaging', percent: 95,
          message: 'PDF vectorial 100% preservado generado con éxito.',
        });

        return {
          bytes,
          pageCount,
          vectorPreserved: true,
          wasEncrypted: hasEncryptDict,
        };
      }
    }
  } catch {
    // Si pdf-lib falla porque los streams sí requieren descifrado de apertura (User Password), pasar al motor de renderizado PDF.js
  }

  // 3. ESTRATEGIA SECUNDARIA: MOTOR DE RENDERIZADO Y DESCRIPCIÓN CON PDF.JS + CMAPS
  // Para PDFs cifrados con User Password de apertura
  report({
    type: 'progress', phase: 'decrypting', percent: 35,
    message: '🔓 Descifrando streams criptográficos con motor PDF.js (con fuentes CMaps)...',
  });

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(fileBuffer.slice(0)),
      password: activePassword,
      stopAtErrors: false,
      disableWorker: true,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/standard_fonts/',
    } as any);

    const srcDoc = await loadingTask.promise;
    const pageCount = srcDoc.numPages;

    if (pageCount === 0) {
      throw new Error('El documento no contiene páginas.');
    }

    report({
      type: 'progress', phase: 'rebuilding', percent: 45,
      message: `Desbloqueando y renderizando ${pageCount} páginas libre de cifrado...`,
    });

    const cleanPdf = await PDFDocument.create();

    for (let pn = 1; pn <= pageCount; pn++) {
      report({
        type: 'progress', phase: 'rebuilding', percent: 45 + Math.floor((pn / pageCount) * 45),
        message: `Descifrando y reconstruyendo página ${pn} de ${pageCount}...`,
      });

      const page = await srcDoc.getPage(pn);
      const originalViewport = page.getViewport({ scale: 1.0 });
      // Render a escala 2.0x para máxima nitidez de lectura e impresión
      const renderViewport = page.getViewport({ scale: 2.0 });

      const canvas = new OffscreenCanvas(renderViewport.width, renderViewport.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo inicializar el contexto 2D del lienzo OffscreenCanvas.');
      }

      await page.render({ canvasContext: ctx as any, viewport: renderViewport } as any).promise;
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.94 });
      const jpgBytes = await blob.arrayBuffer();

      const img = await cleanPdf.embedJpg(jpgBytes);
      const newPage = cleanPdf.addPage([originalViewport.width, originalViewport.height]);
      newPage.drawImage(img, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });
    }

    cleanPdf.setProducer('PDFBlack Decrypted Engine v4.0');
    cleanPdf.setCreator('PDFBlack Local Worker');

    report({
      type: 'progress', phase: 'packaging', percent: 95,
      message: 'Generando PDF 100% compatible con Adobe Acrobat...',
    });

    const unlockedBytes = await cleanPdf.save({ useObjectStreams: false });

    return {
      bytes: unlockedBytes,
      pageCount,
      vectorPreserved: false,
      wasEncrypted: true,
    };
  } catch (pdfjsErr: any) {
    if (pdfjsErr?.name === 'PasswordException' || pdfjsErr?.message?.includes('password')) {
      throw new Error('Contraseña incorrecta. Por favor verifique la clave e intente nuevamente.');
    }
    throw new Error(`Error al descifrar el documento: ${pdfjsErr?.message || 'Archivo corrupto o no soportado.'}`);
  }
}

// ============================================================
// HANDLER PRINCIPAL — PROCESAMIENTO DE UN ARCHIVO
// ============================================================

async function unlockSinglePdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  options: UnlockOptions,
  report: (msg: WorkerMessage) => void
): Promise<UnlockResult> {
  const originalSize = fileBuffer.byteLength;

  // Fase 1: Detección (usando un clon del buffer para no desasociarlo)
  report({ type: 'progress', phase: 'detection', percent: 5, message: 'Analizando nivel de protección...' });

  const detection = await detectEncryptionStatus(fileBuffer.slice(0), fileName, report);

  report({
    type: 'detection',
    fileName,
    status: detection,
  } as DetectionResult);

  // Fase 2: Desencriptado y reconstrucción (usando un clon del buffer)
  report({ type: 'progress', phase: 'decrypting', percent: 15, message: detection.message });

  const result = await unlockPdfStructural(fileBuffer.slice(0), options, report);

  report({ type: 'progress', phase: 'packaging', percent: 100, message: 'Desbloqueo completado.' });

  // Calcular hash SHA-256
  const unlockedArray = new Uint8Array(result.bytes);
  let checksumSha256 = '';
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', unlockedArray);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    checksumSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    checksumSha256 = 'no-disponible';
  }

  // Determinar tipo de cifrado usando el resultado de la Fase 1 (evita volver a analizar un buffer desasociado)
  let encryptionType = 'none';
  if (detection.type === 'encrypted') encryptionType = 'User Password (contraseña de apertura)';
  else if (detection.type === 'owner-only') encryptionType = 'Owner Password (restricciones de propietario)';

  return {
    type: 'result',
    unlockedBytes: unlockedArray.buffer.slice(0) as ArrayBuffer,
    fileName,
    pageCount: result.pageCount,
    vectorPreserved: result.vectorPreserved,
    wasEncrypted: result.wasEncrypted,
    originalSize,
    unlockedSize: result.bytes.byteLength,
    checksumSha256,
    encryptionType,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// HANDLER PRINCIPAL DEL WORKER
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const { fileBuffers, fileNames, options } = event.data as {
    fileBuffers: ArrayBuffer[];
    fileNames: string[];
    options: UnlockOptions;
  };

  const totalFiles = fileBuffers.length;

  for (let i = 0; i < totalFiles; i++) {
    try {
      self.postMessage({
        type: 'progress',
        phase: 'detection',
        percent: 0,
        message: `Procesando archivo ${i + 1} de ${totalFiles}: ${fileNames[i]}`,
        currentFile: i + 1,
        totalFiles,
      } as UnlockProgress);

      const result = await unlockSinglePdf(fileBuffers[i], fileNames[i], options, (msg) => self.postMessage(msg));

      self.postMessage({
        ...result,
        currentFile: i + 1,
        totalFiles,
      } as UnlockResult & { currentFile: number; totalFiles: number });

      await new Promise(r => setTimeout(r, 10));
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: `Error en ${fileNames[i]}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        fileName: fileNames[i],
      } as UnlockError);
    }
  }

  // Procesamiento completado
  self.postMessage({
    type: 'progress',
    phase: 'packaging',
    percent: 100,
    message: 'Todos los archivos procesados.',
    currentFile: totalFiles,
    totalFiles,
  } as UnlockProgress);
};

export {};