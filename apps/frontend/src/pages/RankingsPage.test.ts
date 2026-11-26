import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { RankingsPage } from './RankingsPage';
import { AuthContext } from '../features/auth/contexts/AuthContext';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';

describe('RankingsPage Component (Phase 8 — Batch 1)', () => {
  const mockUser: User = {
    id: 'user-admin',
    name: 'Administrador',
    email: 'admin@concurso.ai',
    nickname: 'admin',
    phone: null,
    avatar: null,
    role: Role.ADMIN,
    targetExam: 'Polícia Federal',
    targetRole: 'Perito',
    dailyGoal: 20,
    emailVerified: true,
    pausedUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAuthContext = {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login: async () => {},
    register: async () => {},
    loginWithTokens: async () => {},
    logout: async () => {},
    refreshProfile: async () => {},
  };

  const mockBoards = [
    {
      id: 'board-1',
      title: 'Liga de Elite Constitucional',
      description: 'Competição semanal de questões objetivas.',
      _count: { participants: 42 },
      subject: { name: 'Direito Constitucional' },
    },
  ];

  const mockPending = [
    {
      id: 'pending-1',
      title: 'Liga Penal Especial',
      document: { name: 'Edital PF 2026' },
      createdBy: { name: 'Lucas Santos' },
    },
  ];

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['rankings'], mockBoards);
    client.setQueryData(['rankings', 'pending'], mockPending);
    return client;
  }

  it('should render page title, boards grid and participant count', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(RankingsPage)
          )
        )
      )
    );

    assert.ok(html.includes('Ranking Global &amp; Ligas de Estudo') || html.includes('Ranking Global & Ligas de Estudo'));
    assert.ok(html.includes('Liga de Elite Constitucional'));
    assert.ok(html.includes('Direito Constitucional'));
    assert.ok(html.includes('42'));
    assert.ok(html.includes('participante'));
  });

  it('should render admin moderation panel when admin user is authenticated', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(RankingsPage)
          )
        )
      )
    );

    assert.ok(html.includes('Sugestões aguardando moderação'));
    assert.ok(html.includes('Liga Penal Especial'));
    assert.ok(html.includes('Lucas Santos'));
    assert.ok(html.includes('Aprovar'));
    assert.ok(html.includes('Recusar'));
  });
});
