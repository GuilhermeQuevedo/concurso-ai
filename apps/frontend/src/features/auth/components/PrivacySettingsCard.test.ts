import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { Role } from '@concurso-ai/types';
import { AuthContext } from '../contexts/AuthContext';
import { PrivacySettingsCard } from './PrivacySettingsCard';
import { SettingsPage } from '@/pages/SettingsPage';

const mockAuthContext = {
  user: {
    id: 'user-123',
    name: 'Estudante Concurseiro',
    email: 'estudante@concurso.ai',
    nickname: 'Concurseiro',
    phone: null,
    avatar: null,
    role: Role.USER,
    targetExam: 'Polícia Federal',
    targetRole: 'Agente',
    dailyGoal: 120,
    emailVerified: true,
    pausedUntil: null,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  isLoading: false,
  isAuthenticated: true,
  login: async () => {},
  register: async () => {},
  loginWithTokens: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
};

describe('PrivacySettingsCard & SettingsPage (Phase 3 — Batch 2: Settings & LGPD)', () => {
  it('PrivacySettingsCard deve renderizar direitos LGPD (Art. 18) e opções de exportação e exclusão', () => {
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(PrivacySettingsCard),
        ),
      ),
    );

    assert.ok(html.includes('Privacidade e Dados Pessoais (LGPD)'));
    assert.ok(html.includes('Art. 18 da LGPD'));
    assert.ok(html.includes('Exportação de dados'));
    assert.ok(html.includes('Exportar meus dados'));
    assert.ok(html.includes('Excluir minha conta'));
    assert.ok(html.includes('data-astryx-theme="engrama"'));
  });

  it('SettingsPage deve renderizar perfil do usuário, alternador de modo escuro e seções do sistema', () => {
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(SettingsPage),
        ),
      ),
    );

    assert.ok(html.includes('Configurações'));
    assert.ok(html.includes('Estudante Concurseiro'));
    assert.ok(html.includes('estudante@concurso.ai'));
    assert.ok(html.includes('Modo escuro'));
    assert.ok(html.includes('role="switch"'));
    assert.ok(html.includes('Sobre'));
    assert.ok(html.includes('data-astryx-theme="engrama"'));
  });
});
