import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { areaOf, positionOf } from './question-area.js';

describe('positionOf', () => {
  it('usa o ano como âncora, tira o órgão e fica com o cargo', () => {
    assert.equal(positionOf('FGV - 2019 - Prefeitura de Salvador - BA - Assistente Social', 2019, 'Prefeitura de Salvador - BA'), 'Assistente Social');
    assert.equal(positionOf('FMP Concursos - 2015 - MPE-AM - Promotor de Justiça Substituto', 2015, 'MPE-AM'), 'Promotor de Justiça Substituto');
  });

  it('cargo com hífen continua inteiro quando o órgão bate', () => {
    assert.equal(positionOf('IBFC - 2017 - TJ-PE - Analista Judiciário - Assistente Social', 2017, 'TJ-PE'), 'Analista Judiciário - Assistente Social');
  });

  it('banca igual ao órgão (prefeitura que aplica a própria prova)', () => {
    assert.equal(positionOf('Prefeitura de Picos - PI - 2021 - Prefeitura de Picos - PI - Supervisor', 2021, 'Prefeitura de Picos - PI'), 'Supervisor');
  });

  it('órgão da prova diferente do campo órgão: o cargo é o último trecho', () => {
    assert.equal(positionOf('INSTITUTO AOCP - 2016 - CASAN - Assistente Social', 2016, 'CASAN-SC'), 'Assistente Social');
  });

  it('sem prova ou sem o formato esperado, não inventa cargo', () => {
    assert.equal(positionOf('', 2020, 'TJ'), null);
    assert.equal(positionOf(null, 2020, 'TJ'), null);
    assert.equal(positionOf('Outra coisa qualquer', 2020, 'TJ'), null);
    assert.equal(positionOf('FGV - 2020 - TJ', 2020, 'TJ'), null);
  });
});

describe('areaOf', () => {
  it('classifica pelo cargo', () => {
    assert.equal(areaOf('Assistente Social', 'Serviço Social'), 'Assistência Social');
    assert.equal(areaOf('Psicólogo (Secretaria de Assistência Social)', null), 'Assistência Social');
    assert.equal(areaOf('Professor de Ensino Fundamental I', null), 'Educação');
    assert.equal(areaOf('Pedagogo', null), 'Educação');
    assert.equal(areaOf('Advogado - 30H', null), 'Jurídica');
    assert.equal(areaOf('Promotor de Justiça Substituto', null), 'Jurídica');
    assert.equal(areaOf('Agente Comunitário de Saúde', null), 'Saúde');
    assert.equal(areaOf('Técnico em Enfermagem', null), 'Saúde');
    assert.equal(areaOf('Guarda Civil Municipal', null), 'Segurança e Trânsito');
    assert.equal(areaOf('Técnico Administrativo', null), 'Administrativa');
  });

  it('sem cargo, usa a disciplina', () => {
    assert.equal(areaOf(null, 'Serviço Social'), 'Assistência Social');
    assert.equal(areaOf(null, 'Direito Processual Penal'), 'Jurídica');
    assert.equal(areaOf(null, 'Pedagogia'), 'Educação');
    assert.equal(areaOf(null, 'Atualidades'), 'Outras');
  });
});
