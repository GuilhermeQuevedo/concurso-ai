import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyFriendCode } from './MyFriendCode';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';

describe('MyFriendCode Component (Phase 8 — Batch 2)', () => {
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

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['friend-code'], 'ENGR-9482');
    return client;
  }

  it('should render friend code, nickname reference and WhatsApp share button', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(MyFriendCode)
        )
      )
    );

    assert.ok(html.includes('Seu código de amigo'));
    assert.ok(html.includes('ENGR-9482'));
    assert.ok(html.includes('carlos_estudos'));
    assert.ok(html.includes('Copiar'));
    assert.ok(html.includes('WhatsApp'));
  });

  it('should enforce Fitts Law touch targets on all interactive controls', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(MyFriendCode)
        )
      )
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('text-[#2E8C82]'));
  });
});
