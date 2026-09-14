import {
  myersDiffWords,
  normalizeWord,
  buildDiffBlocks,
  type WordToken,
  type DiffWord,
} from '../utils/pdf-diff-engine';

describe('PDF Comparison Engine v4.0 - Myers Diff & Normalization', () => {
  it('correctly detects identical sentences with common prefix and suffix', () => {
    const textA = 'El contrato de arrendamiento entra en vigencia hoy';
    const textB = 'El contrato de arrendamiento entra en vigencia hoy';

    const tokensA: WordToken[] = textA.split(' ').map((w) => ({ raw: w, norm: w }));
    const tokensB: WordToken[] = textB.split(' ').map((w) => ({ raw: w, norm: w }));

    const diff = myersDiffWords(tokensA, tokensB);

    expect(diff.every((d) => d.type === 'equal')).toBe(true);
    expect(diff.length).toBe(tokensA.length);
  });

  test('detects word additions and removals in middle of sentence', () => {
    const textA = 'El monto total a pagar es de diez mil dólares americanos';
    const textB = 'El monto total a pagar es de quince mil euros americanos';

    const tokensA: WordToken[] = textA.split(' ').map((w) => ({ raw: w, norm: w }));
    const tokensB: WordToken[] = textB.split(' ').map((w) => ({ raw: w, norm: w }));

    const diff = myersDiffWords(tokensA, tokensB);

    const removed = diff.filter((d) => d.type === 'removed');
    const added = diff.filter((d) => d.type === 'added');

    expect(removed.map((r) => r.valueA?.raw)).toEqual(['diez', 'dólares']);
    expect(added.map((a) => a.valueB?.raw)).toEqual(['quince', 'euros']);
  });

  it('respects ignoreCase and ignorePunctuation normalization options', () => {
    const word1 = 'CLÁUSULA:';
    const word2 = 'cláusula';

    const norm1 = normalizeWord(word1, { ignoreCase: true, ignorePunctuation: true });
    const norm2 = normalizeWord(word2, { ignoreCase: true, ignorePunctuation: true });

    expect(norm1).toBe(norm2);
  });

  it('buildDiffBlocks correctly aggregates sequential diff words with context', () => {
    const diffWords: DiffWord[] = [
      { text: 'Esta', type: 'equal', page: 1, index: 0 },
      { text: 'es', type: 'equal', page: 1, index: 1 },
      { text: 'una', type: 'equal', page: 1, index: 2 },
      { text: 'versión', type: 'removed', page: 1, index: 3 },
      { text: 'antigua', type: 'removed', page: 1, index: 4 },
      { text: 'nueva', type: 'added', page: 1, index: 5 },
      { text: 'del', type: 'equal', page: 1, index: 6 },
      { text: 'documento', type: 'equal', page: 1, index: 7 },
    ];

    const blocks = buildDiffBlocks(diffWords);

    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe('removed');
    expect(blocks[0].text).toBe('versión antigua');
    expect(blocks[0].contextBefore).toBe('Esta es una');
    expect(blocks[1].type).toBe('added');
    expect(blocks[1].text).toBe('nueva');
  });

  it('handles completely different text without crashing or hanging', () => {
    const textA = 'Párrafo original con conceptos jurídicos y financieros';
    const textB = 'Totalmente modificado sin ninguna coincidencia léxica previa';

    const tokensA: WordToken[] = textA.split(' ').map((w) => ({ raw: w, norm: w }));
    const tokensB: WordToken[] = textB.split(' ').map((w) => ({ raw: w, norm: w }));

    const diff = myersDiffWords(tokensA, tokensB);

    const removed = diff.filter((d) => d.type === 'removed');
    const added = diff.filter((d) => d.type === 'added');

    expect(removed.length).toBe(tokensA.length);
    expect(added.length).toBe(tokensB.length);
  });
});
