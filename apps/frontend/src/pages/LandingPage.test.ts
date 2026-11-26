import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { LandingPage } from './LandingPage';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';

describe('LandingPage Component (Phase 9 — Batch 2)', () => {
  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['stripe-config'], { isConfigured: true });
    return client;
  }

  const mockUser: User = {
    id: 'user-1',
    name: 'Ana Concurseira',
    email: 'ana@engrama.ai',
    nickname: 'ana_aprovada',
    phone: null,
    avatar: null,
    role: Role.USER,
    targetExam: 'Receita Federal',
    targetRole: 'Auditor',
    dailyGoal: 25,
    emailVerified: true,
    pausedUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => {},
    register: async () => {},
    loginWithTokens: async () => {},
    logout: async () => {},
    refreshProfile: async () => {},
  };

  it('should render brand hero, value proposition, metric stats and navigation', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(LandingPage)
          )
        )
      )
    );

    assert.ok(html.includes('Engrama'));
    assert.ok(html.includes('O que você estuda,'));
    assert.ok(html.includes('fica.'));
    assert.ok(html.includes('Ver Planos e Começar'));
    assert.ok(html.includes('+15.000'));
    assert.ok(html.includes('98%'));
    assert.ok(html.includes('Garantia Incondicional de 7 Dias'));
  });

  it('should render pricing plans, features list and FAQ accordions with Fitts Law compliance', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(LandingPage)
          )
        )
      )
    );

    assert.ok(html.includes('Plano Mensal'));
    assert.ok(html.includes('Plano Semestral'));
    assert.ok(html.includes('Plano Anual'));
    assert.ok(html.includes('Perguntas Frequentes'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });

  it('should render dashboard access button when user is authenticated', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          AuthContext.Provider,
          { value: { ...mockAuthContext, user: mockUser, isAuthenticated: true } },
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(LandingPage)
          )
        )
      )
    );

    assert.ok(html.includes('Acessar Plataforma'));
  });
});
