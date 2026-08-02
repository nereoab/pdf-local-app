/**
 * Sensitive Patterns Registry - Biblioteca de Patrones de Detección Geográfica
 * 
 * Registro centralizado de patrones regex para datos sensibles con:
 *  - Cobertura geográfica multi-país
 *  - Metadatos: categoría, país, descripción, prioridad, severidad
 *  - Soporte para patrones personalizados del usuario
 * 
 * Los patrones se organizan en 3 niveles:
 *  Level 1 - CRÍTICO: Identificadores personales únicos (DNI, SSN, pasaporte)
 *  Level 2 - ALTO: Financieros (tarjetas, IBAN, cuentas bancarias)
 *  Level 3 - MEDIO: Contacto (email, teléfono, dirección)
 */

// ============================================================
// TIPOS
// ============================================================

export type PatternCategory = 'personal_id' | 'financial' | 'contact' | 'custom';
export type PatternSeverity = 'critical' | 'high' | 'medium';
export type PatternCountry = 
  | 'ES' | 'US' | 'GB' | 'DE' | 'FR' | 'IT' | 'PT' | 'BR' 
  | 'MX' | 'AR' | 'CO' | 'CL' | 'PE' | 'UY' | 'EC' | 'VE'
  | 'INTERNATIONAL';

export interface SensitivePattern {
  /** Identificador único */
  id: string;
  /** Nombre descriptivo (ES/EN) */
  nameEs: string;
  nameEn: string;
  /** Categoría de clasificación */
  category: PatternCategory;
  /** Nivel de severidad */
  severity: PatternSeverity;
  /** Países donde aplica este patrón */
  countries: PatternCountry[];
  /** Expresión regular (sin flags, se aplican gi) */
  regex: string;
  /** Descripción extendida */
  descriptionEs?: string;
  descriptionEn?: string;
  /** Ejemplo del dato a detectar */
  example?: string;
  /** Prioridad de ejecución (menor = primero) */
  priority: number;
  /** Si es false, no se ejecuta automáticamente */
  enabled: boolean;
  /** Ícono emoji para UI */
  icon: string;
  /** Color del badge en UI */
  badgeColor: string;
}

// ============================================================
// REGISTRO DE PATRONES PREDEFINIDOS
// ============================================================

export const PREDEFINED_PATTERNS: SensitivePattern[] = [
  // =======================================================================
  // LEVEL 1: IDENTIFICADORES PERSONALES (CRÍTICO)
  // =======================================================================
  
  // --- España ---
  {
    id: 'dni-es',
    nameEs: 'DNI (España)',
    nameEn: 'DNI (Spain)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['ES'],
    regex: '\\b[0-9]{8}[A-HJ-NP-TV-Z]\\b',
    descriptionEs: 'Documento Nacional de Identidad: 8 dígitos + 1 letra',
    descriptionEn: 'Spanish National ID: 8 digits + 1 letter',
    example: '12345678Z',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  {
    id: 'nie-es',
    nameEs: 'NIE (España)',
    nameEn: 'NIE (Spain)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['ES'],
    regex: '\\b[XYZ]\\d{7}[A-HJ-NP-TV-Z]\\b',
    descriptionEs: 'Número de Identidad de Extranjero',
    descriptionEn: 'Foreigner Identification Number',
    example: 'X1234567L',
    priority: 2,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Estados Unidos ---
  {
    id: 'ssn-us',
    nameEs: 'SSN (EE.UU.)',
    nameEn: 'SSN (USA)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['US'],
    regex: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
    descriptionEs: 'Número de Seguro Social',
    descriptionEn: 'Social Security Number',
    example: '123-45-6789',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Reino Unido ---
  {
    id: 'nino-uk',
    nameEs: 'NINO (Reino Unido)',
    nameEn: 'NINO (UK)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['GB'],
    regex: '\\b[A-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-D]\\b',
    descriptionEs: 'Número Nacional de Seguro (National Insurance Number)',
    descriptionEn: 'National Insurance Number',
    example: 'AB 12 34 56 C',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Alemania ---
  {
    id: 'steuerident-de',
    nameEs: 'Steuer-ID (Alemania)',
    nameEn: 'Tax ID (Germany)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['DE'],
    regex: '\\b\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}\\b',
    descriptionEs: 'Número de Identificación Fiscal',
    descriptionEn: 'Tax Identification Number',
    example: '12 345 678 901',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Brasil ---
  {
    id: 'cpf-br',
    nameEs: 'CPF (Brasil)',
    nameEn: 'CPF (Brazil)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['BR'],
    regex: '\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b',
    descriptionEs: 'Cadastro de Pessoas Físicas',
    descriptionEn: 'Individual Taxpayer Registry',
    example: '123.456.789-00',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Argentina ---
  {
    id: 'dni-ar',
    nameEs: 'DNI (Argentina)',
    nameEn: 'DNI (Argentina)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['AR'],
    regex: '\\b\\d{2}\\.?\\d{3}\\.?\\d{3}\\b',
    descriptionEs: 'Documento Nacional de Identidad',
    descriptionEn: 'National Identity Document',
    example: '12.345.678',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- México ---
  {
    id: 'curp-mx',
    nameEs: 'CURP (México)',
    nameEn: 'CURP (Mexico)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['MX'],
    regex: '\\b[A-Z][AEIOU][A-Z]{2}\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])[HM][A-Z]{5}[A-Z0-9]\\d\\b',
    descriptionEs: 'Clave Única de Registro de Población',
    descriptionEn: 'Unique Population Registry Code',
    example: 'ABCD920101HDFXXX00',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Colombia ---
  {
    id: 'cc-co',
    nameEs: 'Cédula (Colombia)',
    nameEn: 'Citizenship ID (Colombia)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['CO'],
    regex: '\\b\\d{6,10}\\b',
    descriptionEs: 'Número de Cédula de Ciudadanía (con contexto de etiqueta)',
    descriptionEn: 'Citizenship ID Number (label context aware)',
    example: '1234567890',
    priority: 3,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Chile ---
  {
    id: 'rut-cl',
    nameEs: 'RUT (Chile)',
    nameEn: 'RUT (Chile)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['CL'],
    regex: '\\b\\d{1,2}\\.?\\d{3}\\.?\\d{3}-[0-9Kk]\\b',
    descriptionEs: 'Rol Único Tributario',
    descriptionEn: 'Unique Tax Roll Number',
    example: '12.345.678-9',
    priority: 1,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },
  
  // --- Perú ---
  {
    id: 'dni-pe',
    nameEs: 'DNI (Perú)',
    nameEn: 'DNI (Peru)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['PE'],
    regex: '\\b\\d{8}\\b',
    descriptionEs: 'Documento Nacional de Identidad: 8 dígitos',
    descriptionEn: 'National ID: 8 digits',
    example: '12345678',
    priority: 2,
    enabled: true,
    icon: '🪪',
    badgeColor: '#ef4444',
  },

  // --- Pasaporte (Internacional) ---
  {
    id: 'passport-icao',
    nameEs: 'Pasaporte (Formato ICAO)',
    nameEn: 'Passport (ICAO Format)',
    category: 'personal_id',
    severity: 'critical',
    countries: ['INTERNATIONAL'],
    regex: '\\b[A-Z]{1,2}\\d{6,9}\\b',
    descriptionEs: 'Número de pasaporte (formato ICAO 9303): 1-2 letras + 6-9 dígitos',
    descriptionEn: 'Passport number (ICAO 9303 format): 1-2 letters + 6-9 digits',
    example: 'AB1234567',
    priority: 4,
    enabled: false,
    icon: '🛂',
    badgeColor: '#ef4444',
  },

  // =======================================================================
  // LEVEL 2: FINANCIEROS (ALTO)
  // =======================================================================
  
  // --- Tarjeta de Crédito (Internacional) ---
  {
    id: 'credit-card',
    nameEs: 'Tarjeta de Crédito',
    nameEn: 'Credit Card',
    category: 'financial',
    severity: 'high',
    countries: ['INTERNATIONAL'],
    regex: '\\b(?:\\d[ -]*?){12,18}\\d\\b',
    descriptionEs: 'Números de tarjeta de crédito/débito (12-19 dígitos)',
    descriptionEn: 'Credit/debit card numbers (12-19 digits)',
    example: '4111 1111 1111 1111',
    priority: 10,
    enabled: true,
    icon: '💳',
    badgeColor: '#f59e0b',
  },
  
  // --- IBAN (Internacional) ---
  {
    id: 'iban',
    nameEs: 'IBAN (Cuenta Bancaria)',
    nameEn: 'IBAN (Bank Account)',
    category: 'financial',
    severity: 'high',
    countries: ['INTERNATIONAL'],
    regex: '\\b[A-Z]{2}\\d{2}\\s?[A-Z0-9]{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?[A-Z0-9]{0,4}\\b',
    descriptionEs: 'Número de Cuenta Bancaria Internacional',
    descriptionEn: 'International Bank Account Number',
    example: 'ES91 2100 0418 4502 0005 1332',
    priority: 11,
    enabled: true,
    icon: '🏦',
    badgeColor: '#f59e0b',
  },
  
  // --- IBAN España ---
  {
    id: 'iban-es',
    nameEs: 'IBAN (España)',
    nameEn: 'IBAN (Spain)',
    category: 'financial',
    severity: 'high',
    countries: ['ES'],
    regex: '\\bES\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}\\s?\\d{10}\\b',
    descriptionEs: 'IBAN español: ES + 22 dígitos',
    descriptionEn: 'Spanish IBAN: ES + 22 digits',
    example: 'ES91 2100 0418 4502 0005 1332',
    priority: 12,
    enabled: true,
    icon: '🏦',
    badgeColor: '#f59e0b',
  },

  // =======================================================================
  // LEVEL 3: CONTACTO (MEDIO)
  // =======================================================================
  
  // --- Email (Internacional) ---
  {
    id: 'email',
    nameEs: 'Correo Electrónico',
    nameEn: 'Email Address',
    category: 'contact',
    severity: 'medium',
    countries: ['INTERNATIONAL'],
    regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    descriptionEs: 'Dirección de correo electrónico',
    descriptionEn: 'Email address',
    example: 'usuario@ejemplo.com',
    priority: 20,
    enabled: true,
    icon: '✉️',
    badgeColor: '#10b981',
  },
  
  // --- Teléfono (Internacional) ---
  {
    id: 'phone',
    nameEs: 'Número de Teléfono',
    nameEn: 'Phone Number',
    category: 'contact',
    severity: 'medium',
    countries: ['INTERNATIONAL'],
    regex: '(?:\\+?\\d{1,4}[\\s.-]?)?(?:\\(?\\d{2,4}\\)?[\\s.-]?)?\\d{3,4}[\\s.-]?\\d{3,4}[\\s.-]?\\d{0,4}',
    descriptionEs: 'Números de teléfono nacionales e internacionales',
    descriptionEn: 'National and international phone numbers',
    example: '+34 612 345 678',
    priority: 21,
    enabled: true,
    icon: '📱',
    badgeColor: '#06b6d4',
  },

  // --- Dirección (Contexto heurístico) ---
  {
    id: 'address-generic',
    nameEs: 'Dirección Postal (Contexto)',
    nameEn: 'Postal Address (Context)',
    category: 'contact',
    severity: 'medium',
    countries: ['INTERNATIONAL'],
    regex: '\\b(?:Calle|Avenida|Av\\.|Plaza|Paseo|Carrer|Rua|Street|Road|Avenue|Rd\\.|St\\.)\\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\\s*,?\\s*(?:N°?\\s*)?\\d{1,5}',
    descriptionEs: 'Direcciones postales por contexto (Calle, Avenida, etc.)',
    descriptionEn: 'Postal addresses detected by context keywords',
    example: 'Calle Mayor 123, Madrid',
    priority: 30,
    enabled: false,
    icon: '📍',
    badgeColor: '#6366f1',
  },
];

// ============================================================
// FUNCIONES DE CONSULTA
// ============================================================

/**
 * Obtiene todos los patrones habilitados para una lista de países.
 * Si se pasa "todos", retorna todos los patrones habilitados.
 */
export function getPatternsForCountries(
  countries: PatternCountry[],
  includeInternational: boolean = true
): SensitivePattern[] {
  return PREDEFINED_PATTERNS.filter(p => {
    if (!p.enabled) return false;
    if (includeInternational && p.countries.includes('INTERNATIONAL')) return true;
    return p.countries.some(c => countries.includes(c));
  });
}

/**
 * Obtiene patrones por categoría.
 */
export function getPatternsByCategory(category: PatternCategory): SensitivePattern[] {
  return PREDEFINED_PATTERNS.filter(p => p.category === category && p.enabled);
}

/**
 * Obtiene patrones por nivel de severidad.
 */
export function getPatternsBySeverity(severity: PatternSeverity): SensitivePattern[] {
  return PREDEFINED_PATTERNS.filter(p => p.severity === severity && p.enabled);
}

/**
 * Obtiene todos los patrones habilitados.
 */
export function getEnabledPatterns(): SensitivePattern[] {
  return PREDEFINED_PATTERNS.filter(p => p.enabled);
}

/**
 * Busca un patrón por ID.
 */
export function getPatternById(id: string): SensitivePattern | undefined {
  return PREDEFINED_PATTERNS.find(p => p.id === id);
}

/**
 * Convierte un patrón a regex ejecutable con flags.
 */
export function patternToRegex(pattern: SensitivePattern): RegExp {
  return new RegExp(pattern.regex, 'gi');
}

// ============================================================
// PATRONES PERSONALIZADOS (Usuario)
// ============================================================

const CUSTOM_PATTERNS_STORAGE_KEY = 'pdfblack_custom_redaction_patterns';

/**
 * Carga patrones personalizados desde localStorage.
 */
export function loadCustomPatterns(): SensitivePattern[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PATTERNS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SensitivePattern[];
  } catch {
    return [];
  }
}

/**
 * Guarda patrones personalizados en localStorage.
 */
export function saveCustomPatterns(patterns: SensitivePattern[]): void {
  try {
    localStorage.setItem(CUSTOM_PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
  } catch {
    console.warn('No se pudieron guardar los patrones personalizados en localStorage');
  }
}

/**
 * Agrega un nuevo patrón personalizado.
 */
export function addCustomPattern(pattern: SensitivePattern): void {
  const current = loadCustomPatterns();
  current.push(pattern);
  saveCustomPatterns(current);
}

/**
 * Elimina un patrón personalizado por ID.
 */
export function removeCustomPattern(id: string): void {
  const current = loadCustomPatterns();
  saveCustomPatterns(current.filter(p => p.id !== id));
}

// ============================================================
// EXPORTACIÓN DE INFORME DE AUDITORÍA
// ============================================================

export interface AuditEntry {
  /** ID único del match */
  id: string;
  /** Categoría del dato detectado */
  category: PatternCategory;
  /** Severidad */
  severity: PatternSeverity;
  /** Texto detectado (parcialmente ofuscado para el informe) */
  detectedText: string;
  /** Página donde se encontró */
  page: number;
  /** Coordenadas en porcentaje */
  xPercent: number;
  yPercent: number;
  /** Acción tomada */
  action: 'redacted' | 'flagged' | 'ignored';
  /** Timestamp de detección */
  timestamp: string;
  /** Nombre del patrón que lo detectó */
  patternName: string;
}

export interface AuditReport {
  /** Versión del formato de informe */
  version: string;
  /** Timestamp de generación */
  generatedAt: string;
  /** Nombre del archivo original */
  fileName: string;
  /** Hash SHA-256 del archivo original (si está disponible) */
  originalHash?: string;
  /** Hash SHA-256 del archivo censurado */
  redactedHash?: string;
  /** Total de hallazgos */
  totalFindings: number;
  /** Hallazgos por categoría */
  findingsByCategory: Record<string, number>;
  /** Hallazgos por severidad */
  findingsBySeverity: Record<string, number>;
  /** Entradas individuales */
  entries: AuditEntry[];
  /** Estadísticas */
  stats: {
    totalRedacted: number;
    totalFlagged: number;
    pagesScanned: number;
    detectionEngine: string;
    patternsUsed: string[];
  };
}

/**
 * Genera un informe de auditoría en formato JSON.
 */
export function generateAuditReport(
  fileName: string,
  entries: AuditEntry[],
  originalHash?: string,
  redactedHash?: string
): AuditReport {
  const findingsByCategory: Record<string, number> = {};
  const findingsBySeverity: Record<string, number> = {};
  const patternsUsed = new Set<string>();

  for (const entry of entries) {
    findingsByCategory[entry.category] = (findingsByCategory[entry.category] || 0) + 1;
    findingsBySeverity[entry.severity] = (findingsBySeverity[entry.severity] || 0) + 1;
    patternsUsed.add(entry.patternName);
  }

  return {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    fileName,
    originalHash,
    redactedHash,
    totalFindings: entries.length,
    findingsByCategory,
    findingsBySeverity,
    entries,
    stats: {
      totalRedacted: entries.filter(e => e.action === 'redacted').length,
      totalFlagged: entries.filter(e => e.action === 'flagged').length,
      pagesScanned: new Set(entries.map(e => e.page)).size,
      detectionEngine: 'PDFBlack TrueRedact v3.0 Enterprise',
      patternsUsed: Array.from(patternsUsed).sort(),
    },
  };
}

/**
 * Exporta el informe como archivo JSON descargable.
 */
export function downloadAuditReport(report: AuditReport): void {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-report-${report.fileName.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}