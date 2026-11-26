import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { NodeActionSatellitesSection } from './NodeActionSatellitesSection';
import type { TopicFocusData } from '../types/map.types';

describe('NodeActionSatellitesSection Component (Phase 5 — Node Action Panel)', () => {
  const mockFocusData: TopicFocusData = {
    topic: {
      id: 'topic-1',
      name: 'Controle de Constitucionalidade',
      slug: 'controle-constitucionalidade',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 3.0,
      x: 150,
      y: 200,
    },
    satellites: {
      dueFlashcards: [
        {
          id: 'card-1',
          front: 'Qual o quórum para ADI?',
          back: 'Maioria absoluta no STF.',
          nextReview: '2026-11-19T00:00:00Z',
        },
      ],
      errorQuestions: [
        {
          id: 'err-1',
          statement: 'Sobre a cláusula de reserva de plenário, assinale a correta.',
          userAnswer: 'Alternativa B',
          isCorrect: false,
          attemptedAt: '2026-11-19T09:00:00Z',
        },
      ],
      connectedTopics: [
        {
          id: 'topic-conn-1',
          name: 'Ações Constitucionais',
          level: 'TOPIC',
          levelLabel: 'Tópico',
          relationType: 'PREREQUISITE',
          relationLabel: 'Pré-requisito',
          direction: 'outgoing',
          evidence: 'Necessário para compreender os remédios constitucionais.',
        },
      ],
      dueFlashcardsTotal: 1,
      errorQuestionsTotal: 1,
    },
  };

  it('deve renderizar as abas de navegação com contadores', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(NodeActionSatellitesSection, {
          focusData: mockFocusData,
          isLoading: false,
          onSelectConnectedTopic: () => {},
        }),
      ),
    );

    assert.ok(html.includes('aria-label="Abas de ações do tópico"'));
    assert.ok(html.includes('Flashcards'));
    assert.ok(html.includes('Caderno de Erros'));
    assert.ok(html.includes('Conexões'));
  });

  it('deve exibir flashcard vencido na aba padrão com botão de ação direta', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(NodeActionSatellitesSection, {
          focusData: mockFocusData,
          isLoading: false,
          onSelectConnectedTopic: () => {},
        }),
      ),
    );

    assert.ok(html.includes('Qual o quórum para ADI?'));
    assert.ok(html.includes('Revisar agora (1)'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
