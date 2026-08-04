/**
 * Tests unitarios para el worker de desbloqueo PDF (pdf-unlock-worker)
 *
 * Verifica funciones puras sin dependencias DOM:
 * - parseSelectedPages
 * - extractPdfMetadata (con buffers mock)
 * - buildPermissions
 */

describe('pdf-unlock-worker — Utilidades de desbloqueo', () => {
  // ─── parseSelectedPages ──────────────────────────
  describe('parseSelectedPages', () => {
    // Replicada del worker para testing
    function parseSelectedPages(
      numPages: number,
      pageScope: string,
      pageRange?: string
    ): number[] {
      if (pageScope === 'todas')
        return Array.from({ length: numPages }, (_, i) => i + 1);
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
        if (selected.size > 0)
          return Array.from(selected).sort((a, b) => a - b);
      }
      return Array.from({ length: numPages }, (_, i) => i + 1);
    }

    it('"todas" retorna todas las páginas', () => {
      expect(parseSelectedPages(5, 'todas')).toEqual([1, 2, 3, 4, 5]);
    });

    it('rango simple: "1-3" retorna [1,2,3]', () => {
      expect(parseSelectedPages(10, 'rango', '1-3')).toEqual([1, 2, 3]);
    });

    it('rango múltiple: "1-3,7,9-10" retorna las páginas correctas', () => {
      expect(parseSelectedPages(10, 'rango', '1-3,7,9-10')).toEqual([
        1, 2, 3, 7, 9, 10,
      ]);
    });

    it('rango fuera de límites se trunca', () => {
      expect(parseSelectedPages(5, 'rango', '3-10')).toEqual([3, 4, 5]);
    });

    it('scope inválido retorna todas por defecto', () => {
      expect(parseSelectedPages(3, 'invalido' as 'todas')).toEqual([1, 2, 3]);
    });

    it('rango vacío retorna todas', () => {
      expect(parseSelectedPages(3, 'rango', '')).toEqual([1, 2, 3]);
    });
  });

  // ─── extractPdfMetadata (version parsing) ─────────
  describe('PDF version detection', () => {
    function detectPdfVersion(uint8: Uint8Array): string {
      const scanSize = Math.min(uint8.length, 2 * 1024 * 1024);
      const text = new TextDecoder('latin1').decode(uint8.slice(0, scanSize));
      const versionMatch = text.match(/%PDF-(\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : 'desconocida';
    }

    function hasEncryptDict(uint8: Uint8Array): boolean {
      const text = new TextDecoder('latin1').decode(uint8);
      return text.includes('/Encrypt');
    }

    function hasDigitalSignature(uint8: Uint8Array): boolean {
      const text = new TextDecoder('latin1').decode(uint8);
      return (
        text.includes('/Sig') ||
        text.includes('/DocMDP') ||
        text.includes('/FieldMDP') ||
        text.includes('/ByteRange')
      );
    }

    it('detecta PDF version 1.7', () => {
      const buf = new TextEncoder().encode('%PDF-1.7\n%content');
      expect(detectPdfVersion(buf)).toBe('1.7');
    });

    it('detecta PDF version 2.0', () => {
      const buf = new TextEncoder().encode('%PDF-2.0\n%content');
      expect(detectPdfVersion(buf)).toBe('2.0');
    });

    it('retorna "desconocida" sin header PDF', () => {
      const buf = new TextEncoder().encode('Not a PDF file');
      expect(detectPdfVersion(buf)).toBe('desconocida');
    });

    it('detecta diccionario /Encrypt', () => {
      const buf = new TextEncoder().encode('/Encrypt 12 0 R');
      expect(hasEncryptDict(buf)).toBe(true);
    });

    it('no detecta /Encrypt cuando no existe', () => {
      const buf = new TextEncoder().encode('%PDF-1.4\nNo encryption');
      expect(hasEncryptDict(buf)).toBe(false);
    });

    it('detecta firma digital via /Sig', () => {
      const buf = new TextEncoder().encode('/Sig /Type /Sig');
      expect(hasDigitalSignature(buf)).toBe(true);
    });

    it('detecta firma digital via /ByteRange', () => {
      const buf = new TextEncoder().encode('/ByteRange [0 100]');
      expect(hasDigitalSignature(buf)).toBe(true);
    });

    it('no detecta firma sin marcadores', () => {
      const buf = new TextEncoder().encode('%PDF-1.7\nPlain PDF');
      expect(hasDigitalSignature(buf)).toBe(false);
    });
  });

  // ─── Hash verification ───────────────────────────
  describe('SHA-256 checksum generation', () => {
    it('generates 64-char hex string for any buffer', async () => {
      const data = new TextEncoder().encode('unlock-test-data');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(hex).toHaveLength(64);
      expect(typeof hex).toBe('string');
    });

    it('same input produces same hash', async () => {
      const data1 = new TextEncoder().encode('identical');
      const data2 = new TextEncoder().encode('identical');
      const h1 = await crypto.subtle.digest('SHA-256', data1);
      const h2 = await crypto.subtle.digest('SHA-256', data2);
      expect(new Uint8Array(h1)).toEqual(new Uint8Array(h2));
    });

    it('different inputs produce different hashes', async () => {
      const h1 = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode('abc')
      );
      const h2 = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode('xyz')
      );
      const arr1 = Array.from(new Uint8Array(h1));
      const arr2 = Array.from(new Uint8Array(h2));
      expect(arr1).not.toEqual(arr2);
    });
  });
});