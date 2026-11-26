import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@concurso-ai/types';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import { DashboardLayout } from './DashboardLayout';

const mockAuthContext = {
  user: {
    id: 'user-admin',
    name: 'Administrador Concurso',
    email: 'admin@concurso.ai',
    nickname: 'Admin',
    phone: null,
    avatar: null,
    role: Role.ADMIN,
    targetExam: 'Receita Federal',
    targetRole: 'Auditor',
    dailyGoal: 180,
    emailVerified: true,
    pausedUntil: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  isLoading: false,
  isAuthenticated: true,
  login: async () => {},
  register: async () => {},
  loginWithTokens: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
};

function renderLayout(initialRoute = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderToString(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          MemoryRouter,
          { initialEntries: [initialRoute] },
          React.createElement(
            DashboardLayout,
            null,
            React.createElement('div', { id: 'test-child' }, 'Conteúdo da Página'),
          ),
        ),
      ),
    ),
  );
}

describe('DashboardLayout & Shell (Phase 4 — Batch 1)', () => {
  it('renderiza o skip-link acessível apontando para #main-content', () => {
    const html = renderLayout();

    assert.ok(html.includes('href="#main-content"'));
    assert.ok(html.includes('Pular para o conteúdo principal'));
    assert.ok(html.includes('sr-only focus:not-sr-only'));
  });

  it('renderiza o container com a classe astryx-theme e tokens de superfície em OKLCH', () => {
    const html = renderLayout();

    assert.ok(html.includes('astryx-theme'));
    assert.ok(html.includes('bg-[var(--color-canvas)]'));
    assert.ok(html.includes('text-[var(--color-text-primary)]'));
  });

  it('renderiza navegação lateral com aria-label semântico e área com scroll-mask-y', () => {
    const html = renderLayout();

    assert.ok(html.includes('aria-label="Navegação principal"'));
    assert.ok(html.includes('scroll-mask-y'));
    assert.ok(html.includes('border-[var(--color-border-subtle)]'));
  });

  it('marca o item ativo com aria-current="page" e indicador visual Verde-Revisão', () => {
    const html = renderLayout('/dashboard');

    assert.ok(html.includes('aria-current="page"'));
    assert.ok(html.includes('Visão Geral'));
    assert.ok(html.includes('bg-[var(--color-brand-primary,#2E8C82)]'));
  });

  it('renderiza o conteúdo filho dentro do marco semântico main com foco gerenciável', () => {
    const html = renderLayout();

    assert.ok(html.includes('id="main-content"'));
    assert.ok(html.includes('tabindex="-1"'));
    assert.ok(html.includes('Conteúdo da Página'));
  });
});
