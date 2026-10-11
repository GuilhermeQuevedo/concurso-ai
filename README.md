# Engrama

> **O que você estuda, fica.**
> Plataforma SaaS de preparação para concursos públicos brasileiros com IA generativa.

Monorepo **pnpm + Turborepo**. Este guia leva você de "acabei de clonar" até a aplicação rodando localmente.

---

## Stack

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, Vite 6, TypeScript 5, React Router 7, TanStack Query 5, TailwindCSS 4, shadcn/ui |
| **Backend** | Node.js 22, Express 5, TypeScript 5, Prisma 6, MySQL 8, JWT (jose), bcrypt, Zod |
| **IA** | Google Gemini (lote) + Claude Sonnet (redação) via interface `IAIProvider` (padrão: `mock`) |
| **Infra** | pnpm, Turborepo, deploy em VPS (PM2 + nginx) — ver [`infra/vps/README.md`](infra/vps/README.md) |

---

## Pré-requisitos

- **Node.js 22+** — https://nodejs.org
- **pnpm 11.9+** — `npm install -g pnpm`
- **MySQL 8.0** rodando localmente (gestão opcional via DBeaver)

---

## Setup (passo a passo)

```bash
# 1. Clonar
git clone https://github.com/GuilhermeQuevedo/concurso-ai.git
cd concurso-ai

# 2. Instalar dependências do monorepo
pnpm install

# 3. Criar o banco no MySQL
#    (via DBeaver ou pelo cliente mysql)
#    CREATE DATABASE concurso_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Configurar variáveis de ambiente do backend
cp .env.example apps/backend/.env
#    Edite apps/backend/.env e ajuste:
#      DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/concurso_ai"
#      JWT_SECRET="um-segredo-aleatorio-de-32+-caracteres"
#    (deixe AI_PROVIDER=mock para desenvolver sem chave de IA)

# 5. Preparar o banco (schema + client + dados de exemplo)
pnpm db:migrate      # cria/atualiza as tabelas
pnpm db:generate     # gera o Prisma Client
pnpm db:seed         # popula dados de exemplo (opcional)

# 6. Rodar tudo em dev (frontend + backend)
pnpm dev
```

- **Frontend:** http://localhost:5173
- **Backend (API):** http://localhost:3333 (o Vite já faz proxy de `/api` para cá)

> As chaves de IA e segredos **nunca** vão no git. Cada pessoa mantém o seu
> `apps/backend/.env` localmente (já ignorado pelo `.gitignore`).

---

## Scripts (na raiz)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Frontend + backend em modo desenvolvimento |
| `pnpm build` | Build de produção de todos os pacotes |
| `pnpm build:deploy` | Gera o bundle de deploy em `deploy/` (backend + frontend) |
| `pnpm lint` | ESLint em todos os pacotes |
| `pnpm format` | Prettier em todo o repositório |
| `pnpm test` | Testes (Vitest) |
| `pnpm db:migrate` | Aplica/gera migrations do Prisma |
| `pnpm db:seed` | Popula dados de exemplo |
| `pnpm db:studio` | Abre o Prisma Studio (inspecionar o banco) |

---

## Estrutura

```
apps/frontend/src/   → Feature-Based Architecture (features/, pages/, components/, hooks/, services/)
apps/backend/src/    → Clean Architecture (controllers/, services/, repositories/, dto/, middlewares/)
packages/shared/     → Constantes e utils compartilhados
packages/types/      → Tipos TypeScript compartilhados
apps/backend/prisma/ → Schema e migrations
infra/vps/           → Scripts de deploy no VPS (setup.sh, update.sh, runbook)
docs/                → PRD, arquitetura, plano de implementação
```

As regras de arquitetura e padrões de código estão em [`CLAUDE.md`](CLAUDE.md).

---

## Fluxo de trabalho em equipe

Para evitar pisar no trabalho um do outro, **não comite direto na `main`**:

```bash
# 1. Sempre partir da main atualizada
git checkout main
git pull

# 2. Criar um branch para a sua tarefa
git checkout -b feat/nome-da-feature

# 3. Commitar e subir o branch
git add .
git commit -m "feat: descrição curta"
git push -u origin feat/nome-da-feature

# 4. Abrir um Pull Request no GitHub, revisar e dar merge na main
```

Convenção de mensagens: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

---

## Deploy

A aplicação roda em um VPS (PM2 + nginx + MySQL). O passo a passo de provisionamento
e atualização está em [`infra/vps/README.md`](infra/vps/README.md).
Resumo da atualização após um merge na `main`:

```bash
bash /opt/engrama/infra/vps/update.sh
```
