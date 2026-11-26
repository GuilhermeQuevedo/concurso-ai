import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@concurso-ai/types';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import { ActiveStudyProvider } from '@/features/active-study/ActiveStudyProvider';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppHeader } from './AppHeader';
import { PomodoroMini } from '@/features/pomodoro/PomodoroMini';

const mockAuthContext = {
  user: {
    id: 'user-test',
    name: 'Estudante Concurso',
    email: 'estudante@concurso.ai',
    nickname: 'Estudante',
    phone: null,
    avatar: null,
    role: Role.USER,
    targetExam: 'Polícia Federal',
    targetRole: 'Agente',
    dailyGoal: 120,
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

function renderWithProviders(children: React.ReactNode, route = '/mapa') {
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
          ActiveStudyProvider,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: [route] },
            children,
          ),
        ),
      ),
    ),
  );
}

describe('Layout Header & Quick Controls (Phase 4 — Batch 2)', () => {
  describe('AppBreadcrumbs', () => {
    it('renderiza a trilha correta para o Mapa de Revisão', () => {
      const html = renderWithProviders(React.createElement(AppBreadcrumbs), '/mapa');

      assert.ok(html.includes('Trilha de navegação'));
      assert.ok(html.includes('Início'));
      assert.ok(html.includes('Planejamento'));
      assert.ok(html.includes('Mapa de Revisão'));
    });

    it('renderiza apenas Início para a rota raiz do painel', () => {
      const html = renderWithProviders(React.createElement(AppBreadcrumbs), '/dashboard');

      assert.ok(html.includes('Início'));
      assert.ok(!html.includes('Mapa de Revisão'));
    });
  });

  describe('AppHeader', () => {
    it('renderiza o cabeçalho com alvos móveis mínimos e botão de menu lateral', () => {
      const html = renderWithProviders(
        React.createElement(AppHeader, { onOpenSidebar: () => {} }),
        '/mapa',
      );

      assert.ok(html.includes('aria-label="Abrir menu lateral"'));
      assert.ok(html.includes('min-h-[44px]'));
      assert.ok(html.includes('Acessar perfil de usuário'));
    });
  });

  describe('PomodoroMini', () => {
    it('não quebra durante a renderização no SSR quando não há sessão ativa', () => {
      const html = renderWithProviders(React.createElement(PomodoroMini), '/mapa');
      // Quando não há pomodoro ativo no store, retorna vazio sem exceção
      assert.equal(typeof html, 'string');
    });
  });
});
