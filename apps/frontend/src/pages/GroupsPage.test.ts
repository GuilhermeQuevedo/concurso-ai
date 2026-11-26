import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { GroupsPage } from './GroupsPage';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';
import type { GroupDTO } from '@/features/groups/services/group.service';

describe('GroupsPage Component (Phase 8 — Batch 3)', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Carlos Oliveira',
    email: 'carlos@concurso.ai',
    nickname: 'carlos_estudos',
    phone: null,
    avatar: null,
    role: Role.USER,
    targetExam: 'PF',
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

  const mockGroups: GroupDTO[] = [
    {
      id: 'grp-1',
      name: 'Foco Polícia Federal',
      description: 'Resolução diária de questões',
      code: 'PF2026',
      createdById: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
      myRole: 'ADMIN',
      _count: { members: 8 },
      members: [],
    },
  ];

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['groups'], mockGroups);
    return client;
  }

  it('should render page title, action buttons and groups list', () => {
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
            React.createElement(GroupsPage)
          )
        )
      )
    );

    assert.ok(html.includes('Competição &amp; Grupos de Estudo') || html.includes('Competição & Grupos de Estudo'));
    assert.ok(html.includes('Entrar'));
    assert.ok(html.includes('Criar Grupo'));
    assert.ok(html.includes('Foco Polícia Federal'));
    assert.ok(html.includes('membros'));
  });

  it('should enforce Fitts Law touch targets on action buttons', () => {
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
            React.createElement(GroupsPage)
          )
        )
      )
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
