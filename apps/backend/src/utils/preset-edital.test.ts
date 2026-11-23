import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PRESET_CATALOGS } from '../data/editais-prontos/index.js';
import { disciplinesOf, summarizeCatalog, syllabusRowsOf } from './preset-edital.js';

const seedf = PRESET_CATALOGS.find((catalog) => catalog.id === 'seedf-2022');

describe('editais prontos (SEEDF 2022)', () => {
  it('traz os 50 cargos do Anexo IV, sem id repetido', () => {
    assert.ok(seedf);
    assert.equal(seedf.cargos.length, 50);
    assert.equal(new Set(seedf.cargos.map((cargo) => cargo.id)).size, 50);
  });

  it('todo cargo tem conteúdo específico, da carreira e básico, e nenhum tópico vazio', () => {
    assert.ok(seedf);
    for (const cargo of seedf.cargos) {
      const disciplines = disciplinesOf(seedf, cargo);
      assert.ok(disciplines.length >= 5, cargo.id);
      assert.ok(disciplines.every((d) => d.topics.every((t) => t.trim().length > 0)), cargo.id);
    }
  });

  it('professor leva a legislação do magistério; gestor leva a da assistência à educação', () => {
    assert.ok(seedf);
    const professor = seedf.cargos.find((c) => c.id === 'geografia');
    const gestor = seedf.cargos.find((c) => c.id === 'gestor-servico-social');
    assert.ok(professor && gestor);
    const namesOf = (c: typeof professor) => disciplinesOf(seedf, c).map((d) => d.name);
    assert.ok(namesOf(professor).includes('Temas Educacionais e Pedagógicos'));
    assert.ok(!namesOf(professor).includes('Legislação (Assistência à Educação)'));
    assert.ok(namesOf(gestor).includes('Legislação (Assistência à Educação)'));
    assert.ok(!namesOf(gestor).includes('Temas Educacionais e Pedagógicos'));
  });

  it('o conteúdo específico vem primeiro e a ordem dos tópicos é estável', () => {
    assert.ok(seedf);
    const cargo = seedf.cargos.find((c) => c.id === 'sociologia');
    assert.ok(cargo);
    const rows = syllabusRowsOf(seedf, cargo);
    assert.equal(rows[0]?.discipline, 'Conhecimentos Específicos – Sociologia');
    assert.deepEqual(rows.map((r) => r.order), [...rows.map((r) => r.order)].sort((a, b) => a - b));
    assert.ok(rows.every((r) => r.focus));
  });

  it('o resumo agrupa por categoria e conta os tópicos', () => {
    assert.ok(seedf);
    const summary = summarizeCatalog(seedf);
    assert.deepEqual(summary.groups.map((g) => g.name), [
      'Professor de Educação Básica',
      'Pedagogo',
      'Gestor em Políticas Públicas e Gestão Educacional',
    ]);
    const total = summary.groups.flatMap((g) => g.cargos);
    assert.equal(total.length, 50);
    assert.ok(total.every((c) => c.topicCount === c.disciplines.reduce((n, d) => n + d.topicCount, 0)));
  });
});
