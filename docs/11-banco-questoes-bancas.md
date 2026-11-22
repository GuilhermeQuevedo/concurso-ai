# Banco de questões das bancas (esboço)

Ao clicar em **Gerar questões**, o aluno escolhe:

1. **Motor IA das bancas** — fluxo que já existia (questões inéditas no estilo da banca).
2. **Questões diretamente das bancas** — monta um caderno só com questões já cadastradas, sem IA.

## Como funciona

- As questões de banca ficam na tabela `Question` com `source = BANK`, mais os campos `examYear`, `organ` e `examName` (o nome da banca usa `examBoardId`).
- O caderno é um `QuestionSet` comum: depois de montado, abre no mesmo player de estudo, e o selo "Questão de banca · banca · ano · órgão" aparece acima do enunciado.
- Por padrão o caderno prioriza (ou, com a opção marcada, usa só) questões que o aluno ainda não respondeu.

## API

| Rota | O que faz |
| --- | --- |
| `GET /question-bank/facets` | Bancas, matérias, anos e órgãos disponíveis, com contagem |
| `GET /question-bank/count?examBoardId=&subjectId=&examYear=&organ=&difficulty=` | Quantas questões o filtro encontra |
| `POST /question-bank/set` | Monta o caderno (`quantity` de 1 a 50, `onlyUnanswered`, `name` opcional + os mesmos filtros) |

## Importar o banco

```bash
pnpm --filter @concurso-ai/backend prisma:import-bank caminho/do/arquivo.json
```

Sem argumento, importa `apps/backend/prisma/question-bank-sample.json` (12 questões de **exemplo**, escritas para teste, com órgão "(exemplo)": não são questões reais de prova).

Formato de cada item (lista JSON):

```json
{
  "board": "CEBRASPE",
  "subject": "Direito Constitucional",
  "year": 2024,
  "organ": "Nome do órgão",
  "exam": "Nome da prova",
  "difficulty": "EASY | MEDIUM | HARD",
  "statement": "Enunciado",
  "alternatives": [{ "letter": "C", "text": "Certo" }, { "letter": "E", "text": "Errado" }],
  "answer": "C",
  "explanation": "Comentário/fundamento (opcional)"
}
```

- Certo/Errado usa as letras `C` e `E`; múltipla escolha usa `A` a `E`.
- A importação é idempotente (banca + ano + órgão + enunciado iguais não duplicam).
- Bancas e matérias que não existirem são criadas na hora.

## Importar o `nap-questoes-all.json`

```bash
pnpm --filter @concurso-ai/backend prisma:import-nap          # lê ../../nap-questoes-all.json (raiz do repositório)
pnpm --filter @concurso-ai/backend prisma:import-nap caminho/do/arquivo.json
```

- O arquivo (72 MB, 16.712 questões) **não vai para o Git** (está no `.gitignore`).
- Aproveita 15.140 questões; descarta 1.572 (ocultas, sem gabarito, sem alternativas ou com gabarito que não bate com as alternativas).
- Cada questão é identificada por `nap:<id>` (coluna `sourceRef`, única): rodar de novo não duplica.
- Gabarito `CERTO`/`ERRADO` vira `C`/`E`; dificuldade "Muito Fácil/Fácil" = fácil, "Difícil/Muito Difícil" = difícil, vazio = média; o HTML é convertido em texto.
- Disciplina vira matéria; banca vira banca (nomes como `CESPE / CEBRASPE` são normalizados).
- **De qual concurso é a questão:** o campo `prova` do arquivo ("BANCA - ANO - ÓRGÃO - CARGO") vira `examName` (prova), `organ` (órgão) e `position` (cargo, extraído da prova; funciona em 100% das questões que têm prova).
- **Área do concurso** (`area`): derivada do cargo por regras de palavras-chave (`question-area.ts`): Assistência Social, Jurídica, Administrativa, Saúde, Educação, Segurança e Trânsito, Tecnologia, Engenharia e Meio Ambiente e Outras. Sem cargo, usa a disciplina. É uma classificação aproximada.
- Na tela: as 8 maiores bancas aparecem como atalho e as demais numa lista; o órgão é uma busca por texto (sugere os 300 mais frequentes).

## Pendências para produção

- **Origem e licença das questões:** no `nap-questoes-all.json`, 14.893 itens trazem `plataforma = qconcursos`. Antes de publicar, confirmar com quem forneceu o arquivo que o uso e a exibição são permitidos.
- Gabarito anulado/alterado, cargo e número da questão (campos a acrescentar conforme o banco real).
- Filtro por edital/matéria do edital do aluno e busca por assunto.
- Produção usa `db push` no boot (sem `_prisma_migrations`), então a migration `add_question_bank` só entra via `db push`.
