# Auditoria e Matriz de Adoção do Astryx — Engrama (concurso-ai)

> **Documento da Fase 0 (GATE) — Modo Somente Leitura**  
> **Status:** Proposta Técnica para Avaliação (`Aguardando OK MATRIZ`)  
> **Data:** Novembro de 2026  
> **Autor:** Engenheiro e Designer de Interface do Projeto  
> **Referência Local:** Clone do Astryx em `C:\Users\user\astryx` (Modo Somente Leitura)

---

## 1. Arquitetura e Auditoria do Astryx

### 1.1. Monorepo, Pacotes e Licenças
O Astryx é o design system open source da Meta (nascido internamente e construído sobre React 19+ e StyleX). A auditoria do clone local confirmou:
* **Licença:** MIT irrestrita em todos os pacotes (`LICENSE` no root do monorepo).
* **Gerenciador de Pacotes:** `pnpm` workspaces com controle estrito de fronteiras de importação (`check:package-boundaries`).
* **Pacotes Oficiais Relevantes:**
  * `@astryxdesign/core`: Primitivas, componentes de UI, sistema de temas e runtime de tokens.
  * `@astryxdesign/cli`: CLI para documentação de componentes (`astryx component`), templates de página e blocos (`astryx template`), swizzle e validações (`astryx doctor`).
  * `@astryxdesign/theme-neutral`: Tema minimalista padrão, estruturado em escalas sóbrias de cinza e tokens semânticos.
  * `@astryxdesign/charts` / `@astryxdesign/vega`: Visualizações de dados analíticas baseadas em especificações declarativas (distribuído sob a tag `@canary`).
  * `@astryxdesign/build`: Plugins de compilação StyleX para projetos que compilam diretamente o código-fonte.
* **Política de Versões:** Em virtude do estágio Beta/Canary do Astryx, os pacotes devem ser **estritamente fixados** (`save-exact = true`) no `package.json` sem ranges flutuantes (`^` ou `~`).

### 1.2. Estratégia de CSS, Camadas (@layer) e Tailwind Bridge
* **Compilação Interna vs Consumo Externo:** O Astryx escreve seus estilos com StyleX (`@stylexjs/stylex`), porém **exporta CSS pré-compilado estático** (`@astryxdesign/core/astryx.css` e reset em `@astryxdesign/core/reset.css`). Consumidores em Vite/Next não precisam configurar plugins Babel ou loaders StyleX se usarem a distribuição pré-compilada.
* **Integração com Tailwind CSS v4:** O Tailwind v4 organiza sua cascata em `@layer theme, base, components, utilities`. O Astryx define sua cascata em `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities`.
* **Ponte de Tokens (`tailwind-theme.css`):** O Astryx disponibiliza `@astryxdesign/core/tailwind-theme.css` que mapeia tokens customizados (`--color-text-primary`, `--color-background-surface`, `--radius-container`) em utilitários inline do Tailwind (`text-primary`, `bg-surface`, `rounded-lg`), permitindo que classes utilitárias sobrescrevam propriedades de componentes de forma limpa via `className`.

### 1.3. Sistema de Ícones
* O componente `Icon` (`@astryxdesign/core/Icon`) suporta dois modos:
  1. **Component Mode:** Recebe um componente SVG React diretamente (ex.: ícones do `lucide-react`). O `Icon` injeta atributos semânticos, `currentColor` e dimensões ópticas baseadas em variáveis CSS privadas (`--_icon-width`, `--_icon-height`).
  2. **String Mode:** Mapeia identificadores canônicos (`'close'`, `'chevronDown'`) via registro do tema.
* O alinhamento vertical padrão é centralizado com `inline-flex` e dimensões relativas a `1em` da tipografia adjacente.

### 1.4. Acessibilidade e Movimento
* **Acessibilidade:** Suporte rigoroso a WCAG 2.1 AA com `aria-*` gerenciados internamente, navegação por teclado nativa (`ArrowDown`, `Home`, `End`), foco visível via anéis de alta legibilidade (`--focus-ring`) e gestão de foco em modais via FocusTrap.
* **Movimento:** Suporte intrínseco a `prefers-reduced-motion`, desacelerando ou zerando transições visuais para evitar desconforto vestibular.

### 1.5. Mecanismo de "Swizzle"
* O comando `astryx swizzle <NomeDoComponente>` ejeta o código-fonte integral TypeScript do componente para o repositório local do projeto.
* **Regra de Governança para o Swizzle:** O swizzle **só deve ser utilizado** quando uma exigência inegociável de acessibilidade, compliance com LGPD ou integração de layout de tela não puder ser atendida via CSS Custom Properties / `className` / slots de composição. Se for ejetado, o componente passa a ser mantido pelo projeto, com testes de unidade dedicados.

---

## 2. Diagnóstico da Plataforma Engrama (`concurso-ai`)

### 2.1. Stack Técnica do Frontend
* **Framework:** React 19.1.0 e React DOM 19.1.0 (`peerDependencies` perfeitamente compatíveis).
* **Bundler:** Vite 6.3.0.
* **Estilização Atual:** Tailwind CSS v4 (`@tailwindcss/vite: ^4.1.0`) com classes utilitárias semânticas, `clsx`, `tailwind-merge` e `class-variance-authority`.
* **Roteamento:** `react-router` v7 com layouts protegidos (`ProtectedLayout`).
* **Estado e Cache:** `@tanstack/react-query` v5.
* **Ícones Atuais:** `lucide-react` v0.513.0.

### 2.2. Riscos de Compatibilidade e Mitigação
1. **Conflito de Resets Globais:** O `reset.css` do Astryx não pode sobrescrever o `preflight` do Tailwind de forma destrutiva. **Mitigação:** Isolar via `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities` garantindo precedência correta.
2. **Ambiente de Testes (Node.js Test Runner):** O projeto roda testes rápidos via `node --import tsx --test`. Componentes que dependem de `window.matchMedia` ou APIs de DOM devem possuir guards seguras de SSR/Node.
3. **Feature Flags:** Para garantir substituição progressiva e risco zero de quebra, toda adoção de telas é controlada via flag `FEATURE_FLAGS.ASTRYX_<AREA>`.

---

## 3. Matriz de Adoção Funcional

A tabela a seguir mapeia cada área do produto, indicando o componente Astryx candidato, o elemento legado substituído, a decisão arquitetural, impacto e prioridade de entrega:

| Funcionalidade / Tela | Componente(s) Astryx Candidatos | Substitui o quê | Decisão | Acessibilidade | Impacto no Bundle | Risco | Frequência de Uso | Ordem Sugerida |
|---|---|---|---|---|---|---|---|---|
| **Cadastro & Login** (`/login`, `/register`, `/forgot-password`) | `TextInput`, `Button`, `Field`, `Banner`, `CheckboxInput` | Formulários manuais em Tailwind puro | **Adotar** | WCAG AA nativo; erro com `aria-describedby` | Baixo (< 15kB) | Baixo | Baixa | Fase 3 (Lote 1) |
| **Configurações & DSAR (LGPD)** (`/settings`) | `Dialog`, `AlertDialog`, `Button`, `Switch`, `Tabs`/`TabList`, `Card` | Modais manuais e switches caseiros | **Adotar** | Focus trap, confirmação destrutiva separada | Baixo (< 18kB) | Baixo | Baixa | Fase 3 (Lote 2) |
| **Feedback Global & Notificações** | `Toast`, `EmptyState`, `Spinner`, `Indicator` | `Toaster` atual e alerts customizados | **Adotar** | Anúncio em LiveRegion para leitores de tela | Muito baixo (< 8kB) | Muito baixo | Alta | Fase 3 (Lote 3) |
| **Layout & Shell** (`DashboardLayout`, Header, Nav) | `AppShell`, `TopNav`, `SideNav`, `Breadcrumbs`, `DropdownMenu` | Sidebar fixa de 256px e header atual | **Adotar com Swizzle** (para preservar seletor de concurso e Pomodoro mini) | Teclado em menus, skip-links nativos | Médio (~25kB) | Médio | Muito Alta | Fase 4 |
| **Políticas e Legal** (`/politica-de-privacidade`, Termos) | `Section`, `Heading`, `Text`, `Divider`, `ScrollableArea` | Estrutura estática de texto | **Adotar** | Landmark roles e contraste estrito | Muito baixo (< 5kB) | Baixo | Rara | Fase 4 |
| **Resolução de Questões** (`/study`) | `RadioList`, `SelectableCard`, `ProgressBar`, `Badge`, `Button` | Cards manuais de alternativas de A-E | **Adotar com Swizzle** (necessário para tempo de resposta < 100ms e atalhos 1-5 / A-E) | Rádio com navegação por setas e anúncio imediato de acerto/erro | Médio (~20kB) | Alto | Muito Alta | Fase 5 (Lote 1) |
| **Flashcards** (`/flashcards`) | `Card`, `Button`, `Badge`, `SegmentedControl`, `BlurSwap` (primitiva) | Componente manual de virada 3D | **Adotar com Swizzle** (preservar física de flip e lógica SM-2/FSRS) | Foco mantido na frente/verso | Baixo (~12kB) | Alto | Muito Alta | Fase 5 (Lote 2) |
| **Simulados & Provas** (`/exam-slicer`) | `Table`, `Pagination`, `Modal`, `Tag`/`Token`, `ComplexSelector` | Listagem tabular de questões de bancas | **Adotar** | Paginação com `aria-current="page"` | Médio (~22kB) | Médio | Alta | Fase 5 (Lote 3) |
| **Redação & Estudo de Caso** (`/essays`, `/generate`) | `TextArea`, `FileInput`, `FieldStatus`, `Toolbar` | Textarea básico com contador manual | **Adotar** | Suporte a leitores de tela e piso de fonte 16px mobile | Baixo (~10kB) | Médio | Média | Fase 5 (Lote 4) |
| **Dashboard Principal** (`/dashboard`) | `Card`, `Grid`, `Stat`, `ProgressBar`, `@astryxdesign/charts` (avaliado) | Cards manuais e heatmap do dashboard | **Adotar** (Cards) / **Manter Próprio** (Heatmap SVG de constância) | Legendas textuais e contraste AA | Médio (~30kB) | Médio | Alta | Fase 6 (Lote 1) |
| **Chrome do Mapa de Revisão** (`/mapa`) | `Drawer`/`BottomSheet`, `SegmentedControl`, `ButtonGroup`, `Tooltip` | `NodeActionDrawer`, `MapViewSwitcher`, `MapLegend` | **Adotar** | Foco automático no drawer e teclado nas abas | Baixo (~15kB) | Médio | Alta | Fase 6 (Lote 2) |
| **Canvas do Grafo do Mapa** (2D e 3D) | *Nenhum* (motor próprio WebGL / Three.js / Canvas 2D) | N/A | **Manter Próprio** (100% mantido) | N/A (Canvas WCAG redundante via lista acessível) | Zero | Zero | Alta | Fora do Astryx |
| **Administração & CRM LGPD** (`/admin`, `/admin/contatos`) | `Table`, `Pagination`, `FilterBar`, `SearchInput`, `Dialog` | Tabelas de auditoria e lista de contatos | **Adotar** | Mascaramento de PII preservado, foco em diálogo | Médio (~25kB) | Baixo | Baixa | Fase 7 |

---

## 4. Fronteiras Inegociáveis: O que NÃO deve usar Astryx

1. **Canvas e Renderizadores Gráficos do Mapa de Revisão (Engrama):**
   * O **Grafo 2D** ([`ConstellationCanvas.tsx`](file:///C:/Users/user/concurso-ai/apps/frontend/src/features/map/components/ConstellationCanvas.tsx)) e o **Universo 3D** ([`Constellation3DCanvas.tsx`](file:///C:/Users/user/concurso-ai/apps/frontend/src/features/map/components/Constellation3DCanvas.tsx)) utilizam cálculos espaciais específicos (física maleável `d3-force`, WebGL com Three.js, shaders de partículas sinápticas e raycasters).
   * **Decisão:** O núcleo dos grafos **não usa Astryx**. O Astryx será aplicado **apenas no entorno (chrome)**: painel lateral (`NodeActionDrawer`), controles flutuantes de zoom, alternador de visão (`MapViewSwitcher`), legenda de convenções e modais de exportação.
2. **Heatmap de Constância dos Estudos:**
   * O mapa de calor de contribuições estilo GitHub/Engrama possui lógica de cálculo temporal de ofensiva e renderização SVG leve e otimizada.
   * **Decisão:** Manter o componente SVG nativo, padronizando apenas as cores de preenchimento pelos novos tokens semânticos OKLCH.
3. **Módulos de Auditoria e PII no Backend:**
   * O Astryx é exclusivamente uma biblioteca de interface frontend (`apps/frontend`). Nenhum arquivo de `apps/backend` será modificado.
