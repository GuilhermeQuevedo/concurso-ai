# Matriz Consolidada de Gaps LGPD e Status de Remediação — Concurso AI (Engrama)

**Data de Conclusão**: 10 de novembro de 2026  
**Versão**: 2.0 (Pós-Remediação Integral)  
**Responsável**: Engrama Tech Engineering & DPO (`dpo@engrama.com.br`)  
**Status Global**: **100% DOS GAPS REMEDIADOS (13/13 VERIFICADOS EM PRODUÇÃO)**  

---

## 1. Painel de Fechamento de Gaps (Todos Resolvidos)

| # | Dimensão Auditada | Status Anterior | Status Atual | Evidência Técnica da Solução Implementada | Norma LGPD / ANPD |
|---|---|:---:|:---:|---|---|
| **G01** | Base legal documentada por atividade | RED | **GREEN** | Mapeamento formalizado no ROPA (`.lgpd/ROPA.md`), Política de Privacidade e gravação de consentimentos. | Arts. 7º e 11 LGPD |
| **G02** | Registro de Operações (ROPA) | RED | **GREEN** | Documento oficial canônico consolidado em `.lgpd/ROPA.md` cobrindo as 7 operações essenciais. | Art. 37 LGPD |
| **G03** | Endpoints de Exercício de Direitos (DSAR) | RED | **GREEN** | `GET /api/auth/me/export` (JSON estruturado), `POST /api/auth/me/erasure` com anonimização fiscal e cancelamento/anonimização Stripe. | Art. 18, II, V e VI LGPD |
| **G04** | Criptografia de Tokens OAuth em Repouso | RED | **GREEN** | Envelope encryption AES-256-GCM com AAD atrelado ao `userId` e chave de 256 bits (`ENCRYPTION_KEY`). Script de migração idempotente. | Art. 46 LGPD |
| **G05** | Política de Privacidade e Termos Públicos | RED | **GREEN** | Rotas `/politica-de-privacidade`, `/termos-de-uso` e `/politica-de-cookies` no frontend; checkboxes obrigatórios no cadastro. | Art. 9º LGPD |
| **G06** | Designação e Publicação do Canal do DPO | RED | **GREEN** | E-mail `dpo@engrama.com.br` configurado em env, divulgado no portal e exposto no endpoint público `GET /api/privacy/dpo`. | Art. 41 LGPD; Res. CD/ANPD 18/2024 |
| **G07** | Runbook e Registro de Incidentes | RED | **GREEN** | Playbook formal `.lgpd/incident-response-plan.md` (SLA 3 dias úteis), registro de 5 anos em `.lgpd/incidents/log.md` e CLI de reporte. | Art. 48 LGPD; Res. CD/ANPD 15/2024 |
| **G08** | Transferência Internacional e LLMs | RED | **GREEN** | Decorator `PIISanitizerAIProvider`, módulo `ai-pii-redactor.ts` (expurgo de CPF, RG, e-mail, telefone), diretivas anti-OCR e DPAs com Zero Retention. | Arts. 33 a 36 LGPD; Res. 19/2024 |
| **G09** | Políticas de Retenção e Descarte | RED | **GREEN** | `RetentionService`, CLI `run-data-retention-purge.ts`, `AnonymizationService` unificado e política `.lgpd/retention-policy.md`. | Arts. 15 e 16 LGPD; Art. 173 CTN |
| **G10** | Governança na Importação de Contatos | RED | **GREEN** | Validação Zod com base legal obrigatória, notas probatórias ou LIA, tabela `ContactSuppression` (HMAC-SHA256) e opt-out público. | Art. 7º, I e IX; Art. 10 LGPD |
| **G11** | Minimização de Dados (Telefone Opcional) | YELLOW | **GREEN** | Campo `phone` tornado estritamente opcional no backend e frontend; sanitização internacional E.164. | Art. 6º, III LGPD |
| **G12** | Log de Auditoria para Acesso Administrativo | YELLOW | **GREEN** | Tabela `AdminAuditLog` append-only, mascaramento por padrão (`m***l@domain.com`), endpoints de reveal com justificativa obrigatória. | Art. 6º, X e Art. 46 LGPD |
| **G13** | Avaliação Preventiva ECA Digital | YELLOW | **GREEN** | Barreira de declaração no onboarding (`acceptAgeOrGuardian`), minuta de salvaguardas e proibição de perfilização de menores. | Lei nº 15.211/2025; Art. 14 LGPD |

---

## 2. Conclusão da Auditoria
Todos os 13 apontamentos identificados na auditoria preliminar foram tecnicamente remediados, cobertos por testes unitários e de integração automatizados, e documentados nos repositórios oficiais de governança do projeto.
