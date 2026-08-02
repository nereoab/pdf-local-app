/**
 * Security & Compliance Module - PDFBlack Enterprise v3.0
 * 
 * Funcionalidades de seguridad corporativa:
 *  - Cálculo de hashes SHA-256 para cadena de custodia
 *  - Registro de auditoría (audit log) persistente en localStorage
 *  - Generación de certificado de redacción (Certificate of Redaction)
 *  - Verificación de integridad de archivos
 *  - Exportación de logs para compliance (GDPR, HIPAA, SOC2)
 */

// ============================================================
// TIPOS
// ============================================================

export interface CustodyRecord {
  /** ID único de la sesión */
  sessionId: string;
  /** Timestamp ISO 8601 */
  timestamp: string;
  /** Nombre del archivo original */
  originalFileName: string;
  /** Hash SHA-256 del archivo original */
  originalHash: string;
  /** Hash SHA-256 del archivo censurado */
  redactedHash: string;
  /** Tamaño del archivo original en bytes */
  originalSize: number;
  /** Tamaño del archivo censurado en bytes */
  redactedSize: number;
  /** Número total de redactions aplicadas */
  totalRedactions: number;
  /** Páginas con redactions */
  pagesWithRedactions: number;
  /** Modo de redacción usado */
  mode: 'precision' | 'raster';
  /** Páginas en modo precisión */
  precisionPages: number;
  /** Páginas en modo raster */
  rasterPages: number;
  /** Versión del motor */
  engineVersion: string;
  /** Navegador/User Agent */
  userAgent: string;
  /** Patrones de detección usados */
  patternsUsed?: string[];
  /** Duración del proceso en ms */
  processingDurationMs?: number;
}

export interface CertificateOfRedaction {
  /** Versión del formato de certificado */
  certificateVersion: string;
  /** ID del certificado */
  certificateId: string;
  /** Timestamp de emisión */
  issuedAt: string;
  /** Registros de custodia */
  custodyChain: CustodyRecord[];
  /** Declaración de cumplimiento */
  complianceStatement: string;
  /** Firma del motor */
  engineSignature: string;
}

export interface AuditLogEntry {
  /** Timestamp */
  timestamp: string;
  /** Tipo de evento */
  eventType: 'document_loaded' | 'redaction_applied' | 'document_downloaded' | 'error' | 'pattern_detected';
  /** Detalles del evento */
  details: string;
  /** Metadatos adicionales */
  metadata?: Record<string, unknown>;
}

// ============================================================
// HASHING SHA-256
// ============================================================

/**
 * Calcula el hash SHA-256 de un ArrayBuffer.
 * Usa la API Web Crypto (disponible en navegadores modernos y workers).
 */
export async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calcula el hash SHA-256 de un string.
 */
export async function calculateStringSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// REGISTRO DE AUDITORÍA (Audit Log)
// ============================================================

const AUDIT_LOG_STORAGE_KEY = 'pdfblack_audit_log';
const CUSTODY_CHAIN_STORAGE_KEY = 'pdfblack_custody_chain';
const MAX_LOG_ENTRIES = 500;

/**
 * Agrega una entrada al registro de auditoría.
 */
export function addAuditLogEntry(entry: AuditLogEntry): void {
  try {
    const log = getAuditLog();
    log.push(entry);
    // Mantener solo las últimas MAX_LOG_ENTRIES
    const trimmedLog = log.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(trimmedLog));
  } catch {
    console.warn('No se pudo escribir en el registro de auditoría');
  }
}

/**
 * Obtiene todas las entradas del registro de auditoría.
 */
export function getAuditLog(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as AuditLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Exporta el registro de auditoría como archivo JSON descargable.
 */
export function downloadAuditLog(): void {
  const log = getAuditLog();
  const json = JSON.stringify(log, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Limpia el registro de auditoría.
 */
export function clearAuditLog(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ============================================================
// CADENA DE CUSTODIA
// ============================================================

/**
 * Agrega un registro a la cadena de custodia.
 */
export function addCustodyRecord(record: CustodyRecord): void {
  try {
    const chain = getCustodyChain();
    chain.push(record);
    localStorage.setItem(CUSTODY_CHAIN_STORAGE_KEY, JSON.stringify(chain.slice(-50)));
  } catch {
    console.warn('No se pudo escribir en la cadena de custodia');
  }
}

/**
 * Obtiene la cadena de custodia completa.
 */
export function getCustodyChain(): CustodyRecord[] {
  try {
    const stored = localStorage.getItem(CUSTODY_CHAIN_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CustodyRecord[];
  } catch {
    return [];
  }
}

// ============================================================
// CERTIFICADO DE REDACCIÓN
// ============================================================

/**
 * Genera un certificado de redacción completo con cadena de custodia.
 */
export function generateCertificateOfRedaction(
  custodyChain: CustodyRecord[]
): CertificateOfRedaction {
  const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return {
    certificateVersion: '1.0.0',
    certificateId,
    issuedAt: new Date().toISOString(),
    custodyChain,
    complianceStatement: `This document certifies that the redaction process was performed using PDFBlack TrueRedact Engine v3.0. All redactions are permanent and irreversible. The process was executed 100% locally in the user's browser. No data was transmitted to external servers. The redaction engine uses cryptographically secure methods to permanently remove sensitive information from PDF content streams. This certificate serves as a chain of custody record for compliance with GDPR, HIPAA, SOC2, and other data protection regulations.`,
    engineSignature: `PDFBlack-Enterprise-v3.0-${certificateId}`,
  };
}

/**
 * Descarga el certificado de redacción como JSON.
 */
export function downloadCertificate(certificate: CertificateOfRedaction): void {
  const json = JSON.stringify(certificate, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `redaction-certificate-${certificate.certificateId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// VERIFICACIÓN DE INTEGRIDAD
// ============================================================

/**
 * Verifica que dos hashes coincidan.
 */
export function verifyIntegrity(originalHash: string, computedHash: string): boolean {
  return originalHash === computedHash;
}

/**
 * Formatea un hash SHA-256 para visualización (grupos de 8 caracteres).
 */
export function formatHash(hash: string): string {
  if (hash.length < 16) return hash;
  return hash.match(/.{1,8}/g)?.join(' ') || hash;
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Genera un ID de sesión único.
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Obtiene el tamaño formateado en KB/MB.
 */
export function formatSizeForCertificate(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Obtiene el User Agent del navegador (solo disponible en worker principal).
 */
export function getUserAgent(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent || 'Unknown';
  }
  return 'Worker Thread';
}