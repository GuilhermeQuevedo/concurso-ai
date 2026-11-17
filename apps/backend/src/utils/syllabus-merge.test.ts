import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { newTopics } from './syllabus-merge.js';

describe('newTopics', () => {
  const existing = [{ discipline: 'Direito Constitucional', topics: ['Princípios fundamentais', 'Direitos e garantias'] }];

  it('devolve só o que o edital ainda não tem', () => {
    const added = newTopics(existing, [{ discipline: 'Direito Constitucional', topics: ['Direitos e garantias', 'Organização dos poderes'] }]);
    assert.deepEqual(added, [{ discipline: 'Direito Constitucional', topic: 'Organização dos poderes' }]);
  });

  it('ignora acento, maiúsculas e espaços ao comparar', () => {
    const added = newTopics(existing, [{ discipline: 'direito  constitucional', topics: ['PRINCIPIOS FUNDAMENTAIS'] }]);
    assert.deepEqual(added, []);
  });

  it('inclui disciplinas novas', () => {
    const added = newTopics(existing, [{ discipline: 'Informática', topics: ['Redes'] }]);
    assert.deepEqual(added, [{ discipline: 'Informática', topic: 'Redes' }]);
  });

  it('não repete tópicos dentro da própria segunda leitura', () => {
    const added = newTopics([], [{ discipline: 'A', topics: ['x', 'X', 'y'] }]);
    assert.deepEqual(added.map((a) => a.topic), ['x', 'y']);
  });
});
