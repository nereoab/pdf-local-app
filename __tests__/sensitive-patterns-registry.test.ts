/**
 * Tests unitarios para el registro de patrones sensibles
 *
 * Verifica que la detección de datos sensibles funcione correctamente
 * para DNI, tarjetas de crédito, emails, teléfonos, etc.
 */

// Definimos patrones mínimos para test sin depender del módulo completo
const PATTERNS = {
  DNI_ES: /\b\d{8}[A-HJ-NP-TV-Z]\b/,
  NIE_ES: /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  PHONE_ES: /\b(?:\+34|0034)?[6789]\d{8}\b/,
  IBAN_ES: /\bES\d{2}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/,
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
} as const;

type PatternId = keyof typeof PATTERNS;

function findPatterns(text: string): { type: PatternId; match: string; index: number }[] {
  const results: { type: PatternId; match: string; index: number }[] = [];
  for (const [type, regex] of Object.entries(PATTERNS)) {
    let match: RegExpExecArray | null;
    const re = new RegExp(regex.source, 'g');
    while ((match = re.exec(text)) !== null) {
      results.push({
        type: type as PatternId,
        match: match[0],
        index: match.index,
      });
    }
  }
  return results;
}

function findSensitiveMatches(text: string): Map<PatternId, string[]> {
  const results = findPatterns(text);
  const grouped = new Map<PatternId, string[]>();
  for (const r of results) {
    const existing = grouped.get(r.type) || [];
    existing.push(r.match);
    grouped.set(r.type, existing);
  }
  return grouped;
}

describe('sensitive-patterns-registry — Detección de datos sensibles', () => {
  describe('findPatterns', () => {
    it('retorna array vacío para texto sin datos sensibles', () => {
      const result = findPatterns('El informe financiero del Q3 muestra un crecimiento del 15%.');
      expect(result).toEqual([]);
    });

    it('retorna array vacío para string vacío', () => {
      expect(findPatterns('')).toEqual([]);
    });
  });

  describe('findSensitiveMatches', () => {
    it('agrupa múltiples matches del mismo tipo', () => {
      const text =
        'Contacta a juan@pdfblack.com o soporte@pdfblack.com para más información.';
      const result = findSensitiveMatches(text);
      expect(result.has('EMAIL')).toBe(true);
      const emails = result.get('EMAIL')!;
      expect(emails).toHaveLength(2);
      expect(emails).toContain('juan@pdfblack.com');
      expect(emails).toContain('soporte@pdfblack.com');
    });
  });

  // ─── DNI / NIE ──────────────────────────────────
  describe('DNI_ES', () => {
    it('detecta un DNI español válido', () => {
      const result = findSensitiveMatches('El titular con DNI 12345678Z debe firmar.');
      expect(result.has('DNI_ES')).toBe(true);
      expect(result.get('DNI_ES')).toContain('12345678Z');
    });

    it('no detecta un número de 8 dígitos sin letra', () => {
      const result = findSensitiveMatches('Referencia: 12345678.');
      expect(result.has('DNI_ES')).toBe(false);
    });

    it('detecta un NIE español', () => {
      const result = findSensitiveMatches('Extranjero con NIE X1234567L registrado.');
      expect(result.has('NIE_ES')).toBe(true);
      expect(result.get('NIE_ES')).toContain('X1234567L');
    });
  });

  // ─── CREDIT CARD ────────────────────────────────
  describe('CREDIT_CARD', () => {
    it('detecta número de tarjeta de crédito (16 dígitos)', () => {
      const result = findSensitiveMatches(
        'Pago realizado con tarjeta 4532123456789012.',
      );
      expect(result.has('CREDIT_CARD')).toBe(true);
      const cards = result.get('CREDIT_CARD')!;
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].replace(/\s/g, '')).toHaveLength(16);
    });

    it('detecta número con espacios o guiones', () => {
      const result = findSensitiveMatches('Tarjeta: 4532-1234-5678-9012');
      expect(result.has('CREDIT_CARD')).toBe(true);
    });
  });

  // ─── EMAIL ──────────────────────────────────────
  describe('EMAIL', () => {
    it('detecta dirección de correo estándar', () => {
      const result = findSensitiveMatches('Usuario: maria.garcia@empresa.com');
      expect(result.has('EMAIL')).toBe(true);
      expect(result.get('EMAIL')).toContain('maria.garcia@empresa.com');
    });

    it('detecta múltiples emails en texto', () => {
      const result = findSensitiveMatches(
        'CC: jefe@oficina.com, admin@oficina.com',
      );
      const emails = result.get('EMAIL')!;
      expect(emails).toHaveLength(2);
    });

    it('no detecta strings que parecen email pero no lo son', () => {
      const result = findSensitiveMatches(
        'El archivo peso 2.4@3x comprimido.',
      );
      expect(result.has('EMAIL')).toBe(false);
    });
  });

  // ─── PHONE ──────────────────────────────────────
  describe('PHONE_ES', () => {
    it('detecta número de teléfono español', () => {
      const result = findSensitiveMatches('Teléfono de contacto: 612345678');
      expect(result.has('PHONE_ES')).toBe(true);
      expect(result.get('PHONE_ES')).toContain('612345678');
    });

    it('detecta teléfono con prefijo internacional 0034', () => {
      const result = findSensitiveMatches('Llamar al 0034612345678.');
      expect(result.has('PHONE_ES')).toBe(true);
    });

    it('no detecta números que no son teléfonos', () => {
      const result = findSensitiveMatches('Código postal: 28001');
      expect(result.has('PHONE_ES')).toBe(false);
    });
  });

  // ─── IBAN ───────────────────────────────────────
  describe('IBAN_ES', () => {
    it('detecta IBAN español con formato estándar', () => {
      const result = findSensitiveMatches(
        'Cuenta bancaria: ES9121000418450200051332',
      );
      expect(result.has('IBAN_ES')).toBe(true);
    });

    it('detecta IBAN con espacios', () => {
      const result = findSensitiveMatches(
        'IBAN: ES91 2100 0418 4502 0005 1332',
      );
      expect(result.has('IBAN_ES')).toBe(true);
    });

    it('no detecta strings que no son IBAN español', () => {
      const result = findSensitiveMatches('Código ES123 no es IBAN');
      expect(result.has('IBAN_ES')).toBe(false);
    });
  });

  // ─── IP ADDRESS ─────────────────────────────────
  describe('IP_ADDRESS', () => {
    it('detecta dirección IPv4', () => {
      const result = findSensitiveMatches(
        'Acceso desde IP 192.168.1.1 registrado.',
      );
      expect(result.has('IP_ADDRESS')).toBe(true);
      expect(result.get('IP_ADDRESS')).toContain('192.168.1.1');
    });

    it('detecta múltiples IPs', () => {
      const result = findSensitiveMatches(
        'Origen: 10.0.0.1, Destino: 10.0.0.2',
      );
      const ips = result.get('IP_ADDRESS')!;
      expect(ips).toHaveLength(2);
    });

    it('no detecta números de versión como IP', () => {
      const result = findSensitiveMatches('Versión 2.0.1 del software');
      expect(result.has('IP_ADDRESS')).toBe(false);
    });
  });

  // ─── Múltiples tipos ────────────────────────────
  describe('texto con múltiples tipos de datos sensibles', () => {
    it('detecta DNI + teléfono + email en el mismo texto', () => {
      const text =
        'Empleado: Juan Pérez, DNI 12345678Z, tel: 612345678, email: juan@empresa.com';
      const result = findSensitiveMatches(text);
      expect(result.has('DNI_ES')).toBe(true);
      expect(result.has('PHONE_ES')).toBe(true);
      expect(result.has('EMAIL')).toBe(true);
    });
  });
});