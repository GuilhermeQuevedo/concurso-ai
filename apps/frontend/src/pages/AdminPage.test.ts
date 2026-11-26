import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AdminPage } from './AdminPage';
import type { AdminOverview, AdminUsersResponse, ManualAccessEntry } from '@/features/admin/services/admin.service';

describe('AdminPage Component (Phase 7 — Batch 1)', () => {
  const mockOverview: AdminOverview = {
    users: { total: 150, newLast7: 12, newLast30: 45 },
    subscriptions: { active: 38 },
    engagement: {
      questionsAnswered: 4320,
      essays: 89,
      flashcards: 1250,
      sessions: 310,
      contests: 5,
    },
    revenue: { receivedCents: 154000, paymentsCount: 38 },
  };

  const mockUsersResponse: AdminUsersResponse = {
    users: [
      {
        id: 'usr-1',
        name: 'Mariana Ramos',
        email: 'mariana@exemplo.com',
        phone: null,
        isMasked: true,
        role: 'USER',
        createdAt: '2026-05-10T10:00:00Z',
        activeSubscriber: true,
        access: null,
        streak: 15,
        questionsAnswered: 450,
        essays: 6,
        flashcards: 180,
        sessions: 40,
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  };

  const mockAccessList: ManualAccessEntry[] = [];

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    client.setQueryData(['admin-overview'], mockOverview);
    client.setQueryData(['admin-users', 1], mockUsersResponse);
    client.setQueryData(['admin-access'], mockAccessList);

    return client;
  }

  it('should render administration title and overview KPI metrics', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminPage)
        )
      )
    );

    assert.ok(html.includes('Administração &amp; Governança') || html.includes('Administração & Governança'));
    assert.ok(html.includes('Usuários Cadastrados'));
    assert.ok(html.includes('150'));
    assert.ok(html.includes('Assinantes Ativos'));
    assert.ok(html.includes('38'));
    assert.ok(html.includes('Questões Resolvidas'));
    assert.ok(html.includes('4320'));
  });

  it('should render users table with column headers and action buttons', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminPage)
        )
      )
    );

    assert.ok(html.includes('Mariana Ramos'));
    assert.ok(html.includes('mariana@exemplo.com'));
    assert.ok(html.includes('ativo'));
    assert.ok(html.includes('Revelar'));
    assert.ok(html.includes('Ação LGPD'));
  });
});
