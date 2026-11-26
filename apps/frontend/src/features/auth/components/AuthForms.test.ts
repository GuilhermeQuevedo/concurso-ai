import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthContext } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

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

describe('Auth Forms & Layout (Phase 3 — Batch 1)', () => {
  it('AuthLayout deve renderizar título, subtítulo e links das políticas LGPD', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(
          AuthLayout,
          { title: 'Entrar na Plataforma', subtitle: 'Acesse seus estudos' },
          React.createElement('div', null, 'Conteúdo do form'),
        ),
      ),
    );

    assert.ok(html.includes('Entrar na Plataforma'));
    assert.ok(html.includes('Acesse seus estudos'));
    assert.ok(html.includes('Termos de Uso'));
    assert.ok(html.includes('Privacidade'));
    assert.ok(html.includes('Cookies'));
    assert.ok(html.includes('data-astryx-theme="engrama"'));
  });

  it('LoginForm deve renderizar campos de e-mail, senha e botão de submissão', () => {
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(LoginForm),
        ),
      ),
    );

    assert.ok(html.includes('id="email"'));
    assert.ok(html.includes('id="password"'));
    assert.ok(html.includes('Entrar'));
    assert.ok(html.includes('Esqueceu sua senha?'));
    assert.ok(html.includes('Cadastre-se'));
    assert.ok(html.includes('cursor-pointer'));
  });

  it('RegisterForm deve renderizar campos cadastrais e consentimentos LGPD desmarcados', () => {
    const html = renderToString(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(RegisterForm),
        ),
      ),
    );

    assert.ok(html.includes('id="name"'));
    assert.ok(html.includes('id="email"'));
    assert.ok(html.includes('id="phone"'));
    assert.ok(html.includes('id="password"'));
    assert.ok(html.includes('id="confirmPassword"'));

    // Checkboxes LGPD obrigatórios
    assert.ok(html.includes('id="acceptTerms"'));
    assert.ok(html.includes('id="acceptPrivacy"'));
    assert.ok(html.includes('id="acceptAgeOrGuardian"'));

    // Garante que nenhum checkbox vem pré-marcado (compliance estrito LGPD)
    assert.ok(!html.includes('id="acceptTerms" checked'));
    assert.ok(!html.includes('id="acceptPrivacy" checked'));
    assert.ok(!html.includes('id="acceptAgeOrGuardian" checked'));

    assert.ok(html.includes('Criar conta'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
