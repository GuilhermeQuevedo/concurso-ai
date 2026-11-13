# Registro das Operações de Tratamento de Dados Pessoais (ROPA)
### Artigo 37 da Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD)

> [!IMPORTANT]
> **RASCUNHO — PENDENTE DE REVISÃO JURÍDICA**
> Este documento constitui minuta técnica e inventário formal das operações de tratamento de dados pessoais da plataforma **Engrama** (Engrama Tecnologia Educacional Ltda.). Deve ser submetido à revisão e validação jurídica periódica pelo Encarregado pelo Tratamento de Dados Pessoais (DPO) e assessoria legal especializada.

---

## 1. Identificação do Controlador e do Encarregado

| Ator Regulatório | Identificação e Canal de Contato |
| :--- | :--- |
| **Controlador dos Dados** | **Engrama Tecnologia Educacional Ltda.** |
| **Encarregado pelo Tratamento (DPO)** | Comitê de Governança de Dados e Privacidade |
| **Canal Eletrônico Oficial** | `dpo@engrama.com.br` |
| **Portal de Atendimento / Endpoint** | `https://engrama.app/politica-de-privacidade` • `GET /api/privacy/dpo` |
| **Enquadramento Regulatório** | Agente de Tratamento de Pequeno Porte (ATPP — Resolução CD/ANPD nº 2/2022) |

---

## 2. Inventário Sistemático das Operações de Tratamento

```
+----------------------------------------------------------------------------------------------------+
| ID  | OPERAÇÃO DE TRATAMENTO                      | BASE LEGAL PRINCIPAL     | CATEGORIAS DE DADOS |
|-----+---------------------------------------------+--------------------------+---------------------|
| OP01| Gestão de Contas e Autenticação             | Art. 7º, V (Contrato)    | Cadastrais, Auth    |
| OP02| Assinaturas e Processamento Financeiro      | Art. 7º, II e V (Fiscal) | Transacionais, PII  |
| OP03| Tutoria Adaptativa e Simulados via IA       | Art. 7º, V (Contrato)    | Desempenho, Estudo  |
| OP04| Minimização e Redação de PII para LLMs      | Art. 7º, II c/c 6º, III  | Textos Sanitizados  |
| OP05| Importação e Governança de Leads/Contatos   | Art. 7º, I e IX (LIA)    | Contato, Opt-Out    |
| OP06| Trilha de Auditoria Administrativa e Logs   | Art. 7º, IX e 11, II, g  | Logs, IP, Ações     |
| OP07| Atendimento a Direitos do Titular (DSAR)    | Art. 7º, II c/c 18       | Snapshot de Dados   |
+----------------------------------------------------------------------------------------------------+
```

---

### OP-01: Cadastro, Autenticação e Gestão de Perfil do Estudante
* **Finalidade**: Viabilizar o acesso seguro à plataforma, personalização do cronograma de estudos e identificação unívoca da conta.
* **Categorias de Titulares**: Estudantes inscritos e candidatos a concursos públicos.
* **Dados Pessoais Coletados**: Nome completo, endereço de e-mail, hash criptográfico de senha (bcrypt com salt), telefone celular (opcional, sanitizado), foto de perfil (opcional), cargo/edital pretendido e meta diária de estudos.
* **Dados Sensíveis**: Não tratados intencionalmente nesta operação.
* **Salvaguarda de Menores (ECA Digital)**: Declaração obrigatória de maioridade ou assistência legal (`acceptAgeOrGuardian`), com vedação expressa à criação de perfis comportamentais discriminatórios.
* **Base Legal**: Execução de Contrato (Artigo 7º, inciso V da LGPD).
* **Compartilhamento com Operadores**: Google LLC (autenticação federada OAuth2 opcional).
* **Medidas de Segurança**: Senhas em hash bcrypt, controle de taxa de requisições (`rate-limiting`), tokens JWT efêmeros com segredo seguro e revogação dinâmica por `tokenVersion`.
* **Prazo de Retenção e Descarte**: Durante a vigência da relação contratual; eliminação definitiva com cascade no prazo de até 15 dias após solicitação via DSAR (`POST /api/auth/me/erasure`).

---

### OP-02: Gestão de Assinaturas e Histórico Fiscal de Pagamentos
* **Finalidade**: Cobrança de planos recorrentes (mensal, semestral, anual), faturamento, liberação de funcionalidades Pro e emissão de comprovantes contábeis.
* **Categorias de Titulares**: Assinantes pagantes da plataforma Engrama.
* **Dados Pessoais Coletados**: Nome civil, endereço de e-mail de cobrança, identificador de cliente (`stripeCustomerId`), valor da transação, moeda, data e status do pagamento.
* **Dados de Cartão de Crédito**: **NÃO COLETADOS NEM ARMAZENADOS PELO ENGRAMA**. O processamento é efetuado integralmente pelo operador PCI-DSS.
* **Base Legal**: Execução de Contrato (Art. 7º, V) e Cumprimento de Obrigação Legal e Tributária (Art. 7º, II da LGPD c/c Arts. 173 e 174 do Código Tributário Nacional).
* **Compartilhamento com Operadores**: Stripe Inc. (operador financeiro com DPA e certificação PCI-DSS Nível 1).
* **Medidas de Segurança**: Webhooks com assinatura criptográfica (`STRIPE_WEBHOOK_SECRET`), guarda estrita de metadados fiscais e bloqueio de recriação de cadastros eliminados.
* **Prazo de Retenção e Descarte**: 5 (cinco) anos fiscais (Art. 173 CTN). Em caso de solicitação de eliminação de conta, aplica-se a rotina de **anonimização fiscal unificada** (Art. 16, I da LGPD): os dados do cliente no Stripe e no banco local são irreversivelmente substituídos por `Usuário Anonimizado` e `deleted_<uuid>@engrama.internal`.

---

### OP-03: Tutoria Pedagógica, Simulados e Correção de Redações
* **Finalidade**: Fornecimento de métricas analíticas de aprendizagem, geração de simulados adaptativos, cadernos de erros, flashcards e correção automatizada de redações e estudos de caso com espelhos de bancas oficiais.
* **Categorias de Titulares**: Estudantes ativos na plataforma.
* **Dados Pessoais Coletados**: Conteúdo das respostas, textos de redações dissertativas, anotações de estudo, taxas de acerto e tempo de resolução por disciplina.
* **Base Legal**: Execução de Contrato (Artigo 7º, inciso V da LGPD).
* **Compartilhamento com Operadores**: Provedores de Inteligência Artificial contratados comercialmente (OpenAI LLC, Anthropic PBC, Google Gemini, Ollama local).
* **Medidas de Segurança**: Comunicações via HTTPS TLS 1.3, contratos empresariais com cláusula de "Zero Training" (dados não utilizados para treinar modelos públicos).
* **Prazo de Retenção e Descarte**: Enquanto a conta permanecer ativa; expurgo imediato na exclusão da conta.

---

### OP-04: Minimização e Redação de PII no Tráfego para Provedores de IA
* **Finalidade**: Filtragem técnica preventiva para expurgar dados pessoais identificáveis (CPFs, e-mails, telefones, RGs e assinaturas) dos textos de redações e prompts antes de sua transmissão aos servidores das empresas de LLM.
* **Categorias de Titulares**: Usuários submetendo redações, dúvidas e anotações.
* **Dados Pessoais Tratados**: Textos originais são processados em memória pelo decorador `PIISanitizerAIProvider` e biblioteca `ai-pii-redactor.ts`.
* **Base Legal**: Cumprimento de Obrigação Legal (Art. 7º, II c/c Princípio da Minimização - Art. 6º, III da LGPD).
* **Compartilhamento**: Apenas textos desidentificados (`[CPF REDIGIDO]`, `[E-MAIL REDIGIDO]`, `[TELEFONE REDIGIDO]`, `[ESTUDANTE]`) são enviados para a infraestrutura de LLMs.
* **Medidas de Segurança**: Algoritmo de validação de CPF (Módulo 11) com taxa zero de falsos positivos em números de leis/anos, expressões regulares especializadas e diretivas nos system prompts para visão computacional.
* **Prazo de Retenção**: Operação volátil em memória (não persiste dados intermediários).

---

### OP-05: Importação e Governança de Contatos de Candidatos
* **Finalidade**: Gestão de listas de contatos para avisos de editais e comunicados acadêmicos.
* **Categorias de Titulares**: Candidatos e potenciais estudantes.
* **Dados Pessoais Coletados**: Nome, endereço de e-mail e telefone de contato.
* **Bases Legais**:
  1. *Consentimento Livre e Informado* (Art. 7º, I da LGPD) — mediante comprovação de opt-in documental mínimo de 10 caracteres (`consentProofNotes`).
  2. *Legítimo Interesse* (Art. 7º, IX da LGPD) — condicionado à existência de Relatório de Teste de Ponderação / LIA (`legitimateInterestAssessmentRef`).
* **Salvaguardas e Direitos**:
  - Tabela de supressão imutável (`ContactSuppression`) com hash criptográfico HMAC-SHA256 do e-mail.
  - Endpoint público de descadastramento imediato (`POST /api/contacts/opt-out`).
  - Bloqueio automático de importação caso o e-mail esteja na lista de supressão.
* **Prazo de Retenção**: Até a revogação do consentimento ou manifestação de opt-out.

---

### OP-06: Trilha de Auditoria Administrativa e Prevenção a Fraudes
* **Finalidade**: Garantir a rastreabilidade imutável de acessos privilegiados a dados de usuários por operadores administrativos, investigar abusos e cumprir dever de segurança.
* **Categorias de Titulares**: Administradores da plataforma e usuários consultados.
* **Dados Pessoais Tratados**: ID do administrador, ação realizada, recurso acessado, data/hora, justificativa comercial formal e hash criptográfico de IP (HMAC-SHA256). Dados de contato e e-mails são obrigatoriamente mascarados por padrão na listagem (`m***l@domain.com`).
* **Base Legal**: Legítimo Interesse do Controlador (Art. 7º, IX) e Segurança da Informação (Art. 11, II, "g" da LGPD).
* **Compartilhamento**: Sem compartilhamento externo (uso estritamente interno e para eventual fiscalização da ANPD).
* **Medidas de Segurança**: Tabela `AdminAuditLog` append-only (com revogação de permissões SQL de `UPDATE` e `DELETE`), bloqueio automático de vazamento de e-mails em claro nos metadados.
* **Prazo de Retenção**: 1 (um) ano, em conformidade com o Artigo 15 do Marco Civil da Internet (Lei nº 12.965/2014).

---

### OP-07: Atendimento aos Direitos dos Titulares (DSAR — Art. 18 LGPD)
* **Finalidade**: Permitir ao estudante o exercício autônomo, transparente e célere dos seus direitos fundamentais de acesso, portabilidade e eliminação.
* **Categorias de Titulares**: Qualquer usuário cadastrado.
* **Dados Tratados**:
  - `GET /api/auth/me/export`: Gera arquivo interoperável estruturado `engrama-meus-dados.json` contendo histórico completo de estudos, preferências, pagamentos e consentimentos (limitado a 1 req/hora por usuário).
  - `POST /api/auth/me/erasure`: Executa fluxo transacional de cancelamento de assinaturas na Stripe, revogação de tokens Google OAuth, eliminação em cascata ou anonimização fiscal contábil, e registro no disaster recovery log `ErasureLog` (com chave hash SHA-256 do usuário).
* **Base Legal**: Cumprimento de Obrigação Legal (Artigo 7º, II c/c Artigo 18 da LGPD).
* **SLA de Resposta**: Atendimento imediato em autoatendimento ou em até 15 (quinze) dias para solicitações complexas via canal do DPO.
* **Prazo de Retenção dos Logs de Exclusão**: Log imutável `ErasureLog` com hash criptográfico mantido para comprovação perante a ANPD.

---

## 3. Revisão e Governança Contínua

Este inventário deve ser revisado:
1. Sempre que uma nova funcionalidade que trate dados pessoais for desenvolvida na plataforma;
2. Quando houver alteração ou adição de fornecedor/operador em nuvem;
3. No prazo máximo de 12 (doze) meses a contar da sua última formalização.
