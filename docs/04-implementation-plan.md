# 04 — Plano de Implementação

## Princípio

Cada fase é implementada completamente antes de avançar. Ao final de cada fase, o sistema deve estar funcional e testável. Nenhuma fase é pulada.

---

## Fase 1 — Estrutura do Projeto

**Objetivo:** Scaffolding completo do monorepo com todas as configurações de tooling.

### Tarefas:

1. Inicializar monorepo com pnpm + Turborepo
2. Criar `apps/frontend` com Vite + React + TypeScript
3. Criar `apps/backend` com Express + TypeScript
4. Criar `packages/shared`, `packages/types`
5. Configurar TailwindCSS + shadcn/ui no frontend
6. Configurar Prisma + schema inicial no backend
7. Configurar Docker Compose (PostgreSQL + pgAdmin)
8. Configurar ESLint + Prettier (config compartilhada)
9. Configurar TypeScript strict mode em todos os packages
10. Criar `.env.example` com todas as variáveis
11. Criar `.gitignore` completo
12. Configurar scripts no turbo.json (dev, build, lint, test)
13. Testar: `pnpm dev` roda frontend e backend simultaneamente

### Critério de Done:
- `pnpm install` funciona sem erros
- `pnpm dev` sobe frontend (localhost:5173) e backend (localhost:3333) simultaneamente
- `pnpm lint` roda sem erros
- `pnpm build` compila sem erros
- Docker Compose sobe PostgreSQL acessível na porta 5432
- Prisma conecta ao banco e roda migrations

---

## Fase 2 — Autenticação

**Objetivo:** Sistema completo de autenticação com JWT + refresh token.

### Tarefas:

1. Implementar entidades User e Session no Prisma
2. Criar DTOs de auth (RegisterDTO, LoginDTO, etc.)
3. Implementar AuthRepository
4. Implementar AuthService (register, login, refresh, logout)
5. Implementar AuthController
6. Criar middlewares: authMiddleware, roleMiddleware
7. Criar rotas: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
8. Implementar error handler global
9. Frontend: páginas de login e cadastro
10. Frontend: contexto de autenticação + interceptor Axios
11. Frontend: rotas protegidas
12. Frontend: página de perfil básica

### Critério de Done:
- Usuário consegue se cadastrar e logar
- JWT expira em 15min, refresh token renova a sessão
- Rotas protegidas bloqueiam acesso sem token
- Frontend persiste sessão e redireciona corretamente

---

## Fase 3 — CRUD de Conteúdos

**Objetivo:** Biblioteca de conteúdos com estrutura hierárquica.

### Tarefas:

1. Implementar entidade Subject (árvore recursiva)
2. Implementar entidade ExamBoard
3. CRUD completo de Subject (com hierarquia pai/filho)
4. CRUD completo de ExamBoard
5. Frontend: página de biblioteca com navegação em árvore
6. Frontend: formulários de criação/edição
7. Painel admin: listagem e gestão de conteúdos

### Critério de Done:
- Admin cria disciplinas com assuntos e subassuntos
- Navegação em árvore funciona com expand/collapse
- Breadcrumb mostra caminho completo

---

## Fase 4 — Integração Gemini

**Objetivo:** Conexão com a API do Gemini via interface abstrata.

### Tarefas:

1. Criar interface IAIProvider
2. Implementar GeminiProvider
3. Implementar MockProvider (para dev/testes)
4. Criar AIService com factory para selecionar provider
5. Definir prompt template para geração de questões
6. Criar endpoint POST /ai/generate (protegido)
7. Validar e parsear resposta JSON do Gemini
8. Tratamento de erros e retry

### Critério de Done:
- Endpoint gera questões via Gemini (ou mock)
- Resposta é JSON válido no formato esperado
- Provider é configurável via env var

---

## Fase 5 — Gerador de Questões

**Objetivo:** Interface completa para gerar questões com configurações.

### Tarefas:

1. Frontend: página de configuração de geração
2. Seleção de disciplina, assunto, subassunto (cascade)
3. Seleção de banca, dificuldade, quantidade, modo
4. Chamada à API com loading state
5. Backend: salvar questões geradas no banco
6. Validação de todas as configurações

### Critério de Done:
- Usuário configura e gera questões
- Questões são salvas e associadas ao assunto/banca
- Loading e error states funcionam

---

## Fase 6 — Resolução de Questões

**Objetivo:** Ambiente de prova para responder questões.

### Tarefas:

1. Frontend: tela de resolução (uma questão por vez)
2. Barra de progresso, cronômetro
3. Navegação entre questões (voltar/próxima)
4. Salvar respostas automaticamente
5. Favoritar questão
6. Marcar para revisão
7. Anotações por questão
8. Backend: endpoint para salvar QuestionAttempt
9. Modo estudo (feedback imediato) vs simulado (correção no final)

### Critério de Done:
- Usuário responde questões em ambiente de prova funcional
- Respostas são salvas no banco com tempo gasto
- Modos estudo e simulado funcionam corretamente

---

## Fase 7 — Correção e Feedback

**Objetivo:** Tela de correção com explicações detalhadas.

### Tarefas:

1. Frontend: tela de resultados
2. Mostrar nota, tempo total, acertos, erros
3. Explicação de cada alternativa (correta e incorretas)
4. Estatísticas por assunto na sessão
5. Backend: endpoint para buscar resultados de uma StudySession
6. Salvar StudySession com métricas agregadas

### Critério de Done:
- Usuário vê correção completa com explicações
- Estatísticas da sessão são calculadas e exibidas

---

## Fase 8 — Dashboard

**Objetivo:** Painel principal com visão geral do desempenho.

### Tarefas:

1. Backend: endpoints de estatísticas agregadas
2. Frontend: dashboard com cards de métricas
3. Gráficos: evolução ao longo do tempo, desempenho por assunto
4. Assuntos fortes e fracos
5. Meta diária com barra de progresso
6. Total de questões, tempo estudado, taxa de acerto

### Critério de Done:
- Dashboard mostra dados reais do usuário
- Gráficos renderizam corretamente
- Performance OK mesmo com volume de dados

---

## Fases 9-15 — Escopo Resumido

| Fase | Escopo | Detalhamento |
| ---- | ------ | ------------ |
| 9    | Importação de PDFs | Upload, extração de texto, associação a subject |
| 10   | IA contextual | Usar conteúdo importado como contexto no prompt |
| 11   | Plano de estudos | Cronograma personalizado baseado em desempenho |
| 12   | Flashcards | Cards de revisão por assunto |
| 13   | Revisão espaçada | Algoritmo SM-2 ou similar |
| 14   | Gamificação | Conquistas, streaks, ranking |
| 15   | Publicação | Deploy, CI/CD, monitoramento |

Essas fases serão detalhadas quando chegarmos nelas.

---

## Dependências entre Fases

```
Fase 1 ─────┬──► Fase 2 ──► Fase 3 ──┬──► Fase 5 ──► Fase 6 ──► Fase 7 ──► Fase 8
             │                        │
             └──► Fase 4 ─────────────┘
                                      │
             Fase 3 ──► Fase 9 ───────┴──► Fase 10
             Fase 8 ──► Fase 11
             Fase 3 ──► Fase 12 ──► Fase 13
             Fase 8 ──► Fase 14
             Todas ──► Fase 15
```
