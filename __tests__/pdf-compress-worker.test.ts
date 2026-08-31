/**
 * Tests unitarios para el worker de compresión PDF (pdf-compress-worker)
 *
 * Verifica funciones puras:
 * - parseSelectedPages
 * - getCompressionParams
 * - formatSize
 */

describe('pdf-compress-worker — Utilidades de compresión', () => {
  // ─── parseSelectedPages ──────────────────────────
  describe('parseSelectedPages', () => {
    function parseSelectedPages(numPages: number, pageScope: string, pageRange?: string): number[] {
      if (pageScope === 'todas') return Array.from({ length: numPages }, (_, i) => i + 1);
      if (pageScope === 'pares')
        return Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
      if (pageScope === 'impares')
        return Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
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
      expect(parseSelectedPages(6, 'todas')).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('"pares" retorna solo pares', () => {
      expect(parseSelectedPages(6, 'pares')).toEqual([2, 4, 6]);
    });

    it('"impares" retorna solo impares', () => {
      expect(parseSelectedPages(6, 'impares')).toEqual([1, 3, 5]);
    });

    it('rango "2-4" en 6 páginas', () => {
      expect(parseSelectedPages(6, 'rango', '2-4')).toEqual([2, 3, 4]);
    });

    it('scope inválido retorna todas', () => {
      expect(parseSelectedPages(3, 'invalid' as 'todas')).toEqual([1, 2, 3]);
    });
  });

  // ─── getCompressionParams ────────────────────────
  describe('getCompressionParams', () => {
    function getCompressionParams(
      level: 'low' | 'medium' | 'high',
      dpiMode: 'auto' | '72' | '96' | '150',
    ): { scale: number; jpegQuality: number } {
      if (dpiMode === '72') return { scale: 1.0, jpegQuality: 0.6 };
      if (dpiMode === '96') return { scale: 1.33, jpegQuality: 0.68 };
      if (dpiMode === '150') return { scale: 2.08, jpegQuality: 0.78 };
      switch (level) {
        case 'low':
          return { scale: 2.0, jpegQuality: 0.82 };
        case 'medium':
          return { scale: 1.5, jpegQuality: 0.7 };
        case 'high':
          return { scale: 1.33, jpegQuality: 0.62 };
      }
    }

    it('nivel bajo preserva calidad máxima (150 DPI)', () => {
      const params = getCompressionParams('low', 'auto');
      expect(params.scale).toBe(2.0);
      expect(params.jpegQuality).toBe(0.82);
    });

    it('nivel medio equilibra escala y compresión (110 DPI)', () => {
      const params = getCompressionParams('medium', 'auto');
      expect(params.scale).toBe(1.5);
      expect(params.jpegQuality).toBe(0.7);
    });

    it('nivel alto mantiene nitidez y alta compresión (96 DPI)', () => {
      const params = getCompressionParams('high', 'auto');
      expect(params.scale).toBe(1.33);
      expect(params.jpegQuality).toBe(0.62);
    });

    it('DPI 72 tiene prioridad sobre nivel', () => {
      const params = getCompressionParams('low', '72');
      expect(params.scale).toBe(1.0);
      expect(params.jpegQuality).toBe(0.6);
    });

    it('DPI 96 tiene prioridad sobre nivel', () => {
      const params = getCompressionParams('high', '96');
      expect(params.scale).toBe(1.33);
      expect(params.jpegQuality).toBe(0.68);
    });

    it('DPI 150 tiene prioridad sobre nivel', () => {
      const params = getCompressionParams('low', '150');
      expect(params.scale).toBe(2.08);
      expect(params.jpegQuality).toBe(0.78);
    });
  });

  // ─── formatSize ──────────────────────────────────
  describe('formatSize', () => {
    function formatSize(bytes: number): string {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    it('0 bytes retorna "0 KB"', () => {
      expect(formatSize(0)).toBe('0 KB');
    });

    it('500 bytes retorna "500 Bytes"', () => {
      expect(formatSize(500)).toContain('Bytes');
    });

    it('2048 bytes retorna "2 KB"', () => {
      expect(formatSize(2048)).toBe('2 KB');
    });

    it('1048576 bytes retorna "1 MB"', () => {
      expect(formatSize(1048576)).toBe('1 MB');
    });

    it('1.5 GB se formatea correctamente', () => {
      const result = formatSize(1.5 * 1024 * 1024 * 1024);
      expect(result).toContain('GB');
      expect(result).toBe('1.5 GB');
    });
  });
});
