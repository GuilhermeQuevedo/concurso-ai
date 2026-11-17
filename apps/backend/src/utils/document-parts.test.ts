import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MAX_FIRST_PART_PAGES, partsOf, splitPdfPages, splitPlainText } from './document-parts.js';

const pages = (n: number) => Array.from({ length: n }, (_, i) => `Página ${i + 1} com conteúdo programático.`);

describe('splitPdfPages', () => {
  it('lê tudo de uma vez quando cabe nas primeiras 50 páginas', () => {
    const result = splitPdfPages(pages(MAX_FIRST_PART_PAGES));
    assert.equal(result.firstPartChars, null);
    assert.equal(result.pageCount, MAX_FIRST_PART_PAGES);
  });

  it('corta na página 50 e guarda o restante para a segunda leitura', () => {
    const result = splitPdfPages(pages(69));
    assert.equal(result.pageCount, 69);
    assert.ok(result.firstPartChars !== null);
    const { first, rest } = partsOf(result.content, result.firstPartChars);
    assert.ok(first.includes('Página 50 '));
    assert.ok(!first.includes('Página 51 '));
    assert.ok(rest.startsWith('Página 51 '));
    assert.ok(rest.includes('Página 69 '));
  });

  it('não perde texto: primeira parte + restante cobrem o conteúdo inteiro', () => {
    const result = splitPdfPages(pages(80));
    const { first, rest } = partsOf(result.content, result.firstPartChars);
    assert.equal(`${first}\n\n${rest}`, result.content);
  });

  it('ignora páginas em branco ao montar o texto', () => {
    const result = splitPdfPages(['A', '', 'B']);
    assert.equal(result.content, 'A\n\nB');
    assert.equal(result.pageCount, 3);
  });
});

describe('splitPlainText', () => {
  it('não corta texto pequeno', () => {
    assert.equal(splitPlainText('curto', 100), null);
  });

  it('corta no último parágrafo antes do limite', () => {
    const text = `${'a'.repeat(60)}\n\n${'b'.repeat(60)}`;
    assert.equal(splitPlainText(text, 100), 60);
  });
});

describe('partsOf', () => {
  it('sem ponto de corte devolve tudo como primeira parte', () => {
    assert.deepEqual(partsOf('texto', null), { first: 'texto', rest: '' });
  });
});
