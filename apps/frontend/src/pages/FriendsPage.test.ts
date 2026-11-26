import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { FriendsPage } from './FriendsPage';
import { AuthContext } from '@/features/auth/contexts/AuthContext';
import type { User } from '@concurso-ai/types';
import { Role } from '@concurso-ai/types';
import type { FriendOverviewDTO } from '@/features/friends/services/friend.service';

describe('FriendsPage Component (Phase 8 — Batch 2)', () => {
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

  const mockOverview: FriendOverviewDTO = {
    friends: [
      {
        friendshipId: 'rel-1',
        user: {
          id: 'user-friend-1',
          name: 'Mariana Souza',
          nickname: 'mari_concurseira',
          level: 16,
          tier: 'Veterano',
        },
      },
    ],
    received: [],
    sent: [],
  };

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['friends'], mockOverview);
    client.setQueryData(['friend-code'], 'ENGR-9482');
    return client;
  }

  it('should render page title, subtitle and both friend code and add form cards', () => {
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
            React.createElement(FriendsPage)
          )
        )
      )
    );

    assert.ok(html.includes('Amigos &amp; Comunidade de Estudos') || html.includes('Amigos & Comunidade de Estudos'));
    assert.ok(html.includes('Seu código de amigo'));
    assert.ok(html.includes('Adicionar amigo'));
  });

  it('should render friends list with friend names and tiers', () => {
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
            React.createElement(FriendsPage)
          )
        )
      )
    );

    assert.ok(html.includes('Mariana Souza'));
    assert.ok(html.includes('mari_concurseira'));
    assert.ok(html.includes('Veterano'));
  });
});
