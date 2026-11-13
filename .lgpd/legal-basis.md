# Bases Legais por Atividade de Tratamento — Concurso AI (Engrama)

**Versão**: 1.0  
**Data**: 07/11/2026  
**Auditor**: LGPD Audit Maestro  
**Norma de Referência**: Arts. 7º, 10 e 11 da Lei Federal nº 13.709/2018 (LGPD)  

---

## Árvore de Decisão de Bases Legais Aplicadas

```
Tratamento de Dados no Concurso AI (Engrama)
├── Dados Comuns (Art. 7º)
│   ├── Execução de Contrato (Art. 7º, V)
│   │   ├── A001 (Conta e Autenticação)
│   │   ├── A002 (Google OAuth Sign-in)
│   │   ├── A003 (Sincronização Google Calendar)
│   │   ├── A004 (Correção Pedagógica de Redações via IA)
│   │   ├── A005 (Simulados, Questões e Caderno de Erros)
│   │   ├── A006 (Montagem de Cronograma e Editais)
│   │   ├── A008 (Processamento de Assinaturas e Acesso Pro)
│   │   └── A010 (Disparo de E-mails Transacionais)
│   │
│   ├── Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II)
│   │   └── A008 (Guarda de registros fiscais e tributários — CTN / Lei 8.212/91)
│   │
│   └── Legítimo Interesse do Controlador (Art. 7º, IX)
│       ├── A007 (Gamificação e Ranking Comunitário)
│       ├── A009 (Divulgação para Leads/Contatos sem consentimento expresso)
│       └── A011 (Segurança de Rede e Rate Limiting)
│
└── Dados Potencialmente Sensíveis em Redações Autorais (Art. 11)
    └── Art. 11, II, "d" — Exercício regular de direitos em contrato + Salvaguarda de Anonimização Pedagógica
```

---

## 1. Atividade A001 — Gestão de Conta e Autenticação Local

- **Finalidade**: Permitir acesso autenticado, identificação de autoria nos simulados e gestão da assinatura.
- **Dados Tratados**: Nome, e-mail, telefone, hash bcrypt da senha, avatar, cargo pretendido.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V da LGPD** — Execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular, a pedido do titular dos dados.
- **Justificativa**: Sem identificação e autenticação é impossível individualizar o progresso de estudos, histórico de questões e manter a segurança da conta do aluno.
- **Retenção**: Vigência contratual do serviço + 5 anos após inatividade (guarda prescricional nos termos do Art. 27 do Código de Defesa do Consumidor e Art. 206, § 5º, I do Código Civil).
- **Revogação Possível?**: Não é passível de revogação por não se tratar de consentimento puro, mas o titular tem direito à rescisão contratual e solicitação de eliminação de dados nos limites legais (Art. 18, VI).

---

## 2. Atividade A002 — Autenticação Federada Google OAuth

- **Finalidade**: Simplificar o acesso à plataforma utilizando o provedor Google Identity.
- **Dados Tratados**: Google ID (`sub`), nome, e-mail e URL do avatar fornecido pelo Google.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V da LGPD** — Execução de contrato a pedido do titular.
- **Justificativa**: A opção de login via Google é uma escolha facultativa do titular para agilizar seu acesso.
- **Retenção**: Vinculada ao tempo de manutenção da conta de usuário.
- **Revogação Possível?**: Sim, o usuário pode desvincular a conta Google ou cancelar o cadastro a qualquer momento.

---

## 3. Atividade A003 — Sincronização com Google Calendar

- **Finalidade**: Inserir automaticamente eventos de estudo, simulados e revisões espaçadas na agenda Google Calendar pessoal do aluno.
- **Dados Tratados**: Tokens de acesso e atualização OAuth (`googleAccessToken`, `googleRefreshToken`), ID de calendário, datas de estudo.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V da LGPD** — Execução de contrato a pedido expresso do titular.
- **Justificativa**: O acesso à API do Google só ocorre após clique explícito e consentimento no fluxo OAuth da Google pelo aluno.
- **Retenção**: Até o momento em que o aluno desative a integração no painel ou exclua a conta.
- **Revogação Possível?**: Sim, desativação imediata no painel do Concurso AI ou revogando os privilégios no painel de segurança da conta Google.

---

## 4. Atividade A004 — Correção Automatizada de Redações com IA

- **Finalidade**: Avaliar a estrutura dissertativa, coesão, gramática e domínio temático com base em critérios de bancas (Cespe/Cebraspe, FGV, FCC, etc.).
- **Dados Tratados**: Texto da redação, título, tema, critérios e nota gerada pela IA.
- **Sensíveis?**: Potencialmente, caso o estudante compartilhe experiências íntimas ou visões de mundo de cunho político, filosófico ou de saúde no corpo do texto.
- **Base Legal**: **Art. 7º, V da LGPD** (Execução de contrato de prestação de serviços educacionais) subsidiada por diretrizes de minimização e anonimização pedagógica antes do envio aos provedores de LLM.
- **Justificativa**: A prestação do serviço contratado consiste na correção analítica do texto submetido.
- **Retenção**: Enquanto o estudante mantiver o portfólio de redações ativo para seu histórico de evolução.
- **Revogação Possível?**: O aluno pode apagar suas redações individualmente a qualquer instante.
- **LIA / RIPD**: Exige RIPD específico (`.lgpd/RIPD/ripd-ai-essay-grading.md`) devido ao uso de tecnologias de inteligência artificial de fronteira (Anthropic Claude / Google Gemini).

---

## 5. Atividade A005 — Resolução de Questões, Simulados e Caderno de Erros

- **Finalidade**: Cálculo de estatísticas de retenção, probabilidade de acerto e geração de revisões adaptativas.
- **Dados Tratados**: Alternativas assinaladas, status de acerto/erro, tempo decorrido, anotações de estudo.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V da LGPD** — Execução de contrato.
- **Justificativa**: O núcleo da ferramenta de estudos Engrama é o feedback de desempenho e repetição espaçada.
- **Retenção**: Durante a vigência da conta ou até solicitação de reset via `/api/auth/reset-account` ou DSAR.

---

## 6. Atividade A006 — Mapeamento de Editais e Montagem de Cronograma

- **Finalidade**: Extração de matérias de editais em PDF e alocação dinâmica em grade horária.
- **Dados Tratados**: Arquivo do edital, matérias escolhidas, horas semanais disponíveis.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V da LGPD** — Execução de contrato.
- **Justificativa**: Cumprimento estrito da funcionalidade solicitada pelo aluno.
- **Retenção**: Até a conclusão do ciclo de estudos do concurso alvo ou eliminação pelo aluno.

---

## 7. Atividade A007 — Gamificação, Placares Públicos e Grupos

- **Finalidade**: Engajamento, competição saudável e estudo colaborativo entre candidatos.
- **Dados Tratados**: Nome público/apelido, avatar, pontuação em pontos e dias de ofensiva contínua (streak).
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, IX da LGPD** — Legítimo interesse do controlador (fomento à comunidade e disciplina de estudo).
- **Salvaguardas**: Opção de editar o nome de exibição no perfil para pseudônimo; não divulgação de dados de contato nos rankings; possibilidade de não participar de grupos ou sair a qualquer tempo.
- **Retenção**: Atualizado continuamente conforme os pontos semanais/mensais.

---

## 8. Atividade A008 — Processamento de Pagamentos e Assinaturas (Stripe / Kiwify)

- **Finalidade**: Concretização da contratação da assinatura Engrama Pro e cumprimento das normas de faturamento.
- **Dados Tratados**: Nome completo, e-mail, `stripeCustomerId`, histórico de pagamentos e eventos de assinatura.
- **Sensíveis?**: Não.
- **Base Legal**:
  - Para a transação financeira: **Art. 7º, V da LGPD** (Execução de contrato).
  - Para o arquivamento do histórico fiscal: **Art. 7º, II da LGPD** (Cumprimento de obrigação legal ou regulatória — Código Tributário Nacional, Art. 173/174).
- **Retenção**: 5 anos civis a partir do exercício financeiro seguinte (obrigação fiscal inderrogável).

---

## 9. Atividade A009 — Gestão Administrativa e Importação de Contatos/Leads

- **Finalidade**: Comunicação comercial e avisos sobre novas vagas de concursos públicos.
- **Dados Tratados**: Nome, e-mail, telefone e observações.
- **Sensíveis?**: Não.
- **Base Legal**:
  - Se obtido mediante formulário: **Art. 7º, I da LGPD** (Consentimento).
  - Se obtido em interações institucionais legítimas: **Art. 7º, IX da LGPD** (Legítimo interesse do controlador com expectativa razoável do titular).
- **Salvaguardas Obrigatórias**: Link e mecanismo de descadastramento imediato (opt-out) em 1 clique em qualquer mensagem disparada.
- **Retenção**: Até o opt-out ou 2 anos de inatividade de contato.

---

## 10. Atividade A010 — Envio de E-mails Transacionais (Resend / SMTP)

- **Finalidade**: Enviar links de redefinição de credenciais de acesso e comunicações de serviço.
- **Dados Tratados**: E-mail do destinatário, nome, token com hash.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, V** (Execução de contrato) e **Art. 7º, IX** (Segurança e prevenção a incidentes).
- **Retenção**: Logs operacionais mantidos por 30 dias para auditoria de entrega.

---

## 11. Atividade A011 — Prevenção contra Abuso e Rate Limiting

- **Finalidade**: Bloqueio de ataques de força bruta no login e proteção contra scraping excessivo.
- **Dados Tratados**: Endereço IP e contadores de requisições.
- **Sensíveis?**: Não.
- **Base Legal**: **Art. 7º, IX da LGPD** (Legítimo interesse) cumulado com o **Art. 46** (Dever de adotar medidas de segurança aptas a proteger dados pessoais).
- **Retenção**: 15 minutos em memória / cache Redis volátil.
