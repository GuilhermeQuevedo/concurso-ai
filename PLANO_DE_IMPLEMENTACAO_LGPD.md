# Plano Diretor de Implementação e Remediação LGPD — Concurso AI (Engrama)

> **Documento Estratégico de Engenharia para Implementação Técnica**  
> **Para**: Engenharia / Pair Programming com Claude / Tech Lead  
> **Data de Emissão**: 07/11/2026  
> **Versão**: 1.0  
> **Contexto**: Este documento compila todos os déficits identificados na auditoria oficial realizada via `lgpd-skills` no repositório `concurso-ai`. Ele fornece especificações arquiteturais, trechos de código sugeridos, contratos de API, schemas de banco e divisão por sprints para guiar a implementação imediata.

---

## 1. Visão Geral e Arquitetura da Solução

O objetivo é transformar o Concurso AI em uma plataforma **100% aderente à LGPD (Lei nº 13.709/2018)**, às resoluções da ANPD (Res. 2/2022, 15/2024, 18/2024 e 19/2024) e à Lei nº 15.211/2025 (ECA Digital), seguindo os princípios de:
- **Clean Architecture**: Separação estrita de camadas (`Controller` → `Service` → `Repository` / `Provider`).
- **SOLID**: Princípio da responsabilidade única e inversão de dependência.
- **Privacy by Design & by Default** (Art. 46, § 2º da LGPD).

### Divisão em 4 Sprints Prioritárias:

```
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 1 (Imediato - Segurança & Compliance Crítico)                    │
│ 1. Criptografia AES-256-GCM para Tokens OAuth em Repouso (Gap G04)     │
│ 2. Endpoints DSAR de Exportação e Eliminação de Conta (Gap G03)        │
│ 3. Minimização do Campo Telefone no Cadastro (Gap G11)                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 2 (Transparência, Consentimento e Frontend)                     │
│ 4. Página Pública de Política de Privacidade v1.0 (Gap G05)            │
│ 5. Aceite Inequívoco de Termos/Privacidade no Cadastro (Gap G05)        │
│ 6. Publicação do Canal do Encarregado (DPO) no Rodapé (Gap G06)        │
│ 7. Blindagem Preventiva para Menores — ECA Digital (Gap G13)           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 3 (Governança Administrativa & Auditoria)                       │
│ 8. Audit Logging Imutável para Consultas a PII no Admin (Gap G12)      │
│ 9. Governança e Base Legal na Importação de Contatos (Gap G10)         │
│ 10. Implementação de Soft-Delete / Cofre Fiscal de Retenção (Gap G09)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 4 (Operadores Externos & Resposta a Incidentes)                 │
│ 11. Automação de Cancelamento de Assinatura Stripe no Expurgo (Gap G03)│
│ 12. Adesão Formal aos DPAs de OpenAI, Anthropic e Google (Gap G08)     │
│ 13. Ativação dos Procedimentos do Runbook de Incidentes (Gap G07)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento Técnico das Tarefas

---

### TAREFA 1: Criptografia em Repouso de Tokens OAuth (Gap G04 — Crítico)

#### Contexto do Déficit:
No model `UserCalendarIntegration` (`apps/backend/prisma/schema.prisma`), os campos `googleAccessToken` e `googleRefreshToken` são gravados em texto plano no MySQL. Se o banco vazar, invasores obtêm acesso persistente às agendas pessoais dos alunos.

#### Arquivos a Modificar / Criar:
- `apps/backend/src/config/env.ts`: Adicionar variável `ENCRYPTION_KEY` (chave hex de 32 bytes para AES-256).
- `apps/backend/src/utils/crypto.ts`: Criar utilitário modular de envelope encryption com algoritmo `aes-256-gcm`.
- `apps/backend/src/services/calendar-integration.service.ts`: Cifrar tokens antes de salvar e decifrar ao instanciar o cliente Google Calendar.
- `apps/backend/prisma/schema.prisma`: Documentar as colunas com anotações `@lgpd`.

#### Código Sugerido (`apps/backend/src/utils/crypto.ts`):
```typescript
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = env.ENCRYPTION_KEY || env.JWT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra um texto plano em formato serializado: iv:authTag:ciphertext (Hex)
 */
export function encryptData(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decifra o payload serializado
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return encryptedPayload;
  
  const [ivHex, authTagHex, cipherText] = encryptedPayload.split(':');
  if (!ivHex || !authTagHex || !cipherText) return encryptedPayload;
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

### TAREFA 2: Endpoints DSAR de Exercício de Direitos (Gap G03 — Crítico)

#### Contexto do Déficit:
O sistema não possui endpoint para que o titular exerça o direito de **Portabilidade/Acesso Completo** (Art. 18, II e V) nem o de **Eliminação de Dados / Exclusão de Conta** (Art. 18, VI). O endpoint atual `/api/auth/reset-account` apenas apaga o progresso de estudos, mantendo a titularidade da conta, e-mail, telefone, avatar e histórico de cobrança.

#### Arquivos a Modificar / Criar:
- `apps/backend/src/validators/auth.validators.ts`: Criar `erasureSchema`.
- `apps/backend/src/routes/auth.routes.ts`: Adicionar `GET /me/export` e `POST /me/erasure`.
- `apps/backend/src/controllers/auth.controller.ts`: Implementar métodos `exportMyData` e `eraseMyAccount`.
- `apps/backend/src/services/auth.service.ts`: Orquestrar compilação do JSON exportado e rotina de cancelamento/expurgo.
- `apps/backend/src/repositories/auth.repository.ts`: Métodos de busca de dados consolidados e exclusão em cascata.

#### Especificação dos Endpoints:

##### 1. `GET /api/auth/me/export` (Portabilidade)
- **Autenticação**: `authMiddleware`.
- **Comportamento**: Retorna todas as informações associadas ao aluno (Cadastro, Questões respondidas, Redações com notas e feedbacks, Planos de Estudo, Sessões e Pagamentos).
- **Formato**: JSON estruturado com cabeçalho `Content-Disposition: attachment; filename="engrama-meus-dados.json"`.

##### 2. `POST /api/auth/me/erasure` (Exclusão Definitiva)
- **Autenticação**: `authMiddleware`.
- **Payload**:
  ```json
  {
    "password": "senhaDoAlunoParaConfirmar",
    "reason": "Opcional"
  }
  ```
- **Fluxo do Service**:
  1. Validar senha (ou conferir login social Google).
  2. Verificar se há assinatura ativa no Stripe: se houver, chamar `stripe.subscriptions.cancel(subId)`.
  3. Desconectar integrações (destruir tokens Google Calendar).
  4. Executar transação de descarte:
     - Se o usuário possui transações fiscais (`Payment`), anonimizar os dados cadastrais em `User` (substituir nome por "Usuário Anonimizado", e-mail por hash irreconhecível `deleted_<hash>@engrama.internal`) para cumprir a guarda fiscal de 5 anos do CTN sem violar a LGPD.
     - Se não possuir histórico financeiro, executar `prisma.user.delete({ where: { id: userId } })` acionando o cascade em todas as tabelas.
  5. Invalidar sessões ativas do Redis e JWT.
  6. Retornar `{ success: true, message: "Conta e dados pessoais eliminados em conformidade com o Art. 18 da LGPD." }`.

---

### TAREFA 3: Minimização de Dados no Cadastro (Gap G11 — Médio)

#### Contexto do Déficit:
O formulário de cadastro (`apps/frontend/src/features/auth/components/RegisterForm.tsx`) e o validador (`apps/backend/src/validators/auth.validators.ts`) tornam o **número de telefone obrigatório** (`phone: z.string().min(10)`).
Como a plataforma não implementa 2FA por SMS nem utiliza telefone como requisito essencial para o estudo, essa coleta viola o **Princípio da Necessidade** (Art. 6º, III da LGPD).

#### Arquivos a Modificar:
1. `apps/backend/src/validators/auth.validators.ts`:
   ```typescript
   export const registerSchema = z.object({
     name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
     email: z.string().email('E-mail inválido'),
     phone: z.string().min(10, 'Telefone inválido').optional().nullable(),
     password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
   });
   ```
2. `apps/frontend/src/features/auth/components/RegisterForm.tsx`:
   - Tornar o campo `Telefone` explícito como **(Opcional)** na label.
   - Ajustar o schema Zod do frontend para `.optional()`.

---

### TAREFA 4: Página de Política de Privacidade e Aceite no Cadastro (Gap G05 & G06 — Alto)

#### Contexto do Déficit:
Atualmente, não existe rota de Política de Privacidade no React nem menção de consentimento ou aceite de termos no momento em que o usuário se cadastra (`RegisterForm.tsx`).

#### Arquivos a Modificar / Criar:
- `apps/frontend/src/pages/PrivacyPolicyPage.tsx`: Criar componente renderizando a Política de Privacidade v1.0 elaborada em `.lgpd/policies/privacy-policy-v1.0.md`.
- `apps/frontend/src/routes/index.tsx`: Adicionar rotas públicas `/politica-de-privacidade` e `/privacidade`.
- `apps/frontend/src/features/auth/components/RegisterForm.tsx`:
  - Adicionar checkbox obrigatório:
    > "[x] Li e concordo com os [Termos de Uso](/termos) e com a [Política de Privacidade](/politica-de-privacidade)."
  - Exibir no rodapé da página o canal de contato do Encarregado: `privacidade@engrama.tech`.
- `apps/frontend/src/pages/LandingPage.tsx` e `apps/frontend/src/layouts/DashboardLayout.tsx`:
  - Adicionar links institucionais no rodapé: *Privacidade*, *Termos*, *Encarregado (DPO)*.

---

### TAREFA 5: Blindagem Preventiva para Menores — ECA Digital (Gap G13 — Médio)

#### Contexto do Déficit:
A Lei nº 15.211/2025 (ECA Digital) entrou em vigor em **17 de março de 2026**. Embora o público principal de concursos seja 18+, seleções militares e vestibulares podem atrair adolescentes. A lei veda terminantemente autodeclaração genérica e exige salvaguardas adicionais para menores de 16 anos.

#### Ações a Implementar:
1. Adicionar no `RegisterForm.tsx` a validação de maioridade:
   - "Declaro que sou maior de 18 anos ou possuo autorização expressa do meu responsável legal para utilizar a plataforma."
2. Inserir cláusula destacada na Política de Privacidade sobre o tratamento de dados de adolescentes, confirmando que a plataforma **não realiza perfilamento publicitário comportamental** (cumprimento dos Arts. 22 e 26 da Lei 15.211/2025).

---

### TAREFA 6: Log de Auditoria para Acesso Administrativo a PII (Gap G12 — Médio)

#### Contexto do Déficit:
No painel administrativo (`/api/admin/users`), qualquer administrador pode visualizar listagens com nomes e e-mails de até 300 usuários sem que haja registro imutável de **quem consultou, quando e por qual motivo**.

#### Arquivos a Modificar / Criar:
- `apps/backend/src/middlewares/audit-log.middleware.ts`:
  - Interceptar requisições das rotas `/api/admin/*`.
  - Registrar log estruturado:
    ```typescript
    {
      timestamp: new Date().toISOString(),
      adminId: req.userId,
      adminEmail: req.userEmail,
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      affectedResource: 'USER_PII_LIST'
    }
    ```
  - Gravar em arquivo de rotação de log ou tabela de auditoria sem expor senhas.

---

### TAREFA 7: Governança na Importação de Contatos/Leads (Gap G10 — Alto)

#### Contexto do Déficit:
O endpoint `/api/admin/contacts/import` (`admin.controller.ts`) permite que administradores colem blocos de texto com nomes, telefones e e-mails sem registrar a origem do consentimento ou a base legal.

#### Ações a Implementar:
1. Modificar o validador de importação para exigir a declaração da base legal:
   - `legalBasis`: Enum (`CONSENT`, `LEGITIMATE_INTEREST`, `PRE_CONTRACTUAL`).
   - `consentProofNotes`: Descrição da origem (ex.: "Leads inscritos no formulário da live de Direito Constitucional").
2. Adicionar flag `unsubscribed: boolean` no model `Contact` para garantir que, caso o contato solicite opt-out, o sistema não permita reimportá-lo acidentalmente.

---

## 3. Matriz de Arquivos do Projeto a Serem Modificados

| Camada | Arquivo no Concurso AI | Modificação LGPD |
|---|---|---|
| **Database** | `apps/backend/prisma/schema.prisma` | Anotações `@lgpd`, campos de auditoria em `Contact`, regras de soft-delete fiscal em `Payment`/`User`. |
| **Config** | `apps/backend/src/config/env.ts` | Adicionar chave `ENCRYPTION_KEY` para AES-256-GCM. |
| **Utils** | `apps/backend/src/utils/crypto.ts` | Funções `encryptData` e `decryptData` com envelope AES-GCM. |
| **Services** | `apps/backend/src/services/calendar-integration.service.ts` | Criptografar tokens Google Calendar antes de persistir no banco. |
| **Services** | `apps/backend/src/services/auth.service.ts` | Adicionar lógica dos métodos `exportUserData(userId)` e `eraseUserAccount(userId, password)`. |
| **Repositories**| `apps/backend/src/repositories/auth.repository.ts` | Queries consolidadas de busca completa e descarte/anonimização. |
| **Controllers** | `apps/backend/src/controllers/auth.controller.ts` | Handlers para `GET /api/auth/me/export` e `POST /api/auth/me/erasure`. |
| **Validators** | `apps/backend/src/validators/auth.validators.ts` | Telefone opcional; schema de validação para exclusão de conta. |
| **Middlewares** | `apps/backend/src/middlewares/audit-log.middleware.ts` | Log de auditoria em requisições de PII no painel admin. |
| **Frontend** | `apps/frontend/src/features/auth/components/RegisterForm.tsx` | Telefone opcional; checkbox obrigatório de Termos e Privacidade; menção de idade. |
| **Frontend** | `apps/frontend/src/pages/PrivacyPolicyPage.tsx` | Nova página pública renderizando a Política de Privacidade v1.0. |
| **Frontend** | `apps/frontend/src/routes/index.tsx` | Rota para `/politica-de-privacidade`. |
| **Frontend** | `apps/frontend/src/pages/SettingsPage.tsx` | Botões self-service de *Exportar Meus Dados* e *Excluir Minha Conta*. |

---

## 4. Instruções Diretas para o Claude / Agente de Código

Ao utilizar este documento com o Claude ou outro assistente para implementar as tarefas:

1. **Ordem de Execução**: Siga a ordem estrita das Sprints (Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4).
2. **Sem Quebras de Build**: Cada tarefa deve ser entregue com tipagem estrita TypeScript (sem `any`), validações Zod e sem alterar o comportamento existente de autenticação e estudo.
3. **Mantenha os Padrões da Engenharia**:
   - Nomes de classes, variáveis e arquivos sempre em inglês.
   - Componentes React não contêm lógica de negócio direta — chamam hooks e facades.
   - Tratamento de exceções utilizando a classe central `AppError`.
4. **Referência aos Artefatos `.lgpd/`**: Para detalhes das bases legais, consulte `.lgpd/legal-basis.md`; para o texto da política, consulte `.lgpd/policies/privacy-policy-v1.0.md`; para endpoints DSAR, consulte `.lgpd/dsar/endpoints.md`.
