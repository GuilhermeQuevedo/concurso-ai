# 02 — Arquitetura do Sistema

## Visão Geral

```
┌─────────────┐     HTTPS/JSON      ┌──────────────┐     SQL/Prisma     ┌────────────┐
│   Frontend  │ ◄──────────────────► │   Backend    │ ◄───────────────► │ PostgreSQL │
│  React/Vite │                      │ Node/Express │                    │  (Docker)  │
│  TypeScript │                      │  TypeScript  │                    └────────────┘
└─────────────┘                      │              │
                                     │   Services   │──── Gemini API
                                     │   Repos      │──── (IA Provider)
                                     └──────────────┘
```

---

## Stack Tecnológica

### Frontend
| Tecnologia       | Versão   | Propósito                     |
| ---------------- | -------- | ----------------------------- |
| React            | 19.x     | UI library                    |
| Vite             | 6.x      | Build tool                    |
| TypeScript       | 5.x      | Tipagem estática              |
| React Router     | 7.x      | Roteamento SPA                |
| TanStack Query   | 5.x      | Server state management       |
| Axios            | 1.x      | HTTP client                   |
| TailwindCSS      | 4.x      | Utility-first CSS             |
| shadcn/ui        | latest   | Component library             |
| Lucide Icons     | latest   | Ícones                        |
| React Hook Form  | 7.x      | Formulários                   |
| Zod              | 3.x      | Validação de schemas          |

### Backend
| Tecnologia       | Versão   | Propósito                     |
| ---------------- | -------- | ----------------------------- |
| Node.js          | 22.x LTS| Runtime                       |
| Express          | 5.x      | HTTP framework                |
| TypeScript       | 5.x      | Tipagem estática              |
| Prisma           | 6.x      | ORM + migrations              |
| PostgreSQL       | 17.x     | Banco relacional              |
| JWT (jose)       | 6.x      | Autenticação                  |
| bcrypt           | 5.x      | Hash de senhas                |
| Helmet           | 8.x      | Headers de segurança          |
| cors             | 2.x      | Cross-Origin                  |
| express-rate-limit| 7.x     | Rate limiting                 |
| Zod              | 3.x      | Validação de DTOs             |

### IA
| Tecnologia           | Propósito                          |
| -------------------- | ---------------------------------- |
| Google Gemini API    | Geração de questões (provider inicial) |
| Interface abstrata   | Preparado para OpenAI, Claude, DeepSeek |

### DevOps
| Tecnologia       | Propósito                     |
| ---------------- | ----------------------------- |
| pnpm             | Package manager               |
| Turborepo        | Monorepo orchestration        |
| Docker Compose   | PostgreSQL + serviços         |
| ESLint           | Linting                       |
| Prettier         | Formatação                    |
| Vitest           | Testes unitários/integração   |

---

## Estrutura do Monorepo

```
concurso-ai/
├── apps/
│   ├── frontend/              # React SPA
│   │   ├── src/
│   │   │   ├── assets/        # Imagens, fontes, SVGs
│   │   │   ├── components/    # Componentes compartilhados (Button, Modal, etc.)
│   │   │   ├── features/      # Feature modules (auth, questions, dashboard, etc.)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── services/
│   │   │   │   │   └── types.ts
│   │   │   │   ├── questions/
│   │   │   │   ├── dashboard/
│   │   │   │   └── admin/
│   │   │   ├── hooks/         # Hooks globais
│   │   │   ├── layouts/       # Layout components (MainLayout, AuthLayout)
│   │   │   ├── pages/         # Route pages (composição de features)
│   │   │   ├── routes/        # Definição de rotas
│   │   │   ├── services/      # API client, interceptors
│   │   │   ├── contexts/      # React contexts globais
│   │   │   ├── stores/        # State management (se necessário)
│   │   │   ├── styles/        # Tailwind config, global styles
│   │   │   ├── types/         # Tipos globais do frontend
│   │   │   └── utils/         # Utilidades puras
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/               # API REST
│       ├── src/
│       │   ├── config/        # Env vars, constants, app config
│       │   ├── controllers/   # HTTP handlers (thin — delegam para services)
│       │   ├── database/      # Prisma client singleton, seed
│       │   ├── dto/           # Data Transfer Objects (validados com Zod)
│       │   ├── entities/      # Domain entities (tipos puros, sem ORM)
│       │   ├── interfaces/    # Contratos (IRepository, IService, IAIProvider)
│       │   ├── middlewares/   # Auth, error handler, rate limit, validation
│       │   ├── repositories/  # Data access layer (Prisma queries)
│       │   ├── routes/        # Express route definitions
│       │   ├── services/      # Business logic
│       │   ├── validators/    # Zod schemas para request validation
│       │   ├── utils/         # Utilidades puras
│       │   └── server.ts      # Entry point
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                # Constantes, enums, utils compartilhados
│   ├── types/                 # Tipos TypeScript compartilhados (frontend + backend)
│   └── ui/                    # Componentes UI compartilhados (futuro)
│
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   ├── migrations/            # Migrações
│   └── seed.ts                # Dados iniciais
│
├── docker/
│   └── docker-compose.yml     # PostgreSQL + pgAdmin
│
├── docs/                      # Documentação do projeto
│
├── scripts/                   # Scripts de automação
│
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # Workspace config
├── package.json               # Root package.json
├── .env.example               # Template de variáveis de ambiente
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── CLAUDE.md                  # Regras para o Claude Code
└── README.md
```

---

## Padrões Arquiteturais

### Backend — Fluxo de uma Request

```
Request → Route → Middleware(auth, validate) → Controller → Service → Repository → Prisma → DB
                                                    ↓
                                              DTO (response)
                                                    ↓
Response ← Controller ← Service
```

### Camadas

| Camada        | Responsabilidade                                  | Regra                                    |
| ------------- | ------------------------------------------------- | ---------------------------------------- |
| Controller    | Recebe HTTP, extrai params, chama service          | Sem lógica de negócio                    |
| Service       | Lógica de negócio, orquestração                    | Não conhece HTTP nem Prisma diretamente  |
| Repository    | Acesso a dados via Prisma                          | Não tem lógica de negócio                |
| DTO           | Shape dos dados de entrada/saída                   | Validado com Zod                         |
| Entity        | Tipo puro do domínio                               | Sem dependências externas                |
| Interface     | Contratos entre camadas                            | Permite troca de implementação           |

### IA Provider — Padrão Strategy

```typescript
interface IAIProvider {
  generateQuestions(config: QuestionGenerationConfig): Promise<GeneratedQuestion[]>;
}

class GeminiProvider implements IAIProvider { /* ... */ }
class OpenAIProvider implements IAIProvider { /* ... */ }  // futuro
class MockProvider implements IAIProvider { /* ... */ }     // dev/testes
```

---

## Modelo de Dados (Entidades Core)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  name          String
  avatar        String?
  role          Role     @default(USER)
  targetExam    String?
  targetRole    String?
  dailyGoal     Int      @default(30)
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions      Session[]
  attempts      QuestionAttempt[]
  studySessions StudySession[]
  documents     Document[]
  favorites     Favorite[]
  notes         Note[]
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Subject {
  id        String   @id @default(cuid())
  name      String
  parentId  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent   Subject?  @relation("SubjectTree", fields: [parentId], references: [id])
  children Subject[] @relation("SubjectTree")
  questions Question[]
}

model ExamBoard {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  questions Question[]
}

model Question {
  id           String     @id @default(cuid())
  statement    String
  alternatives Json
  correctAnswer String
  difficulty   Difficulty
  explanation  String
  comments     Json
  subjectId    String
  examBoardId  String?
  source       QuestionSource @default(AI_GENERATED)
  aiModel      String?
  createdAt    DateTime   @default(now())

  subject   Subject    @relation(fields: [subjectId], references: [id])
  examBoard ExamBoard? @relation(fields: [examBoardId], references: [id])
  attempts  QuestionAttempt[]
  favorites Favorite[]
}

model QuestionAttempt {
  id          String   @id @default(cuid())
  userId      String
  questionId  String
  answer      String
  isCorrect   Boolean
  timeSpent   Int
  createdAt   DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}

model StudySession {
  id           String   @id @default(cuid())
  userId       String
  subjectId    String?
  questionsCount Int
  correctCount   Int
  totalTime    Int
  mode         StudyMode
  difficulty   Difficulty?
  examBoardId  String?
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Document {
  id          String   @id @default(cuid())
  userId      String
  name        String
  type        DocumentType
  content     String
  subjectId   String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Favorite {
  id         String   @id @default(cuid())
  userId     String
  questionId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([userId, questionId])
}

model Note {
  id         String   @id @default(cuid())
  userId     String
  questionId String?
  subjectId  String?
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Role {
  USER
  ADMIN
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum StudyMode {
  STUDY
  EXAM
}

enum QuestionSource {
  AI_GENERATED
  IMPORTED
  MANUAL
}

enum DocumentType {
  PDF
  DOCX
  TXT
  HTML
  MARKDOWN
}
```

---

## Autenticação

### Fluxo

1. **Cadastro:** email + senha → hash bcrypt → salvar User → enviar e-mail de confirmação
2. **Login:** email + senha → verificar hash → gerar JWT (15min) + Refresh Token (7 dias) → salvar Session
3. **Refresh:** refresh token → validar Session → novo JWT + novo Refresh Token (rotation)
4. **Logout:** invalidar Session no banco
5. **Middleware auth:** extrair JWT do header → verificar assinatura → injetar `userId` no request

### Tokens

- **Access Token (JWT):** 15 minutos, contém `userId` e `role`
- **Refresh Token:** 7 dias, UUID aleatório salvo no banco, rotação a cada uso

---

## Docker Compose

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: concurso
      POSTGRES_PASSWORD: concurso_dev
      POSTGRES_DB: concurso_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@concurso.ai
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## Segurança

- **Helmet:** headers HTTP de segurança
- **Rate Limiting:** 100 req/min por IP (endpoints gerais), 10 req/min (auth)
- **CORS:** whitelist de origens permitidas
- **Validação:** Zod em todos os inputs
- **Sanitização:** escape de HTML em inputs de texto
- **Hash:** bcrypt com salt rounds = 12
- **SQL Injection:** Prisma (queries parametrizadas)
- **XSS:** React (escape automático) + sanitização no backend
- **CSRF:** SameSite cookies quando aplicável

---

## UX/Frontend

- **Tema:** claro e escuro (CSS variables + Tailwind dark mode)
- **Responsivo:** mobile-first (mobile, tablet, desktop)
- **Layout:** sidebar colapsável, breadcrumb, topbar
- **Feedback:** toast notifications, skeleton loading, estados de erro
- **Componentes:** shadcn/ui como base, customizados conforme necessário
