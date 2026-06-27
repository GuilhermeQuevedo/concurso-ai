# CLAUDE.md — Regras de Desenvolvimento do Concurso AI

## Projeto

Plataforma SaaS para preparação de concursos públicos brasileiros com IA generativa.
Monorepo com pnpm + Turborepo.

## Stack

- **Frontend:** React 19, Vite 6, TypeScript 5, React Router 7, TanStack Query 5, Axios, TailwindCSS 4, shadcn/ui, Lucide Icons, React Hook Form 7, Zod 3
- **Backend:** Node.js 22, Express 5, TypeScript 5, Prisma 6, PostgreSQL 17, jose (JWT), bcrypt, Helmet, cors, express-rate-limit, Zod 3
- **IA:** Google Gemini API (via interface abstrata IAIProvider)
- **Monorepo:** pnpm, Turborepo
- **Banco:** PostgreSQL 17 via Docker Compose
- **Testes:** Vitest

## Estrutura

```
apps/frontend/src/   → Feature-Based Architecture (features/, pages/, components/, hooks/, services/, layouts/)
apps/backend/src/    → Clean Architecture (controllers/, services/, repositories/, dto/, entities/, interfaces/, middlewares/)
packages/shared/     → Constantes e utils compartilhados
packages/types/      → Tipos TypeScript compartilhados
prisma/              → Schema e migrations
docker/              → Docker Compose
docs/                → Documentação (PRD, arquitetura, plano)
```

## Padrões Obrigatórios

- Clean Architecture: Controller → Service → Repository → Prisma
- Controllers são finos: recebem HTTP, extraem params, delegam para Service
- Services contêm lógica de negócio, não conhecem HTTP nem Prisma
- Repositories encapsulam queries Prisma, sem lógica de negócio
- DTOs validados com Zod em todos os inputs
- Interface para cada dependência externa (IAIProvider, IRepository, etc.)
- SOLID, DRY, KISS rigorosamente

## Regras de Código

- TypeScript strict mode em todos os packages
- **Nunca** usar `any` — usar `unknown` + type guard quando necessário
- **Nunca** duplicar código — extrair para shared/utils
- **Nunca** criar funções com mais de 40 linhas — dividir
- **Nunca** criar arquivos com mais de 300 linhas — separar responsabilidades
- Sem comentários, exceto quando o "porquê" não é óbvio
- Naming: camelCase para variáveis/funções, PascalCase para tipos/classes/componentes, UPPER_SNAKE para constantes
- Imports: externos primeiro, depois internos, separados por linha em branco
- Exports: named exports (não default), exceto para páginas React

## Frontend

- Feature-Based Architecture: cada feature tem seus components/, hooks/, services/, types.ts
- Componentes compartilhados em src/components/
- Hooks globais em src/hooks/
- TanStack Query para toda comunicação com API (sem useEffect para fetch)
- React Hook Form + Zod para todos os formulários
- shadcn/ui como base de componentes — não reinventar
- Tema claro/escuro via CSS variables + Tailwind dark mode
- Mobile-first, responsivo
- Skeleton loading para todos os estados de carregamento
- Toast para feedback de ações

## Backend

- Express Router para organizar rotas
- Middleware de validação com Zod antes do controller
- Error handler global que converte erros em respostas HTTP padronizadas
- Formato de resposta: `{ success: boolean, data?: T, error?: { message: string, code: string } }`
- Rate limiting: 100 req/min geral, 10 req/min para auth
- Logs estruturados

## Banco

- Prisma como ORM
- Migrations versionadas
- Soft delete quando fizer sentido (User), hard delete para dados transacionais
- IDs: CUID
- Timestamps: createdAt + updatedAt em todas as tabelas

## Segurança

- Helmet em todas as respostas
- CORS com whitelist
- bcrypt (salt rounds = 12) para senhas
- JWT com expiração curta (15min) + refresh token (7 dias) com rotation
- Validação Zod em toda entrada de dados
- Prisma para prevenção de SQL injection
- Sem dados sensíveis em logs ou respostas de erro

## Fluxo de Desenvolvimento

- Seguir o plano de implementação (docs/04-implementation-plan.md)
- Implementar uma fase por vez, completamente
- Ao concluir cada fase: apresentar resumo e aguardar aprovação
- Antes de implementar: explicar arquitetura e decisões técnicas
- Nunca usar soluções temporárias

## Comandos

```bash
pnpm dev          # Roda frontend + backend em dev
pnpm build        # Build de produção
pnpm lint         # ESLint em todos os packages
pnpm format       # Prettier em todos os packages
pnpm test         # Vitest em todos os packages
pnpm db:migrate   # Prisma migrate dev
pnpm db:seed      # Seed do banco
pnpm db:studio    # Prisma Studio
```

## Documentação

- `docs/01-product-vision.md` — PRD, funcionalidades, roadmap
- `docs/02-architecture.md` — Stack, padrões, modelo de dados, Docker
- `docs/04-implementation-plan.md` — Fases detalhadas, critérios de done
