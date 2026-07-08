# 05 — Study Hub: Concursos, Editais e Calendário

## Visão

A plataforma não é um cursinho com videoaulas — é o **centro de organização do estudo autodidata**. A estudante traz o próprio material (PDFs) e o edital do concurso; a plataforma organiza o que estudar, quando estudar, e avalia o desempenho (questões + redações).

Nada do que já existe é removido. Esta evolução conecta os módulos existentes (documentos, questões, redações, plano de estudos) em torno de uma entidade central nova: o **Concurso**.

## Fluxo principal

1. Estudante cadastra um concurso (manualmente ou via upload do edital em PDF)
2. Se via edital: IA extrai órgão, banca, cargo, data da prova e o conteúdo programático completo (disciplinas + tópicos)
3. O conteúdo programático vira um checklist de estudo (syllabus) vinculado ao concurso
4. Sistema gera um **plano de estudo retroativo**: da data da prova para trás, distribuindo tópicos pelos dias disponíveis, com ciclos de revisão
5. Calendário mostra: o que estudar hoje, contagem regressiva para provas, redações e revisões pendentes
6. Desempenho em questões realimenta o plano (tópicos fracos ganham mais tempo)

## Modelo de dados (novas entidades)

### Contest (Concurso)

| Campo | Tipo | Notas |
|---|---|---|
| id | cuid | |
| userId | FK User | cascade |
| name | String | ex: "SEEDF — Professor Sociologia" |
| organization | String? | órgão |
| examBoard | String? | banca (texto livre, não FK) |
| role | String? | cargo |
| examDate | DateTime? | data da prova |
| status | enum | PLANNED, STUDYING, DONE, ARCHIVED |
| editalDocumentId | String? | referência ao Document com o texto do edital |
| createdAt / updatedAt | | |

### ContestSyllabusItem (item do conteúdo programático)

| Campo | Tipo | Notas |
|---|---|---|
| id | cuid | |
| contestId | FK Contest | cascade |
| subjectId | FK Subject? | link opcional a disciplina existente |
| discipline | String | ex: "Língua Portuguesa" |
| topic | Text | ex: "1. Compreensão e interpretação de textos" |
| order | Int | ordem no edital |
| studied | Boolean | checklist de progresso |

### StudyTask (tarefa do calendário — Fase 17)

| Campo | Tipo | Notas |
|---|---|---|
| id | cuid | |
| userId | FK User | cascade |
| contestId | FK Contest? | |
| syllabusItemId | FK ContestSyllabusItem? | |
| date | DateTime | dia da tarefa |
| type | enum | STUDY, REVIEW, ESSAY, MOCK_EXAM |
| title | String | |
| duration | Int | minutos |
| completed | Boolean | |

## IA — extração de edital

Novo método na interface `IAIProvider`:

```typescript
parseEdital(params: { content: string }): Promise<EditalParseResult>

interface EditalParseResult {
  name: string;
  organization: string | null;
  examBoard: string | null;
  role: string | null;
  examDate: string | null;        // ISO date se encontrada
  syllabus: { discipline: string; topics: string[] }[];
}
```

- Reaproveita a extração de texto de PDF do `DocumentService` (pdf-parse)
- Texto do edital pode ser grande — enviado até ~100k chars ao Gemini (contexto 1M)
- MockProvider retorna edital de exemplo para dev

## Geração do plano retroativo (Fase 17)

Entrada: concurso com examDate + syllabus + dias/horas disponíveis por semana (config do usuário).

Algoritmo:
1. Conta dias úteis de estudo entre hoje e a prova
2. Reserva os últimos ~15% dos dias para revisão geral e simulados
3. Distribui os tópicos do syllabus proporcionalmente pelos dias restantes, agrupados por disciplina (intercalando disciplinas para variedade)
4. A cada tópico estudado, agenda revisões (+3 dias, +7 dias) — alinhado ao SM-2 dos flashcards
5. Tópicos de disciplinas com pior taxa de acerto em questões recebem mais slots

## Fases de implementação

| Fase | Escopo | Critério de done |
|---|---|---|
| 16 | Entidade Contest + syllabus + CRUD + upload de edital com extração IA + página "Meus Concursos" | Estudante cadastra concurso via edital PDF e vê o conteúdo programático como checklist |
| 17 | StudyTask + geração retroativa do plano + página de calendário com contagem regressiva | Calendário mostra o que estudar hoje e dias até a prova |
| 18 | Realimentação por desempenho + dashboard "hoje" (tarefas, revisões, redação pendente) | Plano se ajusta a tópicos fracos |

## Dependências

```
Documentos (Fase 9) ──► Fase 16 (extração de texto do edital)
Fase 16 ──► Fase 17 (plano precisa do syllabus + examDate)
Fase 17 + Questões ──► Fase 18 (realimentação)
```
