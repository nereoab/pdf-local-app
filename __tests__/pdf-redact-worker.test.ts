/**
 * FASE 5: Tests Unitarios - Motor de Redacción Enterprise v3.0
 * 
 * Suite de tests para validar la lógica de detección, censura,
 * parsing de content streams y mapeo de coordenadas.
 * 
 * Ejecutar con: npm test -- __tests__/pdf-redact-worker.test.ts
 * Requiere: Vitest o Jest configurado en el proyecto.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  analyzeContentStream,
  decodePdfString,
  escapePdfString,
  estimateTextWidth,
  viewportPercentToPdfCoords,
} from '../lib/pdf-content-stream-parser';
import {
  viewportPercentToPdfUserSpace,
  extractPageGeometry,
  boxesOverlap,
  expandRedactionArea,
  clampToMediaBox,
} from '../lib/pdf-text-coordinate-mapper';
import {
  getEnabledPatterns,
  patternToRegex,
  PREDEFINED_PATTERNS,
} from '../lib/sensitive-patterns-registry';
import { calculateSHA256, generateSessionId, getAuditLog, addAuditLogEntry } from '../lib/security-audit';

// ============================================================
// DETECCIÓN DE PATRONES
// ============================================================

describe('Sensitive Patterns Registry', () => {
  it('should have at least 20 predefined patterns', () => {
    expect(PREDEFINED_PATTERNS.length).toBeGreaterThanOrEqual(20);
  });

  it('should detect Spanish DNI', () => {
    const pattern = PREDEFINED_PATTERNS.find(p => p.id === 'dni-es');
    expect(pattern).toBeDefined();
    if (pattern) {
      const regex = patternToRegex(pattern);
      expect(regex.test('12345678Z')).toBe(true);
      expect(regex.test('1234567A')).toBe(true);
      expect(regex.test('1234ABC')).toBe(false);
    }
  });

  it('should detect email addresses', () => {
    const pattern = PREDEFINED_PATTERNS.find(p => p.id === 'email');
    expect(pattern).toBeDefined();
    if (pattern) {
      const regex = patternToRegex(pattern);
      expect(regex.test('user@example.com')).toBe(true);
      expect(regex.test('test.user+tag@domain.co.uk')).toBe(true);
      expect(regex.test('not-an-email')).toBe(false);
    }
  });

  it('should detect credit card numbers', () => {
    const pattern = PREDEFINED_PATTERNS.find(p => p.id === 'credit-card');
    expect(pattern).toBeDefined();
    if (pattern) {
      const regex = patternToRegex(pattern);
      expect(regex.test('4111 1111 1111 1111')).toBe(true);
      expect(regex.test('4111-1111-1111-1111')).toBe(true);
      expect(regex.test('12345')).toBe(false);
    }
  });

  it('should detect IBAN', () => {
    const pattern = PREDEFINED_PATTERNS.find(p => p.id === 'iban-es');
    expect(pattern).toBeDefined();
    if (pattern) {
      const regex = patternToRegex(pattern);
      expect(regex.test('ES91 2100 0418 4502 0005 1332')).toBe(true);
    }
  });

  it('getEnabledPatterns should return all enabled patterns', () => {
    const enabled = getEnabledPatterns();
    expect(enabled.length).toBeGreaterThan(0);
    enabled.forEach(p => expect(p.enabled).toBe(true));
  });
});

// ============================================================
// CONTENT STREAM PARSER
// ============================================================

describe('Content Stream Parser', () => {
  it('should parse simple Tj text operators', () => {
    const stream = 'BT /F1 12 Tf 100 700 Td (Hello World) Tj ET';
    const analysis = analyzeContentStream(stream);
    expect(analysis.textOperators.length).toBeGreaterThanOrEqual(1);
  });

  it('should decode escaped PDF strings', () => {
    expect(decodePdfString('(Hello\\nWorld)')).toBe('Hello\nWorld');
    expect(decodePdfString('(Price: \\50)')).toBe('Price: 50');
    expect(decodePdfString('(Escaped \\(paren\\))')).toBe('Escaped (paren)');
  });

  it('should escape strings for PDF', () => {
    const escaped = escapePdfString('Hello (World)');
    expect(escaped).toContain('\\(');
    expect(escaped).toContain('\\)');
  });

  it('should estimate text width', () => {
    const width = estimateTextWidth('Hello', 12);
    expect(width).toBeCloseTo(33, 0); // 5 chars * 12 * 0.55 = 33
  });
});

// ============================================================
// COORDINATE MAPPER
// ============================================================

describe('Coordinate Mapper', () => {
  const geometry = {
    mediaBox: [0, 0, 595, 842] as [number, number, number, number],
    cropBox: [0, 0, 595, 842] as [number, number, number, number],
    rotate: 0,
    viewportWidth: 595,
    viewportHeight: 842,
  };

  it('should convert viewport % to PDF user space (0° rotation)', () => {
    const result = viewportPercentToPdfUserSpace(10, 20, 30, 10, geometry);
    expect(result.x).toBeCloseTo(59.5, 1); // 10% of 595
    expect(result.y).toBeGreaterThan(0); // Y inverted
    expect(result.w).toBeCloseTo(178.5, 1);
  });

  it('should detect overlapping boxes', () => {
    const box1 = { left: 0, bottom: 0, right: 100, top: 100 };
    const box2 = { left: 50, bottom: 50, right: 150, top: 150 };
    expect(boxesOverlap(box1, box2)).toBe(true);

    const box3 = { left: 200, bottom: 200, right: 300, top: 300 };
    expect(boxesOverlap(box1, box3)).toBe(false);
  });

  it('should expand redaction areas with safety margin', () => {
    const box = { x: 100, y: 200, w: 50, h: 20 };
    const expanded = expandRedactionArea(box, 15);
    expect(expanded.w).toBeGreaterThan(box.w);
    expect(expanded.h).toBeGreaterThan(box.h);
  });

  it('should clamp areas to media box', () => {
    const box = { x: -10, y: -20, w: 700, h: 1000 };
    const clamped = clampToMediaBox(box, [0, 0, 595, 842]);
    expect(clamped.x).toBeGreaterThanOrEqual(0);
    expect(clamped.y).toBeGreaterThanOrEqual(0);
    expect(clamped.w).toBeLessThanOrEqual(595);
  });
});

// ============================================================
// SECURITY & HASHING
// ============================================================

describe('Security & Hashing', () => {
  it('should calculate SHA-256 hash', async () => {
    const buffer = new TextEncoder().encode('test data').buffer;
    const hash = await calculateSHA256(buffer);
    expect(hash).toHaveLength(64); // SHA-256 produces 64 hex chars
    expect(typeof hash).toBe('string');
  });

  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
  });

  it('should add and retrieve audit log entries', () => {
    addAuditLogEntry({
      timestamp: new Date().toISOString(),
      eventType: 'document_loaded',
      details: 'Test document loaded',
    });
    const log = getAuditLog();
    expect(log.length).toBeGreaterThan(0);
    const lastEntry = log[log.length - 1];
    expect(lastEntry.eventType).toBe('document_loaded');
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe('Edge Cases', () => {
  it('should handle empty content streams', () => {
    const analysis = analyzeContentStream('');
    expect(analysis.textOperators).toHaveLength(0);
    expect(analysis.currentFontSize).toBe(12); // default
  });

  it('should handle special characters in PDF strings', () => {
    const decoded = decodePdfString('(C\\351sar)'); // é in octal
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('should handle very long text strings', () => {
    const longText = 'A'.repeat(1000);
    const width = estimateTextWidth(longText, 12);
    expect(width).toBeGreaterThan(1000);
  });
});