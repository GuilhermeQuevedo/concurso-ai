import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NodeActionHeader } from './NodeActionHeader';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('NodeActionHeader Component (Phase 5 — Node Action Panel)', () => {
  const mockTopic: GraphNode = {
    id: 'topic-1',
    name: 'Atos Administrativos em Espécie',
    slug: 'atos-adm-especie',
    level: 'TOPIC',
    levelLabel: 'Tópico',
    order: 1,
    description: 'Classificação, requisitos e espécies de atos administrativos no Direito Público.',
    parentId: null,
    subjectId: 'sub-1',
    incidenceWeight: 2.5,
    x: 100,
    y: 100,
  };

  const mockMastery: UserTopicMastery = {
    topicId: 'topic-1',
    masteryScore: 82,
    state: 'MASTERED',
    stateLabel: 'Dominado',
    accuracy: 0.85,
    attemptsCount: 20,
    correctCount: 17,
    dueFlashcardsCount: 3,
    priorityScore: 25,
    lastAttemptAt: '2026-11-19T10:00:00Z',
    calculatedAt: '2026-11-19T10:00:00Z',
  };

  it('deve renderizar o título do tópico, nível e incidência na banca-alvo', () => {
    const html = renderToString(
      React.createElement(NodeActionHeader, {
        topic: mockTopic,
        mastery: mockMastery,
        onClose: () => {},
      }),
    );

    assert.ok(html.includes('Atos Administrativos em Espécie'));
    assert.ok(html.includes('Tópico'));
    assert.ok(html.includes('Incidência: 2.5x na banca'));
    assert.ok(html.includes('Classificação, requisitos e espécies'));
  });

  it('deve renderizar o indicador não-cromático acessível e a barra de progresso', () => {
    const html = renderToString(
      React.createElement(NodeActionHeader, {
        topic: mockTopic,
        mastery: mockMastery,
        onClose: () => {},
      }),
    );

    assert.ok(html.includes('Alto domínio: 82%'));
    assert.ok(html.includes('82%'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="82"'));
    assert.ok(html.includes('20 questões respondidas'));
    assert.ok(html.includes('Acurácia: 85%'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
