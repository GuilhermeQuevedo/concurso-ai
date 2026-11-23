import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { focusOfNewTopic, newTopics } from './syllabus-merge.js';

describe('focusOfNewTopic', () => {
  const existing = [
    { discipline: 'Direito Constitucional', focus: true },
    { discipline: 'Enfermagem', focus: false },
  ];

  it('herda o foco da disciplina que o edital já tem', () => {
    assert.equal(focusOfNewTopic('enfermagem', existing, ['Direito Constitucional']), false);
    assert.equal(focusOfNewTopic('Direito  Constitucional', existing, []), true);
  });

  it('disciplina nova segue a lista de foco da IA', () => {
    assert.equal(focusOfNewTopic('Informática', existing, ['Informatica']), true);
    assert.equal(focusOfNewTopic('Odontologia', existing, ['Informática']), false);
  });

  it('sem lista de foco, disciplina nova é foco', () => {
    assert.equal(focusOfNewTopic('Odontologia', existing, undefined), true);
  });
});

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
