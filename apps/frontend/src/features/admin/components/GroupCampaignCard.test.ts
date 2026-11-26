import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GroupCampaignCard } from './GroupCampaignCard';

describe('GroupCampaignCard Component (Phase 7 — Batch 2)', () => {
  it('should render group campaign heading, inputs and strategy banner', () => {
    const html = renderToString(
      React.createElement(GroupCampaignCard, {
        template: 'Olá {nome}, participe do grupo: {link}',
        groupLink: 'https://chat.whatsapp.com/test1234',
        onTemplateChange: () => {},
        onGroupLinkChange: () => {},
      })
    );

    assert.ok(html.includes('Campanha do Grupo VIP no WhatsApp'));
    assert.ok(html.includes('Link de convite do grupo'));
    assert.ok(html.includes('https://chat.whatsapp.com/test1234'));
    assert.ok(html.includes('Mensagem de convite personalizada'));
    assert.ok(html.includes('Estratégia Anti-Bloqueio'));
  });

  it('should enforce 16px mobile font floor and Fitts Law touch targets', () => {
    const html = renderToString(
      React.createElement(GroupCampaignCard, {
        template: 'Convite',
        groupLink: '',
        onTemplateChange: () => {},
        onGroupLinkChange: () => {},
      })
    );

    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('Copiar Link'));
  });
});
