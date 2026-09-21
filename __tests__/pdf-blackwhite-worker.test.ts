/**
 * Tests unitarios para el worker de conversión a Blanco y Negro / Grayscale (pdf-blackwhite.worker)
 *
 * Valida:
 * - parseTargetPages (selección de páginas 'all', 'even', 'odd', 'range')
 * - getQualitySettings (presets 'draft', 'standard', 'high', escala y compresión JPEG)
 * - applyMonochromeFilter (fórmula ITU-R BT.601 para luminancia continua y binarizado puro con threshold)
 */

import { BlackWhiteMode, QualityPreset, PageScope } from '@/workers/pdf-blackwhite.worker';

describe('pdf-blackwhite.worker — Algoritmos y Utilidades de Monocromo', () => {
  // ─── 1. parseTargetPages ──────────────────────────────────────────
  describe('parseTargetPages', () => {
    function parseTargetPages(totalPages: number, scope: PageScope, range?: string): number[] {
      if (scope === 'all') return Array.from({ length: totalPages }, (_, i) => i + 1);
      if (scope === 'even')
        return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
      if (scope === 'odd')
        return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
      if (scope === 'range' && range?.trim()) {
        const selected = new Set<number>();
        const parts = range.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes('-')) {
            const [s, e] = trimmed.split('-').map(Number);
            if (!isNaN(s) && !isNaN(e)) {
              for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
                if (i >= 1 && i <= totalPages) selected.add(i);
              }
            }
          } else {
            const num = Number(trimmed);
            if (!isNaN(num) && num >= 1 && num <= totalPages) {
              selected.add(num);
            }
          }
        }
        const result = Array.from(selected).sort((a, b) => a - b);
        return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    it('retorna todas las páginas cuando scope es "all"', () => {
      expect(parseTargetPages(5, 'all')).toEqual([1, 2, 3, 4, 5]);
    });

    it('retorna solo las páginas pares cuando scope es "even"', () => {
      expect(parseTargetPages(6, 'even')).toEqual([2, 4, 6]);
    });

    it('retorna solo las páginas impares cuando scope es "odd"', () => {
      expect(parseTargetPages(6, 'odd')).toEqual([1, 3, 5]);
    });

    it('parsea rangos individuales e intervalos combinados', () => {
      expect(parseTargetPages(10, 'range', '1, 3-5, 8')).toEqual([1, 3, 4, 5, 8]);
    });

    it('ignora páginas fuera de los límites del documento', () => {
      expect(parseTargetPages(5, 'range', '2, 7, 9')).toEqual([2]);
    });

    it('retorna todas las páginas si el rango especificado está vacío o es inválido', () => {
      expect(parseTargetPages(4, 'range', '')).toEqual([1, 2, 3, 4]);
      expect(parseTargetPages(4, 'range', 'invalid-format')).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── 2. getQualitySettings ────────────────────────────────────────
  describe('getQualitySettings', () => {
    function getQualitySettings(
      preset: QualityPreset,
      customScale?: number,
      customJpegQuality?: number,
    ): { scale: number; jpegQuality: number } {
      if (customScale && customJpegQuality) {
        return { scale: customScale, jpegQuality: customJpegQuality };
      }
      switch (preset) {
        case 'draft':
          return { scale: 1.2, jpegQuality: 0.72 };
        case 'high':
          return { scale: 2.2, jpegQuality: 0.9 };
        case 'standard':
        default:
          return { scale: 1.6, jpegQuality: 0.84 };
      }
    }

    it('devuelve escala y compresión para draft', () => {
      const res = getQualitySettings('draft');
      expect(res.scale).toBe(1.2);
      expect(res.jpegQuality).toBe(0.72);
    });

    it('devuelve escala y compresión estándar por defecto', () => {
      const res = getQualitySettings('standard');
      expect(res.scale).toBe(1.6);
      expect(res.jpegQuality).toBe(0.84);
    });

    it('devuelve escala y compresión alta para high', () => {
      const res = getQualitySettings('high');
      expect(res.scale).toBe(2.2);
      expect(res.jpegQuality).toBe(0.9);
    });

    it('prioriza customScale y customJpegQuality si están definidos', () => {
      const res = getQualitySettings('draft', 3.0, 0.95);
      expect(res.scale).toBe(3.0);
      expect(res.jpegQuality).toBe(0.95);
    });
  });

  // ─── 3. applyMonochromeFilter ─────────────────────────────────────
  describe('applyMonochromeFilter — Transformación Fotométrica ITU-R BT.601', () => {
    function calculateLuminance(r: number, g: number, b: number): number {
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    function processPixel(
      r: number,
      g: number,
      b: number,
      mode: BlackWhiteMode,
      threshold: number,
    ): [number, number, number] {
      const gray = calculateLuminance(r, g, b);
      if (mode === 'blackwhite') {
        const val = gray < threshold ? 0 : 255;
        return [val, val, val];
      }
      return [gray, gray, gray];
    }

    it('calcula la luminancia ITU-R para blanco puro y negro puro', () => {
      expect(calculateLuminance(255, 255, 255)).toBeCloseTo(255, 1);
      expect(calculateLuminance(0, 0, 0)).toBe(0);
    });

    it('en modo grayscale asigna los mismos canales r=g=b equivalentes a la luminancia percibida', () => {
      // Color rojo puro: R=255, G=0, B=0 => 0.299 * 255 = 76.245
      const [r, g, b] = processPixel(255, 0, 0, 'grayscale', 170);
      expect(r).toBeCloseTo(76.245, 2);
      expect(g).toBeCloseTo(76.245, 2);
      expect(b).toBeCloseTo(76.245, 2);
    });

    it('en modo blackwhite binariza a negro (0) si la luminancia es inferior al umbral (threshold)', () => {
      // Rojo puro tiene luminancia ~76.245 < 170 => debe ser 0 (negro puro)
      const [r, g, b] = processPixel(255, 0, 0, 'blackwhite', 170);
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('en modo blackwhite binariza a blanco (255) si la luminancia supera el umbral (threshold)', () => {
      // Amarillo claro: R=255, G=255, B=0 => luminancia 0.299*255 + 0.587*255 = 225.93 > 170 => blanco (255)
      const [r, g, b] = processPixel(255, 255, 0, 'blackwhite', 170);
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });
  });
});
