# Inventário Técnico de Descoberta (Discovery) — Concurso AI (Engrama)

**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro / Antigravity Senior Software Engineer  
**Escopo**: Repositório `concurso-ai` (`apps/backend`, `apps/frontend`, `prisma/schema.prisma`)  

---

## 1. Schema do Banco de Dados (`apps/backend/prisma/schema.prisma`)

Foram identificadas as seguintes entidades que tratam dados pessoais (PII) e comportamentais de titulares:

### 1.1 Model `User` (Identificação Pessoal Primária)
- `id` (String / CUID): Identificador interno primário.
- `name` (String): Nome completo do usuário.
- `email` (String, @unique): E-mail pessoal do titular.
- `phone` (String?): Número de telefone celular coletado obrigatoriamente no frontend de cadastro.
- `password` (String?): Hash bcrypt da senha de acesso local.
- `googleId` (String?, @unique): Identificador OAuth federado da conta Google.
- `avatar` (String?): Imagem de perfil do titular.
- `role` (Enum: `USER`, `ADMIN`): Perfil de acesso administrativo ou aluno.
- `targetExam`, `targetRole`: Interesses de concursos e cargos pretendidos (dados de perfilamento acadêmico/profissional).
- `dailyGoal` (Int): Meta diária de estudos.
- `pausedUntil` (DateTime?): Estado de pausa de estudos.
- `stripeCustomerId` (String?, @unique): Identificador de cliente no Stripe (dado financeiro associado).
- `createdAt`, `updatedAt`: Metadados temporais de auditoria.

### 1.2 Model `Session` & `PasswordResetToken` (Autenticação e Sessão)
- `refreshToken`: Token de longa duração exposto no banco.
- `tokenHash`: Hash SHA-256 do token de recuperação de senha.

### 1.3 Model `UserCalendarIntegration` (Integração Google Calendar)
- `googleAccessToken` (`@db.Text`): **Armazenado em texto plano** sem criptografia de aplicação.
- `googleRefreshToken` (`@db.Text`): **Armazenado em texto plano** sem criptografia de aplicação.
- `googleTokenExpiry`, `googleCalendarId`: Metadados de integração com conta Google pessoal.

### 1.4 Model `Essay` (Redações e Produção Textual do Aluno)
- `title`, `theme`, `content` (`@db.LongText`): Conteúdo autoral da redação submetida pelo candidato.
- `feedback` (`@db.LongText`), `score`: Avaliação automatizada gerada por IA (Claude / Gemini).
- *Alerta LGPD*: Redações podem conter opiniões pessoais, posicionamentos políticos/filosóficos ou relatos de vida inseridos pelo próprio aluno durante a escrita (potencial dado pessoal sensível conforme Art. 5º, II da LGPD).

### 1.5 Model `Contact` (Leads e Contatos de Prospecção)
- `name`, `phone`, `email`, `notes` (`@db.Text`), `source`: Importados manualmente via painel administrativo (`/api/admin/contacts/import`).
- *Alerta LGPD*: Tratamento de contatos sem evidência de consentimento prévio ou teste de legítimo interesse (LIA).

### 1.6 Model `Payment` & `Entitlement` (Assinaturas e Finanças)
- `email`, `amountCents`, `currency`, `provider` (Kiwify / Stripe), `externalRef`, `productId`: Histórico transacional financeiro associado a titular identificado.

### 1.7 Atividades de Estudo e Gamificação
- `QuestionAttempt`, `StudySession`, `Flashcard`, `Document`, `StudyGroup`, `GroupMember`, `TopicReview`, `StudyTask`, `RankingParticipant`, `EditalMap`, `StudySchedule`: Logs de desempenho individual, retenção de conhecimento e materiais carregados.

---

## 2. APIs e Endpoints Expostos

O backend expõe rotas Express em `apps/backend/src/routes/`:
- `POST /api/auth/register`: Cadastro de usuário. Coleta nome, e-mail, telefone e senha.
- `POST /api/auth/login`: Autenticação e geração de JWT.
- `GET /api/auth/google/*`: Fluxo de login e registro via Google OAuth 2.0.
- `GET /api/auth/profile`: Retorna dados do perfil do titular logado.
- `PATCH /api/auth/profile`: Atualização de dados cadastrais.
- `POST /api/auth/reset-account`: Limpa dados de estudo (attempts, essays, sessions), **mas não exclui o cadastro nem exporta os dados**.
- `GET /api/admin/users`: Endpoint restrito que retorna 300 usuários com nomes, e-mails e métricas em lista.
- `POST /api/admin/contacts/import`: Importação em lote de contatos com nome, telefone e e-mail.
- `POST /api/stripe/create-checkout-session`: Envio de nome e e-mail para checkout do Stripe.
- `POST /api/stripe/webhook`: Recepção de webhooks de faturamento do Stripe.

---

## 3. Operadores e Prestadores de Serviços Terceiros (Processadores)

| Fornecedor / Operador | Finalidade | Dados Transferidos | Localização dos Servidores |
|---|---|---|---|
| **Google LLC (Alphabet)** | OAuth 2.0 & Google Calendar Sync | Nome, E-mail, Avatar, Eventos de Agenda, Tokens OAuth | Estados Unidos (Transferência Internacional) |
| **Google LLC (Gemini API)** | Geração de questões e resumos com IA | Textos de editais e comandos de estudo | Estados Unidos (Transferência Internacional) |
| **Anthropic, PBC** | Correção automatizada de redações (`claude-sonnet-5-5`) | Temas, textos autorais de redações e critérios | Estados Unidos (Transferência Internacional) |
| **OpenAI, Inc.** | Geração de conteúdo complementar | Conteúdo de estudo e prompts | Estados Unidos (Transferência Internacional) |
| **Stripe, Inc.** | Processamento de pagamentos e gestão de faturamento | Nome, e-mail, metadados de cartão e endereço de cobrança | Estados Unidos / Irlanda (Transferência Internacional) |
| **Kiwify** | Checkout legado / faturamento webhooks | E-mail, status de pagamento, produto | Brasil |
| **Resend, Inc. / SMTP** | Disparo de e-mails transacionais (reset de senha) | Nome, e-mail, link com token de recuperação | Estados Unidos (Transferência Internacional) |
| **Hospedagem & Nuvem (Vercel / Cloud)** | Infraestrutura frontend e backend | Tráfego HTTP, IPs, logs de requisição | Estados Unidos (Transferência Internacional) |

---

## 4. Análise de Cookies e Rastreamento no Frontend

- Não foram identificados trackers de terceiros intrusivos no repositório (ex.: Google Tag Manager, Meta Pixel, Hotjar ou Clarity não estão embutidos em `index.html` ou `package.json`).
- Autenticação gerida via tokens JWT transitados via Header `Authorization: Bearer` ou `localStorage` de sessão no frontend.
- Ausência de banner de cookies ou central de consentimento de privacidade.

---

## 5. Direitos do Titular (DSAR - Art. 18 LGPD)

- **Confirmação e Acesso**: Parcial via endpoint de perfil (`GET /api/auth/profile`), mas não abrange todo o ecossistema de dados gerados (logs de estudo, redações, transações).
- **Portabilidade**: ❌ **Inexistente**. Não existe endpoint `GET /api/me/export` para exportar dados em formato legível por máquina (JSON/CSV).
- **Eliminação / Esquecimento**: ❌ **Inexistente**. Não existe endpoint `DELETE /api/me` ou `POST /api/me/erasure`. O `/reset-account` apenas esvazia o histórico pedagógico, mantendo a titularidade e o vínculo.
- **Canal de Atendimento**: ❌ **Inexistente**. Não há formulário de contato do titular com o Encarregado nem e-mail institucional destacado.

---

## 6. Governança, Encarregado e Políticas

- Não existe página `/politica-de-privacidade` ou `/termos-de-uso` no frontend `apps/frontend/src/pages/`.
- Não há menção pública ou interna do nome e canal de contato do Encarregado pelo Tratamento de Dados Pessoais (DPO), descumprindo o Art. 41 da LGPD e a Resolução CD/ANPD nº 18/2024.
- Não existem runbooks de incidentes nem histórico formal de registros de segurança (Res. CD/ANPD nº 15/2024).
