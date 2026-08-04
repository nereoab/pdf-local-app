/**
 * Tests unitarios para el módulo Security & Compliance (security-audit)
 *
 * Verifica funciones puras:
 * - calculateSHA256
 * - generateSessionId
 * - verifyIntegrity
 * - formatHash
 * - formatSizeForCertificate
 * - addAuditLogEntry / getAuditLog (con mock localStorage)
 * - addCustodyRecord / getCustodyChain
 * - generateCertificateOfRedaction
 * - clearAuditLog
 */

// Mock localStorage antes de importar
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import {
  calculateSHA256,
  generateSessionId,
  verifyIntegrity,
  formatHash,
  formatSizeForCertificate,
  addAuditLogEntry,
  getAuditLog,
  clearAuditLog,
  addCustodyRecord,
  getCustodyChain,
  generateCertificateOfRedaction,
  CustodyRecord,
} from '../lib/security-audit';

describe('Security & Compliance — security-audit', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ─── SHA-256 Hashing ─────────────────────────────
  describe('calculateSHA256', () => {
    it('generates 64-character hex string', async () => {
      const buffer = new TextEncoder().encode('enterprise-data').buffer;
      const hash = await calculateSHA256(buffer);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('same input produces identical hash', async () => {
      const data1 = new TextEncoder().encode('same-data').buffer;
      const data2 = new TextEncoder().encode('same-data').buffer;
      expect(await calculateSHA256(data1)).toBe(
        await calculateSHA256(data2)
      );
    });

    it('different inputs produce different hashes', async () => {
      const h1 = await calculateSHA256(
        new TextEncoder().encode('alpha').buffer
      );
      const h2 = await calculateSHA256(
        new TextEncoder().encode('beta').buffer
      );
      expect(h1).not.toBe(h2);
    });
  });

  // ─── Session ID ──────────────────────────────────
  describe('generateSessionId', () => {
    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }
      expect(ids.size).toBe(100);
    });

    it('session ID has expected format', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^session-\d+-[a-z0-9]+$/);
    });
  });

  // ─── Integrity Verification ──────────────────────
  describe('verifyIntegrity', () => {
    it('returns true for matching hashes', () => {
      expect(verifyIntegrity('abc123', 'abc123')).toBe(true);
    });

    it('returns false for non-matching hashes', () => {
      expect(verifyIntegrity('abc123', 'def456')).toBe(false);
    });

    it('is case sensitive', () => {
      expect(verifyIntegrity('ABC', 'abc')).toBe(false);
    });
  });

  // ─── Hash Formatting ─────────────────────────────
  describe('formatHash', () => {
    it('formats long hash in groups of 8', () => {
      const formatted = formatHash('abcdef1234567890abcdef1234567890');
      expect(formatted).toMatch(/^[0-9a-f]{8}( [0-9a-f]{8})+$/);
    });

    it('returns short hash as-is', () => {
      const short = 'abc';
      expect(formatHash(short)).toBe('abc');
    });
  });

  // ─── Size Formatting ─────────────────────────────
  describe('formatSizeForCertificate', () => {
    it('formats bytes', () => {
      expect(formatSizeForCertificate(500)).toBe('500 B');
    });

    it('formats KB', () => {
      expect(formatSizeForCertificate(2048)).toBe('2.0 KB');
    });

    it('formats MB', () => {
      expect(formatSizeForCertificate(1048576)).toBe('1.00 MB');
    });
  });

  // ─── Audit Log ───────────────────────────────────
  describe('Audit Log CRUD', () => {
    it('starts empty', () => {
      expect(getAuditLog()).toEqual([]);
    });

    it('adds and retrieves entries', () => {
      addAuditLogEntry({
        timestamp: new Date().toISOString(),
        eventType: 'document_loaded',
        details: 'Test document loaded',
      });
      const log = getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0].eventType).toBe('document_loaded');
      expect(log[0].details).toBe('Test document loaded');
    });

    it('clears audit log', () => {
      addAuditLogEntry({
        timestamp: new Date().toISOString(),
        eventType: 'redaction_applied',
        details: 'Redacted page 1',
      });
      clearAuditLog();
      expect(getAuditLog()).toEqual([]);
    });

    it('maintains max 500 entries (trims oldest)', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        eventType: 'pattern_detected' as const,
        details: 'Pattern match',
      };
      for (let i = 0; i < 505; i++) {
        addAuditLogEntry({ ...entry, details: `Pattern #${i}` });
      }
      const log = getAuditLog();
      expect(log.length).toBeLessThanOrEqual(500);
      expect(log[log.length - 1].details).toBe('Pattern #504');
    });
  });

  // ─── Custody Chain ───────────────────────────────
  describe('Custody Chain', () => {
    it('starts empty', () => {
      expect(getCustodyChain()).toEqual([]);
    });

    it('adds and retrieves records', () => {
      const record: CustodyRecord = {
        sessionId: 'session-123',
        timestamp: new Date().toISOString(),
        originalFileName: 'test.pdf',
        originalHash: '0a0b0c0d0e0f',
        redactedHash: '1a1b1c1d1e1f',
        originalSize: 10000,
        redactedSize: 8000,
        totalRedactions: 5,
        pagesWithRedactions: 2,
        mode: 'precision',
        precisionPages: 2,
        rasterPages: 0,
        engineVersion: '3.0.0',
        userAgent: 'TestAgent/1.0',
      };
      addCustodyRecord(record);
      const chain = getCustodyChain();
      expect(chain.length).toBe(1);
      expect(chain[0].originalFileName).toBe('test.pdf');
      expect(chain[0].totalRedactions).toBe(5);
    });
  });

  // ─── Certificate of Redaction ────────────────────
  describe('generateCertificateOfRedaction', () => {
    it('generates certificate with required fields', () => {
      const record: CustodyRecord = {
        sessionId: 'session-cert',
        timestamp: new Date().toISOString(),
        originalFileName: 'document.pdf',
        originalHash: 'hash-original',
        redactedHash: 'hash-redacted',
        originalSize: 5000,
        redactedSize: 4000,
        totalRedactions: 3,
        pagesWithRedactions: 1,
        mode: 'precision',
        precisionPages: 1,
        rasterPages: 0,
        engineVersion: '3.0.0',
        userAgent: 'Test/1.0',
      };

      const cert = generateCertificateOfRedaction([record]);

      expect(cert.certificateVersion).toBe('1.0.0');
      expect(cert.certificateId).toMatch(/^CERT-\d+-[A-Z0-9]+$/);
      expect(cert.custodyChain).toHaveLength(1);
      expect(cert.complianceStatement).toContain('GDPR');
      expect(cert.complianceStatement).toContain('HIPAA');
      expect(cert.complianceStatement).toContain('SOC2');
      expect(cert.engineSignature).toContain('PDFBlack');
    });

    it('certificates for different chains have unique IDs', () => {
      const record: CustodyRecord = {
        sessionId: 's1',
        timestamp: new Date().toISOString(),
        originalFileName: 'file1.pdf',
        originalHash: 'h1',
        redactedHash: 'h2',
        originalSize: 1000,
        redactedSize: 900,
        totalRedactions: 1,
        pagesWithRedactions: 1,
        mode: 'raster',
        precisionPages: 0,
        rasterPages: 1,
        engineVersion: '3.0.0',
        userAgent: 'Test/1.0',
      };

      const cert1 = generateCertificateOfRedaction([record]);
      const cert2 = generateCertificateOfRedaction([record]);
      expect(cert1.certificateId).not.toBe(cert2.certificateId);
    });
  });
});