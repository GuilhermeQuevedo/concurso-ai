import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filterPresetGroups } from './filter-presets';

const cargo = (id: string, label: string) => ({ id, label, name: label, cargoCode: 'Cargo 1', topicCount: 1, disciplines: [] });
const groups = [
  { name: 'Professor', cargos: [cargo('a', 'Professor de Matemática'), cargo('b', 'Professor de Filosofia')] },
  { name: 'Gestor', cargos: [cargo('c', 'Gestor em Economia')] },
];

describe('filterPresetGroups', () => {
  it('sem texto devolve tudo', () => {
    assert.equal(filterPresetGroups(groups, '  '), groups);
  });

  it('ignora acento e maiúsculas e remove categorias vazias', () => {
    const result = filterPresetGroups(groups, 'MATEMATICA');
    assert.deepEqual(result.map((g) => g.cargos.map((c) => c.id)), [['a']]);
  });

  it('sem resultado devolve lista vazia', () => {
    assert.deepEqual(filterPresetGroups(groups, 'zzz'), []);
  });
});
