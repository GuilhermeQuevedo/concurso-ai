# Editais prontos

Meus Editais → Novo edital → aba **Editais prontos**. O aluno navega em três níveis: **área** (Educação) → **edital** (SEEDF – Último edital) → **cargo**, com abas por categoria (Professores, Pedagogo, Gestores) e busca; o edital é criado na hora, com as matérias e os tópicos oficiais, **sem leitura pela IA** (sem espera, sem custo e sem risco de a IA misturar cargos).

## Como funciona

- **Dados:** `apps/backend/src/data/editais-prontos/<edital>.json`, validado com Zod ao subir o servidor (`presetCatalogSchema`). Cada edital tem blocos comuns (`shared`: básicos, magistério, assistência à educação) e a lista de cargos com o conteúdo específico.
- **Montagem do edital do aluno** (`utils/preset-edital.ts`): conteúdo específico do cargo → conteúdo da carreira (professor/pedagogo = magistério; gestor = assistência à educação) → conhecimentos básicos. Todas as matérias entram com foco ligado, porque o aluno já escolheu o cargo.
- **API** (atrás do `gate`, como o resto):
  - `GET /api/preset-editais` → catálogos com cargos agrupados e contagem de matérias/tópicos.
  - `POST /api/preset-editais` `{ catalogId, cargoId }` → cria o `Contest` com `ContestSyllabusItem`s (201).
- **Front:** `features/contests/components/PresetEditalPicker.tsx` (navegação área → edital → cargo, com breadcrumb), `PresetCargoStep.tsx` (busca, abas por categoria e resumo antes de criar).

## SEEDF 2022

50 cargos, 1.039 tópicos: Professor de Educação Básica (38 áreas), Pedagogo – Orientador Educacional (1) e Gestor em Políticas Públicas e Gestão Educacional (11 áreas). O conteúdo vem do Anexo IV do edital.

Para refazer o catálogo a partir do PDF oficial (requer `pip install pymupdf`):

```bash
python apps/backend/scripts/build-seedf-catalog.py caminho/edital_31.pdf
```

O script sai com erro se algum cargo vier com menos de 3 tópicos. Depois rode os testes do backend (`preset-edital.test.ts` confere os 50 cargos).

## Limites conhecidos

- Cada tópico é um item numerado do edital, com seus subitens dentro do mesmo texto (ex.: "2 Geopolítica e Econômica. 2.1 O espaço…"). Isso mantém o texto fiel ao edital, mas os tópicos ficam longos.
- A banca não consta no texto do edital, então `examBoard` fica vazio; o aluno pode editar.
- O cargo "Professor – Música" cobre os cargos 430 a 458 (um conteúdo só).
- Para incluir outro edital: gerar o JSON no mesmo formato e registrá-lo em `data/editais-prontos/index.ts`. Nada mais muda no front.
