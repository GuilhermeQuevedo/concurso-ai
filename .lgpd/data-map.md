# Mapa de Dados Pessoais (Data Mapping) — Concurso AI (Engrama)

**Versão**: 1.0  
**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Owner Global**: Encarregado de Proteção de Dados (DPO) / Engrama Tech  
**Norma de Referência**: Art. 37 da Lei Federal nº 13.709/2018 (Registro de Tratamento)  

---

## Sumário de Atividades Mapeadas

1. [A001 — Gestão de Conta e Autenticação Local](#a001--gestão-de-conta-e-autenticação-local)
2. [A002 — Autenticação Federada Google OAuth](#a002--autenticação-federada-google-oauth)
3. [A003 — Sincronização com Google Calendar](#a003--sincronização-com-google-calendar)
4. [A004 — Correção Automatizada de Redações com IA](#a004--correção-automatizada-de-redações-com-ia)
5. [A005 — Resolução de Questões, Simulados e Caderno de Erros](#a005--resolução-de-questões-simulados-e-caderno-de-erros)
6. [A006 — Mapeamento de Editais e Montagem de Cronograma](#a006--mapeamento-de-editais-e-montagem-de-cronograma)
7. [A007 — Gamificação, Placares Públicos e Grupos](#a007--gamificação-placares-públicos-e-grupos)
8. [A008 — Processamento de Pagamentos e Assinaturas (Stripe / Kiwify)](#a008--processamento-de-pagamentos-e-assinaturas-stripe--kiwify)
9. [A009 — Gestão Administrativa e Importação de Contatos/Leads](#a009--gestão-administrativa-e-importação-de-contatosleads)
10. [A010 — Envio de E-mails Transacionais (Resend / SMTP)](#a010--envio-de-e-mails-transacionais-resend--smtp)
11. [A011 — Prevenção contra Abuso e Rate Limiting (Redis / In-Memory)](#a011--prevenção-contra-abuso-e-rate-limiting-redis--in-memory)

---

## Detalhamento das Atividades de Tratamento

### A001 — Gestão de Conta e Autenticação Local

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a001-account-management` |
| **Descrição** | Cadastro, login, gerenciamento de perfil, metas e sessões do concurseiro. |
| **Finalidade Específica** | Permitir o acesso autenticado, customização do plano e uso contínuo da plataforma. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato de prestação de serviços educacionais ([detalhes](./legal-basis.md#a001)). |
| **Categorias de Titulares** | Alunos/usuários cadastrados (adultos e eventuais estudantes com mais de 16 anos). |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Nome completo, endereço de e-mail, número de telefone, hash da senha (bcrypt), foto/avatar, cargo pretendido, meta diária. |
| **Fonte / Origem** | Fornecido diretamente pelo titular no momento do registro e edição de perfil. |
| **Sistemas de Armazenamento** | Tabelas MySQL `User`, `Session`, `PasswordResetToken`. |
| **Operadores Envolvidos** | Provedor de hospedagem em nuvem (Vercel / Cloud Database). |
| **Transferência Internacional** | Sim — Servidores de nuvem localizados nos Estados Unidos. |
| **Prazo de Retenção** | Durante a vigência da conta + 5 anos após exclusão (prescrição CDC Art. 27 e CC Art. 206, § 5º, I). |
| **Medidas de Segurança** | Hashing com bcrypt salt 12, tokens JWT de curta duração (15m), HTTPS/TLS 1.3, RBAC. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Core / Tech Lead |

---

### A002 — Autenticação Federada Google OAuth

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a002-google-oauth` |
| **Descrição** | Autenticação e provisionamento de conta simplificado via Google Sign-In. |
| **Finalidade Específica** | Facilitar o login rápido e verificação de identidade federada do usuário. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato a pedido do titular. |
| **Categorias de Titulares** | Usuários optantes pelo login social Google. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Google ID (`sub`), nome, endereço de e-mail, URL do avatar. |
| **Fonte / Origem** | Google Identity Services (sob autorização do titular no popup/redirect). |
| **Sistemas de Armazenamento** | Tabela MySQL `User` (campos `googleId`, `email`, `name`, `avatar`). |
| **Operadores Envolvidos** | Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, EUA). |
| **Transferência Internacional** | Sim — Estados Unidos (ver `.lgpd/vendors/google.md`). |
| **Prazo de Retenção** | Vinculado ao ciclo de vida da conta do usuário. |
| **Medidas de Segurança** | Troca de código de autorização segura via backend, verificação de audiência de ID token. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Auth |

---

### A003 — Sincronização com Google Calendar

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a003-google-calendar-sync` |
| **Descrição** | Agendamento automatizado de metas de estudo e revisões na agenda pessoal Google. |
| **Finalidade Específica** | Integrar o plano de estudo e revisões espaçadas ao calendário do candidato. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato a pedido expresso do titular. |
| **Categorias de Titulares** | Usuários que ativarem voluntariamente a integração de calendário. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | `googleAccessToken`, `googleRefreshToken`, data de expiração, ID do calendário, títulos e horários de estudos. |
| **Fonte / Origem** | Autorização concedida via escopo `https://www.googleapis.com/auth/calendar.events`. |
| **Sistemas de Armazenamento** | Tabela MySQL `UserCalendarIntegration`. |
| **Operadores Envolvidos** | Google LLC (EUA). |
| **Transferência Internacional** | Sim — Estados Unidos. |
| **Prazo de Retenção** | Até a revogação da integração pelo usuário ou exclusão da conta. |
| **Medidas de Segurança** | Requer implementação urgente de criptografia em repouso AES-256-GCM (Gap G04). |
| **Alto Risco?** | **Sim** (manipulação de tokens de acesso com privilégio em conta externa do titular). |
| **RIPD** | Recomendado pelo risco residual de credenciais de terceiros. |
| **Owner** | Squad Integrations |

---

### A004 — Correção Automatizada de Redações com IA

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a004-ai-essay-grading` |
| **Descrição** | Submissão de textos de redação dissertativa ou estudo de caso para correção e atribuição de nota por LLM. |
| **Finalidade Específica** | Fornecer feedback pedagógico pormenorizado, apontar desvios gramaticais e estimar pontuação na banca pretendida. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato. |
| **Categorias de Titulares** | Alunos que submetem redações para correção. |
| **Dados Sensíveis?** | **Potencial** — Dependendo do tema ou relato autoral do aluno, o texto pode conter opiniões políticas, religiosas ou dados de saúde. |
| **Categorias de Dados** | Conteúdo textual da redação (`@db.LongText`), tema, banca examinadora, nota atribuída, feedback descritivo. |
| **Fonte / Origem** | Texto digitado ou arquivo enviado pelo aluno. |
| **Sistemas de Armazenamento** | Tabela MySQL `Essay`, storage de uploads. |
| **Operadores Envolvidos** | Anthropic PBC (Claude API), Google LLC (Gemini API), OpenAI Inc. |
| **Transferência Internacional** | Sim — Estados Unidos. |
| **Prazo de Retenção** | Enquanto a conta estiver ativa ou até exclusão voluntária pelo aluno. |
| **Medidas de Segurança** | Transporte cifrado (TLS 1.3), prompts restritos a critérios técnicos, direito de revisão (Art. 20). |
| **Alto Risco?** | **Sim** — Avaliação automatizada de perfil e desempenho por IA (critério cumulativo de tecnologia emergente). |
| **RIPD** | **Obrigatório** (`.lgpd/RIPD/ripd-ai-essay-grading.md`). |
| **Owner** | Squad AI Pedagogical |

---

### A005 — Resolução de Questões, Simulados e Caderno de Erros

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a005-questions-simulator` |
| **Descrição** | Histórico de questões respondidas, cálculo de taxa de acerto, tempo por item e caderno de erros. |
| **Finalidade Específica** | Permitir o treino contínuo, geração de simulados adaptativos e revisão de pontos fracos. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato. |
| **Categorias de Titulares** | Usuários ativos. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Respostas assinaladas, status de acerto/erro, tempo de resposta em segundos, anotações de estudo, questões favoritas. |
| **Fonte / Origem** | Ações de estudo geradas e observadas na plataforma. |
| **Sistemas de Armazenamento** | Tabelas MySQL `QuestionAttempt`, `StudySession`, `Favorite`, `Note`, `QuestionSet`. |
| **Operadores Envolvidos** | Nenhum operador externo além da nuvem principal de hospedagem. |
| **Transferência Internacional** | Sim — Servidores do banco de dados na nuvem. |
| **Prazo de Retenção** | Durante a atividade da conta; expurgo solicitado via DSAR. |
| **Medidas de Segurança** | Chaves estrangeiras com `onDelete: Cascade` vinculadas ao `userId`. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Pedagógico |

---

### A006 — Mapeamento de Editais e Montagem de Cronograma

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a006-edital-and-schedule` |
| **Descrição** | Upload de editais em PDF, extração de conteúdos e geração de rotina personalizada de estudo. |
| **Finalidade Específica** | Organizar o ciclo de estudos do candidato até a data prevista da prova do concurso. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato. |
| **Categorias de Titulares** | Candidatos inscritos. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Documentos carregados (`Document`), data pretendida de concurso, horas diárias de disponibilidade, árvore de matérias priorizadas. |
| **Fonte / Origem** | Informado diretamente pelo aluno e extraído dos PDFs de editais. |
| **Sistemas de Armazenamento** | Tabelas MySQL `EditalMap`, `StudySchedule`, `Contest`, `StudyTask`, `Document`. |
| **Operadores Envolvidos** | Modelos de IA para parsing estruturado de editais. |
| **Transferência Internacional** | Sim — Estados Unidos (inferência de IA). |
| **Prazo de Retenção** | Ciclo de vida da conta ou término do concurso. |
| **Medidas de Segurança** | Validação estrita de mimetype de PDF, sanitização de texto. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Pedagógico |

---

### A007 — Gamificação, Placares Públicos e Grupos

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a007-gamification-and-rankings` |
| **Descrição** | Ranking de alunos por pontuação em simulados, grupos de estudo compartilhados e ofensivas (streaks). |
| **Finalidade Específica** | Estimular a consistência de estudos por meio de mecânicas de engajamento social. |
| **Base Legal** | Art. 7º, IX da LGPD — Legítimo interesse do controlador (fomento à disciplina) / Execução de contrato. |
| **Categorias de Titulares** | Usuários que optam por participar de grupos e rankings abertos. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Nome de exibição, foto/avatar, pontuação acumulada, posição na classificação, ofensiva de dias seguidos. |
| **Fonte / Origem** | Derivado das atividades de resolução de questões do aluno. |
| **Sistemas de Armazenamento** | Tabelas MySQL `RankingBoard`, `RankingParticipant`, `Streak`, `Achievement`, `StudyGroup`, `GroupMember`. |
| **Operadores Envolvidos** | Servidores de aplicação. |
| **Transferência Internacional** | Sim — Hospedagem internacional. |
| **Prazo de Retenção** | Enquanto durar a edição do ranking ou participação no grupo. |
| **Medidas de Segurança** | Controle de visualização restrito a membros autenticados; possibilidade de usar pseudônimo/avatar neutro. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado (sujeito a LIA simples). |
| **Owner** | Squad Gamificação |

---

### A008 — Processamento de Pagamentos e Assinaturas (Stripe / Kiwify)

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a008-billing-and-payments` |
| **Descrição** | Processamento de transações financeiras de aquisição de assinaturas mensal, semestral e anual. |
| **Finalidade Específica** | Cobrança de mensalidade, concessão de acesso ao plano Engrama Pro e emissão de comprovantes fiscais. |
| **Base Legal** | Art. 7º, V (Execução de contrato) e Art. 7º, II (Obrigação legal fiscal e tributária). |
| **Categorias de Titulares** | Clientes assinantes. |
| **Dados Sensíveis?** | Não (dados financeiros comuns, protegidos por sigilo bancário). |
| **Categorias de Dados** | Nome completo, endereço de e-mail, identificador de cliente Stripe (`stripeCustomerId`), valor pago, moeda, método de pagamento, status de faturamento. |
| **Fonte / Origem** | Informado pelo usuário no checkout hospedado seguro do Stripe. |
| **Sistemas de Armazenamento** | Tabelas MySQL `Payment`, `Entitlement`, logs de webhooks Stripe. |
| **Operadores Envolvidos** | Stripe, Inc. (510 Townsend St, San Francisco, CA 94103, EUA); Kiwify Tecnologia Ltda (Brasil). |
| **Transferência Internacional** | Sim — Stripe (EUA / Irlanda) sob certificação PCI-DSS Nível 1. |
| **Prazo de Retenção** | **5 anos** a contar do primeiro dia do exercício seguinte (Código Tributário Nacional, Art. 173-174). |
| **Medidas de Segurança** | Criptografia ponta a ponta no checkout, tokenização PCI-DSS, verificação de assinatura de webhook (`STRIPE_WEBHOOK_SECRET`). |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Financeiro / Squad Billing |

---

### A009 — Gestão Administrativa e Importação de Contatos/Leads

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a009-leads-and-contacts` |
| **Descrição** | Cadastro e importação de listas de contatos no painel administrativo para divulgação. |
| **Finalidade Específica** | Comunicação institucional, avisos sobre abertura de editais e ofertas de cursos. |
| **Base Legal** | Art. 7º, I (Consentimento prévio) OU Art. 7º, IX (Legítimo interesse com opt-out imediato). |
| **Categorias de Titulares** | Prospects, interessados em concursos públicos. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Nome, número de telefone celular, endereço de e-mail, notas descritivas, canal de origem (`source`). |
| **Fonte / Origem** | Inserido manualmente por administradores via `/api/admin/contacts/import`. |
| **Sistemas de Armazenamento** | Tabela MySQL `Contact`. |
| **Operadores Envolvidos** | Equipe de gestão interna. |
| **Transferência Internacional** | Não (banco de dados em nuvem). |
| **Prazo de Retenção** | Até manifestação de descadastramento (opt-out) ou 2 anos de inatividade. |
| **Medidas de Segurança** | Rota protegida exclusivamente para a role `ADMIN`. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado (exige teste de legítimo interesse LIA se não houver consentimento expresso). |
| **Owner** | Squad Marketing & Growth |

---

### A010 — Envio de E-mails Transacionais (Resend / SMTP)

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a010-transactional-emails` |
| **Descrição** | Disparo de mensagens de redefinição de senha, confirmação de assinatura e alertas de sistema. |
| **Finalidade Específica** | Notificar o usuário sobre eventos críticos da sua conta e permitir recuperação de acesso. |
| **Base Legal** | Art. 7º, V da LGPD — Execução de contrato e suporte operacional. |
| **Categorias de Titulares** | Usuários cadastrados solicitantes de reset de senha. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Nome, endereço de e-mail destinatário, token de recuperação com hash e validade de 30 minutos. |
| **Fonte / Origem** | Solicitado pelo titular na página `/forgot-password`. |
| **Sistemas de Armazenamento** | Tabela `PasswordResetToken` (token expira e é descartado após consumo). |
| **Operadores Envolvidos** | Resend, Inc. (EUA) / Provedor SMTP configurado. |
| **Transferência Internacional** | Sim — Estados Unidos (Resend API). |
| **Prazo de Retenção** | Tokens expiram em 30 minutos; logs de envio retidos por 30 dias. |
| **Medidas de Segurança** | Tokens com entropia criptográfica (32 bytes random) salvos exclusivamente como SHA-256 hash. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Infra & Security |

---

### A011 — Prevenção contra Abuso e Rate Limiting (Redis / In-Memory)

| Campo | Descrição / Valor |
|---|---|
| **Slug** | `a011-security-rate-limiting` |
| **Descrição** | Monitoramento de requisições por IP e bloqueio temporário de tentativas consecutivas de autenticação falha. |
| **Finalidade Específica** | Proteger contas de usuários contra ataques de força bruta, credential stuffing e negação de serviço. |
| **Base Legal** | Art. 7º, IX (Legítimo interesse na segurança de seus sistemas) e Art. 46 (Dever de segurança técnica). |
| **Categorias de Titulares** | Visitantes e usuários enviando tráfego às rotas da API. |
| **Dados Sensíveis?** | Não. |
| **Categorias de Dados** | Endereço IP de origem, contador de tentativas falhas, e-mail alvo de tentativa de login. |
| **Fonte / Origem** | Cabeçalhos de rede TCP/IP observados nas requisições HTTP. |
| **Sistemas de Armazenamento** | Memória volátil (`Map` em Node.js com TTL de 15 minutos) e Redis. |
| **Operadores Envolvidos** | Nenhum (processamento em borda/servidor próprio). |
| **Transferência Internacional** | Não. |
| **Prazo de Retenção** | 15 minutos (tempo de vida útil do bloqueio temporário). |
| **Medidas de Segurança** | Limpeza automática em memória (`cleanupOldRecords`), amortecimento de respostas timing. |
| **Alto Risco?** | Não. |
| **RIPD** | Dispensado. |
| **Owner** | Squad Infra & Security |

---

## Síntese de Auditoria do Mapeamento

- **Total de Atividades Inventariadas**: 11 atividades.
- **Atividades com Dados Potencialmente Sensíveis**: 1 (A004 — Redações com relatos subjetivos dos alunos).
- **Atividades de Alto Risco / Exigência de RIPD**: 2 (A003 — Tokens OAuth de terceiros e A004 — Avaliação por IA).
- **Atividades com Transferência Internacional de Dados**: 6 (A001, A002, A003, A004, A008, A010).
- **Atividades envolvendo Potenciais Menores (ECA Digital)**: A001, A004, A005 (estudantes de ensino médio / vestibulares / concursos de carreira militar).
