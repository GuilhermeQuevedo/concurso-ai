# RASCUNHO — PENDENTE DE REVISÃO JURÍDICA
# POLÍTICA DE RETENÇÃO, DESCARTE E CICLO DE VIDA DE DADOS PESSOAIS

> **AVISO IMPORTANTE:** Este documento estabelece a política operacional interna de governança e ciclo de vida de dados pessoais da plataforma **Engrama**, elaborada em conformidade com o Artigo 16 da Lei nº 13.709/2018 (LGPD), Artigo 15 da Lei nº 12.965/2014 (Marco Civil da Internet) e Artigo 173 do Código Tributário Nacional (Lei nº 5.172/1966). Esta política deve ser submetida à revisão e aprovação final da assessoria jurídica da empresa antes de publicação oficial.

---

## 1. Princípios Gerais do Ciclo de Vida
A plataforma Engrama adota o princípio da **minimização de dados** (*data minimization*) e da **limitação do armazenamento** (*storage limitation*):
1. Dados pessoais são custodiados apenas pelo período estritamente necessário para cumprir a finalidade pedagógica para a qual foram coletados.
2. Cessada a finalidade ou atingido o prazo prescricional legal, os dados pessoais são **eliminados fisicamente** ou submetidos a **anonimização irreversível** (Art. 16 da LGPD).
3. "Soft-delete" mantendo dados pessoais em claro é terminantemente vedado para solicitações de eliminação de titulares.

---

## 2. Matriz de Retenção e Descarte por Categoria de Dado

| Categoria do Dado / Model Prisma | Prazo de Retenção | Base Legal Principal (LGPD) | Procedimento de Descarte | Justificativa Técnica / Legal |
| :--- | :--- | :--- | :--- | :--- |
| **Contas Inativas SEM Histórico de Pagamento** (`User`) | **24 meses** sem autenticação ou atividade | Art. 7º, I (Consentimento) / Art. 7º, V (Execução de contrato gratuito) | **Exclusão Definitiva (Hard Delete)** com cascade em todas as tabelas filhas | Princípio da necessidade (Art. 6º, III). Contas abandonadas sem vínculo fiscal não justificam retenção perpétua de PII. |
| **Contas Inativas COM Histórico de Pagamento** (`User` + `Payment`) | **5 anos** a contar da última transação ou expiração do plano | Art. 7º, II c/c Art. 16, I (Cumprimento de obrigação legal ou regulatória — Art. 173 do CTN) | **Anonimização Irreversível** via `AnonymizationService` | Guarda fiscal obrigatória para fins de auditoria tributária; todos os dados de estudo, redações e PII são descartados. |
| **Registros Fiscais e Histórico de Pagamentos** (`Payment`) | **5 anos fiscais** | Art. 16, I da LGPD c/c Art. 173 do Código Tributário Nacional | **Expurgo Definitivo** após prazo prescricional de cobrança/decadência tributária | Registro estritamente contábil (valores, datas, IDs de transação e e-mail anonimizado `deleted_<uuid>@engrama.internal`). |
| **Trilha de Auditoria Administrativa** (`AdminAuditLog`) | **5 anos** | Art. 7º, IX (Legítimo interesse) / Art. 16, II (Garantia de segurança e prestação de contas) | **Expurgo Definitivo** dos logs mais antigos | Comprovação de conformidade regulatória perante fiscalizações da ANPD (Art. 37 da LGPD). Não contém PII em claro. |
| **Registro de Erasure / DR** (`ErasureLog`) | **Permanente** (apenas hash criptográfico) | Art. 16, I (Garantia de cumprimento de eliminação contra restauração de backups) | **Retenção do Hash SHA-256** | Contém unicamente `userHash` (SHA-256 irreversível) para assegurar que restores de backup de disaster recovery não recriem titulares eliminados. |
| **Contatos e Leads Importados** (`Contact`) | **12 meses** sem conversão ou interação | Art. 7º, I (Consentimento) / Art. 7º, IX (Legítimo interesse) | **Expurgo Definitivo** | Cessada a oportunidade razoável de contratação, cessa o legítimo interesse ou a vigência da expectativa do titular. |
| **Lista de Supressão** (`ContactSuppression`) | **Permanente** (apenas HMAC-SHA256 do e-mail) | Art. 16, I (Garantia de cumprimento perpétuo do opt-out) | **Permanente** | O hash HMAC-SHA256 é retido para evitar reimportações acidentais de leads que solicitaram descadastro. |
| **Sessões e Tokens Expirados** (`Session`, `PasswordResetToken`) | **30 dias** após a data de expiração (`expiresAt`) | Art. 16, IV (Segurança técnica e minimização) | **Expurgo Automático (Hard Delete)** | Higienização do banco de dados e mitigação de superfícies de ataque. |
| **Logs de Acesso a Aplicação** (Servidor HTTP / Express) | **6 meses** | Art. 15 da Lei nº 12.965/2014 (Marco Civil da Internet) | **Rotação e Sobrescrita** | Obrigação legal de guarda de registros de conexão e acesso a aplicações na internet sob sigilo. |

---

## 3. Procedimento Operacional da Rotina Automatizada

O serviço de retenção é implementado no backend através do módulo `RetentionService` (`apps/backend/src/services/retention.service.ts`) e pode ser disparado periodicamente via cron ou sob demanda:

### Execução via CLI:
```bash
# Modo de simulação (Auditoria prévia de contagens - nenhuma alteração no banco)
pnpm --filter @concurso-ai/backend exec tsx scripts/run-data-retention-purge.ts --dry-run

# Modo de execução ativa (Expurgo físico e anonimização em lotes de 50)
pnpm --filter @concurso-ai/backend exec tsx scripts/run-data-retention-purge.ts --batch-size=50
```

### Regras de Execução e Segurança:
1. **Idempotência**: O job pode ser reexecutado múltiplas vezes sem provocar duplicidade de ações ou inconsistências relacionais.
2. **Processamento em Lotes**: Limitação de transações por lote configurável para prevenir bloqueios de tabela (*table lock contention*) no MySQL.
3. **Logs Seguros**: Logs estruturados contendo apenas totalizadores e identificadores de sistema, nunca PII, senhas ou e-mails em claro.
4. **Notificação Prévia**: Contas inativas podem receber comunicação transacional com antecedência mínima de 30 dias informando a iminência de exclusão definitiva caso não haja login no período.

---
*Documento elaborado em novembro de 2026 — Classificação: Governança Interna LGPD*
