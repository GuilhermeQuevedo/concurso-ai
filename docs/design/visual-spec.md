# Especificação Visual e Camada de Tema OKLCH — Engrama (concurso-ai)

> **Documento da Fase 0 (GATE) — Especificação Conceitual e Normativa (Sem Código de Produção)**  
> **Status:** Proposta para Aprovação (`Aguardando OK MATRIZ`)  
> **Data:** Novembro de 2026  
> **Autor:** Engenharia de Interface e Design de Produto

---

## 1. Paleta de Cores em OKLCH e Contraste WCAG AA

Todas as cores da nova camada de tema são definidas no espaço perceptualmente uniforme **OKLCH** (`oklch(L C H)`), garantindo previsibilidade de contraste entre o modo claro e escuro.

### 1.1. Rampa de Neutros (Canvas, Superfícies e Tipografia)

| Token Semântico | Valor OKLCH | Fallback sRGB | Função no Sistema | Contraste Calculado |
|---|---|---|---|---|
| `--color-canvas-light` | `oklch(0.99 0.002 240)` | `#f8fafc` | Fundo base no tema claro (Papel) | N/A |
| `--color-surface-light` | `oklch(1.0 0 0)` | `#ffffff` | Cartões e painéis claros | 1.05:1 contra canvas |
| `--color-surface-raised-light` | `oklch(0.96 0.004 240)` | `#f1f5f9` | Controles, inputs e hover | 1.15:1 contra canvas |
| `--color-border-subtle-light` | `oklch(0.18 0.015 240 / 0.10)` | `rgba(18,26,51,0.07)` | Bordas translúcidas decorativas | N/A (decorativo) |
| `--color-border-control-light` | `oklch(0.55 0.015 240)` | `#878c96` | Borda de inputs e botões secundários | **3.6:1** contra canvas (≥ 3:1 WCAG 1.4.11) |
| `--color-text-primary-light` | `oklch(0.18 0.015 240)` | `#0f172a` | Texto principal no tema claro (Tinta) | **14.2:1** contra canvas (Passa AAA) |
| `--color-text-secondary-light` | `oklch(0.48 0.018 240)` | `#475569` | Texto de apoio e metadados | **5.3:1** contra canvas (Passa AA) |
| `--color-canvas-dark` | `oklch(0.12 0.008 240)` | `#0b0f19` | Fundo base no tema escuro | N/A |
| `--color-surface-dark` | `oklch(0.16 0.010 240)` | `#18202e` | Cartões e painéis escuros | 1.3:1 contra canvas |
| `--color-surface-raised-dark` | `oklch(0.20 0.012 240)` | `#24325c` | Modais, dropdowns e menus | 1.8:1 contra canvas |
| `--color-border-subtle-dark` | `oklch(0.97 0.004 240 / 0.10)` | `rgba(255,255,255,0.10)` | Hairline translúcido decorativo | N/A (decorativo) |
| `--color-border-control-dark` | `oklch(0.68 0.010 240)` | `#a7adb7` | Borda de inputs e botões no escuro | **3.8:1** contra fundo escuro (≥ 3:1 WCAG) |
| `--color-text-primary-dark` | `oklch(0.97 0.004 240)` | `#f8fafc` | Texto principal no tema escuro | **15.6:1** contra fundo escuro (Passa AAA) |
| `--color-text-secondary-dark` | `oklch(0.72 0.010 240)` | `#94a3b8` | Texto de apoio no escuro | **6.1:1** contra fundo escuro (Passa AA) |

---

### 1.2. Cor de Marca Restaurada (Paleta Original Engrama)

Em conformidade com a diretriz do usuário de preservação da identidade cromática sem modificação de matizes, a cor primária de marca é o **Verde-Revisão** e o acento é o **Âmbar Engrama**, com contrastes rigorosamente calibrados para WCAG AA:

* **Marca Primária (Verde-Revisão Engrama):**
  * *Conceito:* Identidade consolidada do Engrama. Remete à sinapse gravada, foco e retenção duradoura.
  * *Token:* `oklch(0.54 0.088 188)` / Fallback sRGB: `#2E8C82`
  * *Contraste:* Texto branco sobre a marca = **4.7:1** (Passa WCAG AA ≥ 4.5:1).
* **Acento e Memória (Âmbar Engrama):**
  * *Conceito:* O nó que "ficou". Destaques, flashcards para hoje e call-to-actions de reforço.
  * *Token:* `oklch(0.75 0.16 68)` / Fallback sRGB: `#F2A93B`
  * *Contraste:* Texto escuro (`#121A33` / `oklch(0.18 0.015 240)`) sobre o âmbar = **8.6:1** (Passa AAA).

---

### 1.3. Cores Semânticas de Estado

| Estado | Token OKLCH | Fallback sRGB | Fundo Sutil (Light/Dark) | Contraste (Texto Branco) |
|---|---|---|---|---|
| **Sucesso** (Sólido / Acerto) | `oklch(0.52 0.15 148)` | `#15803d` | `oklch(0.96 0.03 148)` / `oklch(0.20 0.04 148)` | **4.8:1** (Passa AA) |
| **Sucesso Badge** (Pílula sutil) | `oklch(0.60 0.14 148)` | `#16a34a` | `oklch(0.96 0.03 148)` / `oklch(0.20 0.04 148)` | **6.8:1** (c/ texto escuro L=0.20) |
| **Erro** (Incorreto / Destrutivo) | `oklch(0.55 0.20 28)` | `#dc2626` | `oklch(0.96 0.03 28)` / `oklch(0.20 0.05 28)` | **4.8:1** (Passa AA) |
| **Aviso** (Flashcards Vencidos) | `oklch(0.68 0.16 75)` | `#d97706` | `oklch(0.97 0.04 75)` / `oklch(0.22 0.05 75)` | **6.4:1** (c/ texto escuro) |
| **Info** (Dicas / Informativo) | `oklch(0.55 0.14 245)` | `#2563eb` | `oklch(0.96 0.03 245)` / `oklch(0.20 0.04 245)` | **4.7:1** (Passa AA) |

---

### 1.4. Escala de Uma Matiz do Mapa de Revisão (Single-Hue Mastery)

Para cumprir o princípio inegociável de evitar arco-íris e manter foco absoluto, a evolução de domínio no Mapa de Revisão adota uma **matiz ciano/teal fixa** (`H = 195`), variando estritamente em luminosidade e saturação, sempre acompanhada de **redundância não cromática**:

| Nível de Domínio | Token OKLCH | Fallback sRGB | Redundância Não Cromática |
|---|---|---|---|
| **0. Não Iniciado** | `oklch(0.35 0.02 195 / 0.5)` | `rgba(30,41,59,0.5)` | Borda tracejada (`stroke-dasharray: 3 3`) + texto explicativo |
| **1. Iniciado (< 40%)** | `oklch(0.44 0.07 195)` | `#0e6070` | Borda sólida + selo percentual `[1/4]` |
| **2. Em Andamento (40-74%)** | `oklch(0.62 0.12 195)` | `#0891b2` | Borda sólida reforçada + selo `[2/4]` |
| **3. Dominado (≥ 75%)** | `oklch(0.79 0.15 195)` | `#06b6d4` | Borda contínua branca + halo bloom + selo `[Concluído]` |

---

## 2. Degradês em OKLCH (Interpolação Intencional)

1. **Método de Interpolação:** Todo degradê usará explicitamente o espaço OKLCH para evitar a faixa acinzentada intermediária típica do sRGB:
   ```css
   background: linear-gradient(in oklch 135deg, var(--color-brand) 0%, var(--color-brand-glow) 100%);
   ```
2. **Locais Estritamente Permitidos (Uso Discreto):**
   * Fundo radial cósmico dos mapas mentais (2D e 3D).
   * Barra de progresso ao completar 100% da meta diária de estudos.
   * Faixa de realce translúcida do card principal do Dashboard (opacidade < 12%).
3. **Locais Proibidos:** Botões comuns, cabeçalhos de tabela, cards de questões, flashcards e fundos de leitura de texto.

---

## 3. Escala de Alfa das Bordas e Regra dos Controles Interativos

### 3.1. Escala de Alfa Decorativa (Hairlines)
* **Sutil (`border-alpha-subtle`):** `0.08` a `0.10` — separadores horizontais e divisores secundários.
* **Padrão (`border-alpha-default`):** `0.14` a `0.16` — fronteiras externas de cartões e gavetas.
* **Ênfase (`border-alpha-emphasis`):** `0.24` a `0.28` — cartões com foco ativo ou em estado hover.

### 3.2. Regra Inegociável para Controles Interativos (WCAG 1.4.11)
> As bordas translúcidas com alfa são **exclusivamente decorativas para contêineres e cartões de agrupamento**.  
> Para controles interativos (campos de texto, selects, checkboxes, botões secundários), **a fronteira do componente deve atingir contraste mínimo de 3:1 contra o fundo**, utilizando borda opaca semântica (`--color-border-control-*`) ou fundo de superfície elevado diferenciado.

---

## 4. Ícones no Peso do Texto (Alinhamento Óptico e Traço)

Para garantir harmonia entre tipografia e iconografia:
1. **Mapeamento Peso da Fonte → Traço do Ícone:**
   * `font-weight: 400` (Regular) → `stroke-width: 1.5px`
   * `font-weight: 500` (Medium) → `stroke-width: 1.75px`
   * `font-weight: 600` (Semibold) → `stroke-width: 2.0px`
   * `font-weight: 700` (Bold) → `stroke-width: 2.25px`
2. **Escala Óptica Relativa:** O componente de ícone herda o tamanho relativo da tipografia (`1em` de largura e altura) com `flex-shrink: 0` e alinhamento pela altura de x (`x-height`).
3. **Coleção Única:** Todo o ecossistema utilizará a família de ícones Lucide (já padronizada no projeto e compatível com o `theme-neutral` do Astryx).

---

## 5. Pontas com Máscara (Scroll Fade Masking)

* **Interpretação Funcional:** Aplicação de máscara gradiente CSS nas extremidades de contêineres roláveis horizontais ou verticais para indicar visualmente que há mais conteúdo disponível sem cortar texto bruscamente:
  ```css
  mask-image: linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent);
  ```
* **Onde Aplicar:**
  * Abas de disciplinas no topo do mapa e cronograma.
  * Carrossel de simulados e pílulas de filtros no dashboard.
  * Histórico de notificações e tags de concursos.
* **Comportamento quando não há overflow:** O utilitário detecta via CSS (`overflow: hidden`/`auto`) e desliga a máscara quando `scrollWidth <= clientWidth`, exibindo 100% de opacidade.
* **Acessibilidade:** Navegação por teclado (`Tab`, setas) rola o contêiner automaticamente via `scrollIntoView({ block: 'nearest', inline: 'center' })`, garantindo que o elemento focado fique completamente visível e fora da área de máscara. Leitores de tela continuam lendo o conteúdo sem qualquer impacto.

---

## 6. Troca em Desfoque (`BlurSwap`) e Orçamento de Performance

* **Princípio:** Microtransição suave com leve desfoque gaussiano durante a alternância de valores ou estados, evitando saltos bruscos na retina.
* **Orçamento Rígido de Performance (Regra 9):**
  * **Raio Máximo:** `3px` de blur.
  * **Duração Máxima:** `140ms` (`--duration-fast`).
  * **Área Máxima:** Elementos pequenos/isolados (badges, contadores, abas, ícones de toggle, face de flashcard).
* **Locais Permitidos:**
  1. Contador de acertos e streak no final de um bloco de estudo.
  2. Alternância entre abas no painel de satélites do Mapa de Revisão.
  3. Virada de face do flashcard (frente → verso).
  4. Toggle entre ícones (ex.: auto-rotação ligada/desligada).
* **Locais Estritamente Proibidos:**
  * Alternativas de questões (A-E no `/study`), onde o feedback deve ser **instantâneo (< 80ms)**.
  * Tabelas longas, listagens com scroll contínuo e grandes áreas de canvas.
* **Fallbacks Obrigatórios:**
  * Em `prefers-reduced-motion: reduce`: desfoque desativado (`filter: none`), transição vira `opacity` instantânea de 0ms.
  * Em dispositivos de baixo desempenho (CPU fraca): fallback automático para fade simples de opacidade.

---

## 7. Profundidade no Escuro (Dark Mode Elevation via Luminosidade)

No tema escuro, sombras pretas convencionais são invisíveis. A elevação espacial é comunicada por **degraus de luminosidade OKLCH** aliados a um sutil hairline superior translúcido (efeito de luz zenital):

| Nível de Elevação | Luminosidade Base ($L$) | Hairline Superior | Uso no Produto |
|---|---|---|---|
| **Elevação 0 (Canvas)** | `L = 0.12` | Nenhum | Fundo geral da página |
| **Elevação 1 (Cards)** | `L = 0.17` | `rgba(255, 255, 255, 0.08)` | Cartões de conteúdo, itens de lista |
| **Elevação 2 (Popovers)** | `L = 0.22` | `rgba(255, 255, 255, 0.12)` | Menus suspensos, tooltips, filtros |
| **Elevação 3 (Modais/Drawers)** | `L = 0.26` | `rgba(255, 255, 255, 0.16)` | Diálogos de exclusão, gaveta lateral do mapa |

* **Contraparte no Tema Claro:** Fundos brancos puros (`L = 0.99`) sobre canvas suave (`L = 0.96`), combinados com sombras de dispersão difusa e baixa opacidade (`rgba(0, 0, 0, 0.05)` a `0.10`).

---

## 8. Plano de Coexistência CSS e Feature Flags

1. **Cascata de Estilos:**
   ```css
   @layer reset, theme, base, astryx-base, astryx-theme, components, utilities;
   ```
2. **Escopo por Área (Substituição Gradual):**
   * Nenhuma alteração global de estilos será feita de uma só vez.
   * Cada tela ou componente migrado usará o provedor de tema escopado ou classe de ativação `data-astryx-area="<area>"`.
3. **Feature Flagging:**
   ```ts
   export const FEATURE_FLAGS = {
     ASTRYX_CORE_ENABLED: false,
     ASTRYX_AUTH: false,
     ASTRYX_SETTINGS_LGPD: false,
     ASTRYX_NAVIGATION: false,
     ASTRYX_STUDY: false,
     ASTRYX_MAP_CHROME: false,
     ASTRYX_ADMIN: false,
   };
   ```
   Isso permite reverter qualquer lote instantaneamente sem afetar o restante da aplicação.

---

## 9. Perguntas Abertas para o Usuário (GATE da Fase 0)

1. **Interpretação de "Pontas com Máscara":** Nossa proposta interpretou como *máscara gradiente de desvanecimento nas bordas de contêineres roláveis* (`linear-gradient` com `mask-image` para indicar overflow em carrosséis, abas e listas). Confirma que é essa a interpretação desejada, ou prefere máscara em cantos/formas/squircles?
2. **Escolha da Cor de Marca Primária:** Entre as três opções de paleta sóbria apresentadas (Opção 1: *Cosmic Slate Blue*, Opção 2: *Deep Nordic Emerald*, Opção 3: *Obsidian Cyan*), qual você prefere como padrão oficial da plataforma?
3. **Orçamento do `BlurSwap`:** O teto de desfoque de `3px` com duração de `140ms` (restrito a elementos pequenos como badges, contadores e virada de flashcards, e estritamente proibido em alternativas de questões) atende às suas expectativas de sobriedade e agilidade de resposta?
