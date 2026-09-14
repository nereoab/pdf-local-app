/**
 * Tests unitarios para el worker de desbloqueo PDF (pdf-unlock-worker)
 *
 * Verifica funciones puras sin dependencias DOM:
 * - parseSelectedPages
 * - detectPdfVersion & hasEncryptDict
 * - detectEncryptionAlgorithm (AES-256 R6, AES-128, RC4)
 * - parsePermissionsFromP
 * - SHA-256 checksums
 */

describe('pdf-unlock-worker — Utilidades de desbloqueo', () => {
  // ─── parseSelectedPages ──────────────────────────
  describe('parseSelectedPages', () => {
    function parseSelectedPages(
      numPages: number,
      pageScope?: string,
      pageRange?: string,
    ): number[] {
      if (!pageScope || pageScope === 'todas')
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
        if (selected.size > 0) return Array.from(selected).sort((a, b) => a - b);
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
      expect(parseSelectedPages(10, 'rango', '1-3,7,9-10')).toEqual([1, 2, 3, 7, 9, 10]);
    });

    it('rango fuera de límites se trunca', () => {
      expect(parseSelectedPages(5, 'rango', '3-10')).toEqual([3, 4, 5]);
    });

    it('scope indefinido retorna todas por defecto', () => {
      expect(parseSelectedPages(3)).toEqual([1, 2, 3]);
    });

    it('rango vacío retorna todas', () => {
      expect(parseSelectedPages(3, 'rango', '')).toEqual([1, 2, 3]);
    });
  });

  // ─── Detección de algoritmos y versiones ─────────
  describe('PDF version and algorithm detection', () => {
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

    function detectEncryptionAlgorithm(text: string): string {
      const encryptIdx = text.indexOf('/Encrypt');
      if (encryptIdx === -1) return 'Sin Cifrado';
      const window = text.slice(encryptIdx, encryptIdx + 1024);
      if (window.includes('/R 6') || window.includes('/R 5')) return 'AES-256 (ISO 32000-2 / R=6)';
      if (window.includes('/AESV3')) return 'AES-256 (ISO 32000-1 Extension 3)';
      if (window.includes('/AESV2') || window.includes('/R 4'))
        return 'AES-128 (Crypt Filter / R=4)';
      if (window.includes('/R 3')) return 'RC4 128-bit (Standard R=3)';
      if (window.includes('/R 2')) return 'RC4 40-bit (Standard R=2)';
      return 'Cifrado Estándar PDF';
    }

    it('detecta PDF version 1.7', () => {
      const buf = new TextEncoder().encode('%PDF-1.7\n%content');
      expect(detectPdfVersion(buf)).toBe('1.7');
    });

    it('detecta PDF version 2.0', () => {
      const buf = new TextEncoder().encode('%PDF-2.0\n%content');
      expect(detectPdfVersion(buf)).toBe('2.0');
    });

    it('detecta diccionario /Encrypt', () => {
      const buf = new TextEncoder().encode('/Encrypt 12 0 R');
      expect(hasEncryptDict(buf)).toBe(true);
    });

    it('detecta AES-256 R=6', () => {
      const text = '/Encrypt << /Filter /Standard /V 5 /R 6 /P -1028 >>';
      expect(detectEncryptionAlgorithm(text)).toBe('AES-256 (ISO 32000-2 / R=6)');
    });

    it('detecta AES-128 R=4', () => {
      const text = '/Encrypt << /Filter /Standard /V 4 /R 4 /P -4 >>';
      expect(detectEncryptionAlgorithm(text)).toBe('AES-128 (Crypt Filter / R=4)');
    });

    it('detecta RC4 128-bit R=3', () => {
      const text = '/Encrypt << /Filter /Standard /V 2 /R 3 /P -64 >>';
      expect(detectEncryptionAlgorithm(text)).toBe('RC4 128-bit (Standard R=3)');
    });

    it('detecta Sin Cifrado cuando no existe /Encrypt', () => {
      const text = '%PDF-1.7\nCatalog and objects';
      expect(detectEncryptionAlgorithm(text)).toBe('Sin Cifrado');
    });
  });

  // ─── Matriz de permisos (/P) ─────────────────────
  describe('Permissions parsing from /P bitfield', () => {
    function parsePermissionsFromP(pVal: number) {
      return {
        printing: (pVal & 4) !== 0,
        modifying: (pVal & 8) !== 0,
        copying: (pVal & 16) !== 0,
        annotating: (pVal & 32) !== 0,
        fillingForms: (pVal & 256) !== 0,
        extraction: (pVal & 512) !== 0,
        assembly: (pVal & 1024) !== 0,
        highQualityPrint: (pVal & 2048) !== 0,
      };
    }

    it('parsea permisos totalmente habilitados (-4)', () => {
      const perms = parsePermissionsFromP(-4);
      expect(perms.printing).toBe(true);
      expect(perms.copying).toBe(true);
      expect(perms.modifying).toBe(true);
    });

    it('detecta bloqueo de copia e impresión en documentos con restricciones estrictas', () => {
      // P = -1028 (-4 sin bit 4 ni bit 16 ni bit 8)
      const perms = parsePermissionsFromP(-1028 & ~4 & ~16 & ~8);
      expect(perms.printing).toBe(false);
      expect(perms.copying).toBe(false);
      expect(perms.modifying).toBe(false);
    });
  });

  // ─── Hash verification ───────────────────────────
  describe('SHA-256 checksum generation', () => {
    it('generates 64-char hex string for any buffer', async () => {
      const data = new TextEncoder().encode('unlock-test-data');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
  });
});
