import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { groupByArea } from './preset-areas';

const catalog = (id: string, area: string) => ({ id, area, title: id, organization: 'X', description: '', groups: [] });

describe('groupByArea', () => {
  it('junta os editais da mesma área e mantém a ordem', () => {
    const result = groupByArea([catalog('a', 'Educação'), catalog('b', 'Segurança'), catalog('c', 'Educação')]);
    assert.deepEqual(result.map((r) => [r.name, r.catalogs.map((c) => c.id)]), [
      ['Educação', ['a', 'c']],
      ['Segurança', ['b']],
    ]);
  });

  it('sem editais devolve lista vazia', () => {
    assert.deepEqual(groupByArea([]), []);
  });
});
