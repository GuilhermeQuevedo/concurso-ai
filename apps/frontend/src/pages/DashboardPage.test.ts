import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';
import { DashboardPage } from './DashboardPage';
import { AuthContext } from '../features/auth/contexts/AuthContext';

describe('DashboardPage Component (Phase 6 — Batch 1)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser: User = {
    id: 'user-1',
    name: 'Carlos Oliveira',
    email: 'carlos@concurso.ai',
    nickname: 'carlos',
    phone: null,
    avatar: null,
    role: Role.USER,
    targetExam: 'Polícia Federal',
    targetRole: 'Agente',
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

  it('should render welcome header, stat cards, and action buttons', () => {
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(DashboardPage)
          )
        )
      )
    );

    assert.ok(html.includes('Carlos'));
    assert.ok(html.includes('Questões resolvidas'));
    assert.ok(html.includes('Taxa de acerto'));
    assert.ok(html.includes('Tempo estudado'));
    assert.ok(html.includes('Sessões completadas'));
  });
});
