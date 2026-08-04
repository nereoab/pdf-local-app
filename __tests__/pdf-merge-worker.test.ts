/**
 * Tests unitarios para el worker de fusión PDF (pdf-merge-worker)
 *
 * Verifica funciones puras:
 * - parsePageRange
 */

describe('pdf-merge-worker — parsePageRange', () => {
  function parsePageRange(
    rangeStr: string,
    totalPages: number
  ): number[] {
    if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',');
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = Math.max(1, parseInt(startStr, 10) || 1);
        const end = Math.min(
          totalPages,
          parseInt(endStr, 10) || totalPages
        );
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          indices.add(p - 1);
        }
      }
    });
    return Array.from(indices).sort((a, b) => a - b);
  }

  it('"all" retorna todos los índices (0-based)', () => {
    expect(parsePageRange('all', 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('string vacío retorna todos', () => {
    expect(parsePageRange('', 3)).toEqual([0, 1, 2]);
  });

  it('rango simple "1-3" en 5 páginas', () => {
    expect(parsePageRange('1-3', 5)).toEqual([0, 1, 2]);
  });

  it('rango "2-4" en 4 páginas', () => {
    expect(parsePageRange('2-4', 4)).toEqual([1, 2, 3]);
  });

  it('páginas sueltas "1,3,5"', () => {
    expect(parsePageRange('1,3,5', 5)).toEqual([0, 2, 4]);
  });

  it('combinación de rangos y páginas sueltas "1-2,5"', () => {
    expect(parsePageRange('1-2,5', 6)).toEqual([0, 1, 4]);
  });

  it('rango que excede totalPages se trunca', () => {
    expect(parsePageRange('3-10', 5)).toEqual([2, 3, 4]);
  });

  it('números inválidos se ignoran', () => {
    expect(parsePageRange('1,abc,3', 3)).toEqual([0, 2]);
  });

  it('página 0 se ignora (no existe en PDF)', () => {
    expect(parsePageRange('0,2', 3)).toEqual([1]);
  });

    it('rango invertido "5-1" retorna vacío (no soportado)', () => {
      expect(parsePageRange('5-1', 5)).toEqual([]);
    });

  it('" 1 , 2 , 3 " con espacios', () => {
    expect(parsePageRange(' 1 , 2 , 3 ', 3)).toEqual([0, 1, 2]);
  });
});