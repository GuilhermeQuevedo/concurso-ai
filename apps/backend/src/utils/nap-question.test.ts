import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mapDifficulty, normalizeAnswer, normalizeBoardName, toBankQuestion, type NapQuestion } from './nap-question.js';

const base: NapQuestion = {
  id: 'abc',
  ano: 2024,
  banca: 'CESPE / CEBRASPE',
  orgao: 'MPE-AM',
  prova: 'Prova X',
  disciplina: 'Direito Penal',
  tipo: 'ME',
  alternativas: [{ letra: 'A', texto: '<p>Um&nbsp;texto</p>' }, { letra: 'B', texto: 'Outro' }],
  gabarito: 'B',
  texto_principal_rich: '<p>Assinale a correta.</p>',
  texto_apoio_rich: '',
  dificuldade: 'Muito Fácil',
  comentario_rich: '<p>Comentário.</p>',
  visivel: true,
};

describe('toBankQuestion', () => {
  it('converte uma questão válida, limpando o HTML', () => {
    const q = toBankQuestion(base);
    assert.equal(q?.sourceRef, 'nap:abc');
    assert.equal(q?.board, 'CESPE/CEBRASPE');
    assert.equal(q?.statement, 'Assinale a correta.');
    assert.deepEqual(q?.alternatives[0], { letter: 'A', text: 'Um texto' });
    assert.equal(q?.difficulty, 'EASY');
    assert.equal(q?.examYear, 2024);
  });

  it('junta o texto de apoio antes do enunciado', () => {
    assert.equal(toBankQuestion({ ...base, texto_apoio_rich: '<p>Texto-base.</p>' })?.statement, 'Texto-base.\n\nAssinale a correta.');
  });

  it('Certo/Errado: aceita CERTO/ERRADO e as letras C/E', () => {
    const ce = { ...base, tipo: 'CE', alternativas: [{ letra: 'C', texto: 'Certo' }, { letra: 'E', texto: 'Errado' }] };
    assert.equal(toBankQuestion({ ...ce, gabarito: 'ERRADO' })?.correctAnswer, 'E');
    assert.equal(toBankQuestion({ ...ce, gabarito: 'Certo' })?.correctAnswer, 'C');
    assert.equal(toBankQuestion({ ...ce, gabarito: 'C' })?.correctAnswer, 'C');
  });

  it('descarta o que não serve: oculta, sem gabarito, sem alternativas, gabarito fora das alternativas', () => {
    assert.equal(toBankQuestion({ ...base, visivel: false }), null);
    assert.equal(toBankQuestion({ ...base, gabarito: 'N/A' }), null);
    assert.equal(toBankQuestion({ ...base, gabarito: '' }), null);
    assert.equal(toBankQuestion({ ...base, alternativas: null }), null);
    assert.equal(toBankQuestion({ ...base, gabarito: 'D' }), null);
    assert.equal(toBankQuestion({ ...base, ano: null }), null);
  });

  it('órgão e prova vazios viram null', () => {
    const q = toBankQuestion({ ...base, orgao: '', prova: '' });
    assert.equal(q?.organ, null);
    assert.equal(q?.examName, null);
  });
});

describe('normalizações', () => {
  it('dificuldade: muito difícil e difícil são HARD; sem informação é MEDIUM', () => {
    assert.equal(mapDifficulty('Muito Difícil'), 'HARD');
    assert.equal(mapDifficulty('Dificil'), 'HARD');
    assert.equal(mapDifficulty('Fácil'), 'EASY');
    assert.equal(mapDifficulty('Médio'), 'MEDIUM');
    assert.equal(mapDifficulty(null), 'MEDIUM');
    assert.equal(mapDifficulty(''), 'MEDIUM');
  });

  it('nome da banca e gabarito', () => {
    assert.equal(normalizeBoardName('  CESPE / CEBRASPE '), 'CESPE/CEBRASPE');
    assert.equal(normalizeAnswer('x'), null);
    assert.equal(normalizeAnswer(' b '), 'B');
  });
});
