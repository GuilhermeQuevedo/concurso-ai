import { type Router as RouterType, Router } from 'express';
import { env } from '../config/env.js';

export const privacyRouter: RouterType = Router();

/**
 * Endpoint de transparência ativa para divulgação da identidade e canal de contato
 * do Encarregado pelo Tratamento de Dados Pessoais (DPO), conforme determina o
 * Art. 41, § 1º da Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD).
 */
privacyRouter.get('/dpo', (_req, res) => {
  res.json({
    dpo: {
      name: env.DPO_NAME,
      email: env.DPO_EMAIL,
      role: 'Encarregado pelo Tratamento de Dados Pessoais (Art. 41 da LGPD)',
      channelUrl: `${env.APP_URL}/politica-de-privacidade#encarregado`,
      sla: {
        dsarResponseDays: 15,
        securityIncidentHours: 72,
      },
      legalNotice: 'RASCUNHO — PENDENTE DE REVISÃO JURÍDICA',
    },
  });
});
