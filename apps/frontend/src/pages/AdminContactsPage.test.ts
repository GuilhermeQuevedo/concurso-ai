import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AdminContactsPage } from './AdminContactsPage';
import type { AdminContactsResponse } from '@/features/admin/services/admin.service';

describe('AdminContactsPage Component (Phase 7 — Batch 2)', () => {
  const mockContactsResponse: AdminContactsResponse = {
    contacts: [
      {
        id: 'contact-1',
        name: 'Ana Carolina',
        phone: '+5561988887777',
        email: 'ana@exemplo.com',
        source: 'webinar-policia',
        notes: 'Interesse no concurso da PF',
        isMasked: true,
        unsubscribed: false,
        createdAt: '2026-06-01T10:00:00Z',
      },
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  };

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    client.setQueryData(['admin-contacts', 1], mockContactsResponse);
    return client;
  }

  it('should render page title, LGPD safety notice and import form', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminContactsPage)
        )
      )
    );

    assert.ok(html.includes('Possíveis Clientes &amp; CRM') || html.includes('Possíveis Clientes & CRM'));
    assert.ok(html.includes('Diretriz Regulatória e Anti-Bloqueio'));
    assert.ok(html.includes('Importar contatos (CSV ou Lista)'));
    assert.ok(html.includes('Base Legal (Art. 7º LGPD)'));
    assert.ok(html.includes('Importar Contatos'));
  });

  it('should render group campaign card and contacts table', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminContactsPage)
        )
      )
    );

    assert.ok(html.includes('Campanha do Grupo VIP no WhatsApp'));
    assert.ok(html.includes('Contatos Cadastrados'));
    assert.ok(html.includes('Ana Carolina'));
    assert.ok(html.includes('webinar-policia'));
    assert.ok(html.includes('Convidar'));
  });

  it('should enforce 16px mobile font floor and Fitts Law touch targets', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminContactsPage)
        )
      )
    );

    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
