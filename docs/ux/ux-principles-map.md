# Mapa de Encaixe de UX e Movimento — Engrama (concurso-ai)

> **Documento de Auditoria e Mapeamento de Princípios (Fase 0 — GATE)**  
> **Status:** Proposta para aprovação (`OK MAPA UX`)  
> **Data:** Novembro de 2026  
> **Autores:** Engenharia de UX / Design de Interação  
> **Stack frontend verificada:** React 19, TypeScript estrito, Tailwind CSS v4, Lucide React, TanStack Query, Radix/CVA utilitários. Não há bibliotecas de animação de terceiros (sem Framer Motion); todo movimento deve ser construído sobre CSS moderno / Tailwind / CSS Custom Properties.

---

## 1. Inventário Real do Frontend

### 1.1. Rotas e Telas
O aplicativo utiliza `react-router` com rotas públicas e rotas autenticadas encapsuladas por `ProtectedLayout` (`ProtectedRoute` + `SubscriptionGate` + `DashboardLayout`):

| Categoria | Rota | Componente | Descrição Funcional |
|---|---|---|---|
| **Públicas** | `/` ou `/landing` | `LandingPage.tsx` | Apresentação institucional, planos e preços, FAQ |
| | `/login` | `LoginPage.tsx` | Formulário de autenticação por e-mail/senha |
| | `/register` | `RegisterPage.tsx` | Cadastro com validação de termos e senha |
| | `/forgot-password` | `ForgotPasswordPage.tsx` | Solicitação de recuperação de senha |
| | `/reset-password` | `ResetPasswordPage.tsx` | Redefinição de senha com token |
| | `/politica-de-privacidade` | `PrivacyPolicyPage.tsx` | Textos legais e preferências de cookies |
| | `/politica-de-cookies` | `CookiePolicyPage.tsx` | Política de cookies LGPD |
| | `/termos-de-uso` | `TermsOfUsePage.tsx` | Termos de serviço |
| **Principal** | `/dashboard` | `DashboardPage.tsx` | Painel geral: ofensiva, metas diárias, revisões pendentes, atalhos rápidos |
| **Planejamento** | `/contests` | `ContestsPage.tsx` | Gestão de editais/concursos, árvore de matérias e status de tópicos |
| | `/calendar` | `CalendarPage.tsx` | Calendário mensal e semanal com tarefas, revisões e provas |
| | `/cronograma` | `CronogramaPage.tsx` | Cronograma de estudos personalizado com wizard e reorganização inteligente |
| **Estudos (Core)** | `/generate` | `GeneratePage.tsx` | Central de questões com IA e cadernos de simulados |
| | `/study` | `StudyPage.tsx` | Interface de resolução de questões (múltipla escolha, V/F e discursiva) |
| | `/flashcards` | `FlashcardsPage.tsx` | Baralhos, repetição espaçada e modo de visualização interativo |
| | `/exam-slicer` | `ExamSlicerPage.tsx` | Fatiamento e resolução comentada de provas reais |
| | `/error-notebook` | `ErrorNotebookPage.tsx` | Caderno de erros com filtros por gravidade e tentativa de refação |
| | `/games` | `GamesPage.tsx` | Jogos educativos competitivos e cooperativos |
| | `/documents` | `DocumentsPage.tsx` | Upload e indexação de editais e resumos em PDF |
| | `/essays` | `EssayPage.tsx` | Envio e avaliação analítica de redações/estudos de caso |
| **Progresso** | `/stats` | `StatsPage.tsx` | Gráficos de retenção, precisão e horas de estudo |
| | `/memory-simulator` | `MemorySimulatorPage.tsx` | Simulador visual da curva de esquecimento de Ebbinghaus |
| | `/achievements` | `AchievementsPage.tsx` | Conquistas desbloqueáveis e sistema de insígnias |
| | `/rankings` | `RankingsPage.tsx` | Ranking semanal e geral de XP entre estudantes |
| | `/groups` | `GroupsPage.tsx` | Grupos de estudo, salas ao vivo (lobby) e dúvidas compartilhadas |
| | `/friends` | `FriendsPage.tsx` | Lista de amigos, solicitações e código de convite |
| **Sistema & Conta** | `/profile` | `ProfilePage.tsx` | Dados cadastrais, avatar e código de amigo |
| | `/settings` | `SettingsPage.tsx` | Preferências de notificações, faturamento Stripe e dados |
| | `/help` | `HelpPage.tsx` | Central de ajuda, suporte e dúvidas frequentes |
| | `/metodologia` | `MethodologyPage.tsx` | Explicação científica do método Engrama |
| | `/getting-started` | `GettingStartedPage.tsx` | Onboarding e guia rápido de uso |
| **Admin** | `/admin` | `AdminPage.tsx` | Painel gerencial de usuários, logs e controle LGPD |
| | `/admin/contatos` | `AdminContactsPage.tsx` | CRM de contatos comerciais |

---

### 1.2. Layouts e Navegação
- **`DashboardLayout` (`apps/frontend/src/layouts/DashboardLayout.tsx`):**
  - **Sidebar lateral fixa/retrátil (256px / 72px):** Agrupamento por categorias (`Planejamento`, `Estudos`, `Progresso`, `Conta/Suporte`).
  - **Seletor de Concurso Ativo (`ActiveStudySelector`):** Dropdown de alta relevância que filtra todo o ecossistema (calendário, matérias, cronograma).
  - **Header Superior:** Botão de menu mobile, título dinâmico, Pomodoro flutuante (`PomodoroMini`), sino de notificações (`NotificationBell`) e menu de conta (`AccountMenu`).
  - **Lembretes na Sidebar (`SidebarReminders`):** Lista recolhível de afazeres rápidos.
- **Navegação Móvel:** Drawer lateral com acionamento por overlay escuro e botão de fechar.
- **Abas de Contexto:** Vistas mensal/semanal no Calendário; abas de visão geral/disciplinas/documentos em Editais; filtros de tipos em Caderno de Questões.

---

### 1.3. Modais e Diálogos Reais
1. `ConfirmDialog.tsx`: Diálogo genérico de ações irreversíveis (exclusão de itens, desistência).
2. `GoogleCalendarPluginModal.tsx`: Conexão OAuth, sincronização de tarefas/provas e feed iCal.
3. `ItemDetailDialog.tsx`: Visualização e conclusão de tarefas/lembretes no Calendário.
4. `NewItemDialog.tsx`: Criação rápida de tarefas e lembretes por data.
5. `DeleteContestDialog.tsx`: Confirmação com opção em cascata de exclusão de PDFs associados.
6. `ConstanciaModal.tsx`: Visualização em grade do histórico de ofensiva do estudante.
7. `GenerateAIModal.tsx` / `GenerationProgressModal.tsx`: Assistente de geração de questões com IA e barra de etapas.
8. `CreateManualModal.tsx`: Criação manual de questões e alternativas.
9. `GenerateDeckModal.tsx` / `EditDeckModal.tsx` / `ManualDeckModal.tsx`: Gestão e criação de baralhos de flashcards.
10. `GameSetupModal.tsx`: Configuração de partida rápida de jogos cognitivos.
11. `CreateRoomDialog.tsx` / `SharePickerDialog.tsx` / `ShareDetailDialog.tsx`: Modais de cooperação em grupos de estudo.
12. `SavedSchedulesModal.tsx`: Alternância entre cronogramas salvos do aluno.
13. `StripeBillingModal.tsx`: Gestão de assinatura, cartões e cancelamento.
14. `RevealPiiModal.tsx`: Visualização de dados pessoais sob justificativa (Painel Admin/LGPD).

---

### 1.4. Formulários Principais
- `LoginForm.tsx` & `RegisterForm.tsx`: Autenticação e entrada de dados inicial.
- `GeneratePlanForm.tsx`: Assistente de criação de plano de estudo com data da prova e horas diárias.
- `NewContestForm.tsx`: Cadastro de edital com upload de arquivo PDF ou manual.
- `SubmitEssayForm.tsx`: Envio de tema, texto digitado ou PDF de redação para correção.
- `DeckFormFields.tsx`: Criação de flashcards com termos de lacuna (*cloze deletion*).
- `AddFriendForm.tsx`: Entrada de nickname (@nick) ou código de amigo de 8 caracteres.
- `CommentForm.tsx`: Comentários e discussões em salas de estudo.

---

### 1.5. Estados de Carregamento, Vazios e Erro
- **Skeletons:** Presentes de forma parcial em listas e tabelas (muitas telas ainda recorrem a `<Loader2 className="animate-spin" />` centralizado).
- **Empty States:** Existem em quase todas as telas principais (ex.: "Nenhuma tarefa neste dia", "Nenhum baralho criado"), porém estáticos e sem direcionamento forte de ação primária (*Staging/Appeal*).
- **Toasts (`Toaster.tsx` / `toast-store.ts`):** Sistema leve com variantes de sucesso e erro montado no rodapé inferior, sem transições de entrada escalonada ou saída suave.

---

### 1.6. Operações Assíncronas Longas (Gargalos de Percepção)
1. **Geração de Questões por IA (`GenerateAIModal`):** Duração média de 8s a 25s (dependendo da quantidade de questões e profundidade da banca).
2. **Correção de Redação por IA (`SubmitEssayForm`):** Duração média de 15s a 35s para análise de 5 competências oficiais.
3. **Mapeamento e Extração de Edital (`DocumentUploadCard` / `NewContestForm`):** Processamento OCR e chunking de PDFs longos (10s a 45s).
4. **Geração e Reorganização de Cronograma (`useScheduleGeneration` / `schedule-reorganize`):** Cálculo combinatório de distribuição de tópicos por semanas.
5. **Sincronização com Google Calendar (`calendar-integration.service`):** Processamento em lote de dezenas de eventos com limite de concorrência.

---

## 2. Matriz de Frequência de Uso e Orçamento de Animação

A frequência de uso determina o **orçamento de movimento** (Regra 6): quanto mais frequente a ação, mais curto, discreto e direto deve ser o movimento para não gerar fadiga motora ou lentidão perceptível.

| Nível de Frequência | Ações / Telas Típicas | Orçamento de Duração | Tipo de Movimento Permitido | Premissa / Status |
|---|---|---|---|---|
| **Muito Alta** (várias vezes por sessão de estudo) | - Seleção de alternativa de questão (`StudyPage`)<br>- Virar e classificar flashcard (`FlashcardViewer`)<br>- Navegação entre itens do cronograma (`ScheduleDayRow`)<br>- Alternância de abas/filtros rápidos | **80 ms – 150 ms** | Microtransições, mudança de cor/borda, leve compressão (`scale(0.98)`), fade imediato. Zero atraso de entrada. | Premissa de produto core. `CONFIRMAR COM GABRIEL` |
| **Alta** (ao menos uma vez por dia de estudo) | - Visualização e check no Calendário (`CalendarPage`)<br>- Iniciar/pausar Pomodoro (`PomodoroMini`)<br>- Consultar Dashboard (`DashboardPage`)<br>- Busca e filtro de cadernos (`GeneratePage`) | **150 ms – 220 ms** | Expansão de colapsáveis, badges de status, hover states definidos, tooltips. | Navegação diária essencial. `CONFIRMAR COM GABRIEL` |
| **Média** (1 a 3 vezes por semana) | - Criar novo edital ou enviar documento (`DocumentsPage`)<br>- Reorganizar cronograma de estudos (`CronogramaPage`)<br>- Consultar Estatísticas / Ranking (`StatsPage`, `RankingsPage`)<br>- Jogar partida rápida (`GamesPage`) | **200 ms – 300 ms** | Abertura de modais, transições de gráficos, transições de páginas com fade suave. | Fluxo de acompanhamento semanal. `CONFIRMAR COM GABRIEL` |
| **Rara / Alto Significado** (ocasional ou decisiva) | - Conclusão de simulado / Prova inteira<br>- Envio de redação para a IA (`EssayPage`)<br>- Atingimento de meta de longo prazo / Conquista desbloqueada<br>- Exclusão de edital / Reset de conta | **300 ms – 500 ms** | Movimentos expressivos: antecipação, comemoração suave (*secondary action*), feedback modal encenado, assentamento estável. | Eventos de celebração ou irreversibilidade. `CONFIRMAR COM GABRIEL` |

---

## 3. Matriz de Encaixe dos 18 Princípios

---

### Princípio 1: Squash and Stretch (Compressão e Estiramento)
* **Definição em 1 linha:** Deformação elástica instantânea que confere sensação de massa e resposta física ao toque, preservando o volume aparente.
* **Critério de encaixe perfeito:** Botões primários de confirmação, botões de ação tátil (toggle, responder questão, rating de flashcard) ao serem clicados ou pressionados.
* **Critério de não encaixe:** Modais, tabelas, textos de leitura, cards de conteúdo extenso ou qualquer elemento em telas de leitura longa.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `Button.tsx` (variante `primary` e `accent`) | `active:bg-primary-800` sem feedback tátil de deformação. | Adicionar `active:scale-[0.98] transition-transform` de 100ms preservando área e foco. | Muito Alta | P | Baixo | **Aplicar** |
| `StudyPage.tsx` (Alternativas A, B, C, D, E) | `active:scale-[0.995]` tímido e imperceptível. | `active:scale-[0.985]` no clique da alternativa antes de travar a resposta. | Muito Alta | P | Baixo | **Aplicar** |
| `FlashcardViewer.tsx` (Botões de nota 1, 2, 3) | Clique seco sem retorno elástico. | Microcompressão com retorno elástico suave ao avaliar o card. | Muito Alta | P | Baixo | **Aplicar** |
| `CalendarMonthView.tsx` (Células de dias) | Apenas mudança de fundo no clique. | Manter estático; deformar célula distorce o alinhamento da grade tabular. | Alta | P | Médio | **Não se aplica** |

> **Justificativa:** O princípio só tem sentido mecânico quando simula um gatilho físico sob o dedo/cursor. Em grades tabulares (como o calendário mensal), deformar elementos gera quebra de alinhamento visual com as colunas vizinhas.

---

### Princípio 2: Anticipation (Antecipação)
* **Definição em 1 linha:** Movimento preparatório sutil que sinaliza que uma ação importante ou irreversível está prestes a ocorrer.
* **Critério de encaixe perfeito:** Ações de alto significado, potencialmente destrutivas (exclusões) ou de virada de estado físico (iniciar prova, virar flashcard).
* **Critério de não encaixe:** Ações rotineiras de alta frequência (navegar abas, digitar, fechar avisos corriqueiros), onde qualquer atraso irrita.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `ConfirmDialog.tsx` (Botão Excluir) | Dispara imediatamente ao clique sem aviso físico. | Recuo leve de escala (`scale(0.97)`) durante o pressionamento antes do loader. | Média | P | Baixo | **Aplicar** |
| `FlashcardViewer.tsx` (Flip do card) | Substituição abrupta do texto com timeout estático de 450ms. | Leve inclinação prévia (-2deg) antes de iniciar a rotação completa do card. | Muito Alta | M | Baixo | **Aplicar** |
| `StudyPage.tsx` (Finalizar Simulado) | Finalização sem transição de encerramento. | Diálogo com estado de preparação visual antes de compilar os resultados. | Rara | P | Baixo | **Aplicar** |
| `Sidebar.tsx` (Itens de menu) | Hover simples de cor. | Antecipar hover atrasaria o clique do menu principal. | Muito Alta | P | Alto | **Não se aplica** |

> **Justificativa:** Aplicar antecipação em botões de navegação cria percepção de lag (latência artificial). O uso exclusivo em ações com peso psicológico (flip do flashcard e ações destrutivas) valoriza o momento da interação.

---

### Princípio 3: Staging (Encenação)
* **Definição em 1 linha:** Organização da cena para direcionar a atenção do usuário a um único foco de cada vez, atenuando ruídos periféricos.
* **Critério de encaixe perfeito:** Abertura de modais, diálogos de confirmação, telas de simulado e foco na resolução de questões.
* **Critério de não encaixe:** Dashboards analíticos ou listas densas onde o usuário precisa de visão panorâmica simultânea.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Modais (`ConfirmDialog`, `NewItemDialog`, `GenerateAIModal`) | Abrem subitamente; fundo fica escuro sem transição de foco. | Fade-in suave de backdrop (`rgba(0,0,0,0.4)` -> `0.6`) com `backdrop-blur-xs` e foco preso no diálogo. | Alta | M | Baixo | **Aplicar** |
| `StudyPage.tsx` (Ambiente de Prova) | Vários elementos concorrem pela atenção durante a leitura da questão. | Atenuar cronômetro e ações secundárias quando a questão estiver ativa; destaque na alternativa correta no gabarito. | Muito Alta | M | Médio | **Aplicar** |
| `GenerationProgressModal.tsx` | Fundo preto chapado com loader no centro. | Encenar as 4 etapas com iluminação direcionada na etapa em execução e esmaecimento das pendentes. | Alta | M | Baixo | **Aplicar** |
| `StatsPage.tsx` (Métricas de estudo) | Múltiplos gráficos na tela. | Não aplicar encenação focada; o aluno necessita comparar métricas lado a lado. | Média | M | Alto | **Não se aplica** |

> **Justificativa:** O simulado e os modais exigem zero distração. Já o painel de estatísticas perde valor se tentar esconder gráficos para forçar um único ponto focal.

---

### Princípio 4: Pose to Pose (Pose a Pose)
* **Definição em 1 linha:** Estruturação visual baseada em estados-chave claramente definidos (idle, active, correct, incorrect, review) com transições controladas entre eles.
* **Critério de encaixe perfeito:** Controles complexos com máquinas de estado explícitas (alternativas de questão, flashcards, etapas de assistente).
* **Critério de não encaixe:** Elementos de conteúdo contínuo ou texto livre sem estados fixos.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `StudyPage.tsx` (Card da Alternativa) | Múltiplas classes concatenadas com lógica condicional dispersa. | Mapear formalmente as 5 poses: `idle` → `hover` → `selected` → `evaluating` → `correct`/`incorrect`. | Muito Alta | M | Baixo | **Aplicar** |
| `FlashcardViewer.tsx` (Face do card) | Troca booleana `flipped ? back : front` sem geometria contínua. | Definir poses: `front` (0deg), `turning` (90deg), `back` (180deg), `feedback` (sucesso/erro). | Muito Alta | M | Baixo | **Aplicar** |
| `ScheduleDayRow.tsx` (Dia do cronograma) | Checkbox simples com opacidade. | Poses: `pendente`, `concluído`, `descanso`, `reorganizado`. | Alta | P | Baixo | **Aplicar** |

> **Justificativa:** Tratar alternativas e flashcards como máquinas de estados visuais elimina bugs visuais de classes conflitantes e garante transições previsíveis e reproduzíveis.

---

### Princípio 5: Follow Through e Overlapping Action (Continuidade e Sobreposição)
* **Definição em 1 linha:** Movimentos em que partes do elemento continuam se movendo suavemente após o elemento principal parar, assentando sem rigidez.
* **Critério de encaixe perfeito:** Aparição de toasts, abertura de gavetas/drawers, carregamento de listas curtas de cartões e preenchimento de barras de progresso.
* **Critério de não encaixe:** Listas com mais de 10 itens (paginação ou scroll infinito), tabelas extensas e ações repetidas de estudo.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `Toaster.tsx` | Toast surge de forma seca no canto da tela. | Slide vertical com overshoot de assentamento suave (5px) desacelerando na posição final. | Alta | P | Baixo | **Aplicar** |
| `ExamsPanel.tsx` / `StatCards.tsx` | Todos os cards surgem juntos instantaneamente. | Entrada escalonada (*stagger*) de 35ms apenas nos 3 ou 4 primeiros cards. | Alta | P | Baixo | **Aplicar** |
| `progress.tsx` (Barras de progresso e XP) | Barra avança com interpolação linear simples. | Progresso avança com desaceleração e pequeno "pouso" estável no valor alvo. | Alta | P | Baixo | **Aplicar** |
| `DocumentList.tsx` (Tabela de documentos) | Linhas de tabela de documentos. | Não escalonar linhas de tabela; causa atraso para interagir com o conteúdo. | Média | P | Médio | **Não se aplica** |

> **Justificativa:** Escalonar tabelas ou listas longas obriga o usuário a esperar itens caírem na tela para poder clicar. Deve ser restrito a cards de topo de página (máximo 4 itens).

---

### Princípio 6: Slow In / Slow Out (Aceleração e Desaceleração)
* **Definição em 1 linha:** Movimento orgânico que inicia suavemente e freia ao parar, eliminando transições mecânicas lineares na interface.
* **Critério de encaixe perfeito:** 100% dos movimentos de interface (aberturas, recolhimentos, expansões, tooltips, modais).
* **Critério de não encaixe:** Indicadores de carregamento contínuos (spinners e barras de progresso indeterminadas), que devem ser lineares.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Sistema Global (`tokens.css` e CSS) | Ausência de tokens padronizados de easing; uso de `ease` padrão do navegador. | Definir variáveis: `--ease-out-standard`, `--ease-in-standard`, `--ease-in-out-smooth` e `--ease-overshoot`. | Global | P | Baixo | **Aplicar** |
| `DashboardLayout.tsx` (Sidebar retrátil) | Transição com curva hardcoded `cubic-bezier(0.4, 0, 0.2, 1)`. | Padronizar com o token global `--ease-in-out-smooth`. | Alta | P | Baixo | **Aplicar** |
| `WeekCollapsible.tsx` (Semanas do cronograma) | Expansão sem curva suave documentada. | Aplicar `--ease-out-standard` ao abrir e `--ease-in-standard` ao recolher. | Alta | P | Baixo | **Aplicar** |
| Spinners de Loading (`Loader2`) | `animate-spin` linear. | Manter rotação estritamente linear; curvas variáveis em spinners causam sensação de engasgo. | Alta | - | - | **Não se aplica** |

> **Justificativa:** O olho humano rejeita acelerações bruscas em objetos de tela. Curvas centrais garantem que toda a interface respire sob a mesma física visual.

---

### Princípio 7: Secondary Action (Ação Secundária)
* **Definição em 1 linha:** Movimento complementar de apoio que enriquece a ação principal sem disputar o foco com ela.
* **Critério de encaixe perfeito:** Incremento numérico de pontuação/XP enquanto o feedback de acerto de questão é exibido; animação suave da chama de ofensiva ao bater meta.
* **Critério de não encaixe:** Ações onde a informação secundária confunda a compreensão da primária (ex.: animações simultâneas em formulários de pagamento).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `StudyPage.tsx` (Header de pontuação / acertos) | Ao responder certo, a tela apenas colore a alternativa. | O contador de acertos no topo incrementa suavemente como ação de apoio à resposta certa. | Muito Alta | M | Baixo | **Aplicar** |
| `MetasCard.tsx` (Meta diária atingida) | Número de minutos vira 100% de repente. | Microbrilho suave na barra de progresso após o preenchimento completo. | Alta | P | Baixo | **Aplicar** |
| `PomodoroMini.tsx` (Ciclo concluído) | Alerta simples no contador. | Pulso sutil no ícone de fogo/chama na barra superior ao término do bloco. | Média | P | Baixo | **Aplicar** |
| `StripeBillingModal.tsx` | Confirmação de assinatura. | Manter sóbrio e estático; telas de cobrança exigem foco total e clareza. | Rara | P | Médio | **Não se aplica** |

> **Justificativa:** Ações secundárias devem recompensar o esforço cognitivo do estudante de forma elegante, sem nunca interferir no raciocínio ou em fluxos financeiros.

---

### Princípio 8: Timing (Temporização)
* **Definição em 1 linha:** Calibração exata das durações de cada movimento de acordo com a massa aparente do objeto, distância percorrida e frequência de repetição.
* **Critério de encaixe perfeito:** Estabelecer uma tabela de tempos semânticos universais consumidos por todos os componentes.
* **Critério de não encaixe:** Durações fixadas "no olho" com valores arbitrários espalhados pelo código (ex.: 120ms, 450ms, 220ms).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Sistema Global (`tokens.css`) | Tempos soltos em classes Tailwind (`duration-150`, `duration-300`). | Criar tokens: `--duration-instant` (80ms), `--duration-fast` (150ms), `--duration-base` (220ms), `--duration-slow` (320ms), `--duration-deliberate` (450ms). | Global | P | Baixo | **Aplicar** |
| `FlashcardViewer.tsx` | Timeout fixo de `450ms` em código TS. | Vincular ao token semântico `--duration-deliberate` para garantir sincronia com o CSS. | Muito Alta | P | Baixo | **Aplicar** |
| Tooltips e Badges de apoio | Surgem em tempos variados. | Padronizar com `--duration-fast` (150ms). | Alta | P | Baixo | **Aplicar** |

> **Justificativa:** Interfaces sem escala de timing passam sensação de desordem (elementos pequenos demoram muito para abrir, ou modais gigantes fecham rápido demais).

---

### Princípio 9: Solid Drawing (Desenho Sólido / Volume e Profundidade)
* **Definição em 1 linha:** Criação de coerência espacial, volumetria tridimensional e consistência de iluminação através de sombras, bordas e camadas hierárquicas.
* **Critério de encaixe perfeito:** Sistema de elevação de cartões, diferenciação de camadas (fundo, superfície, modal flutuante) e consistência geométrica de cantos.
* **Critério de não encaixe:** Efeitos de esqueumorfismo exagerado, relevos plásticos ou gradientes pesados.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Cartões de Estudo (`card-primary`, `ContestCard`, `DeckCard`) | Camadas às vezes usam `border-gray-200` e sombras discordantes. | Alinhar ao sistema de elevação em 3 níveis: Base (`--color-bg-base`), Superfície (`var(--shadow-sm)` + borda sutil) e Flutuante (`var(--shadow-lg)`). | Alta | M | Baixo | **Aplicar** |
| `PomodoroMini.tsx` (Widget flutuante) | Flutua com sombra genérica no canto. | Dar peso sólido com sombra de elevação elevada (`--shadow-md`) e borda com contraste para destacar de qualquer página. | Alta | P | Baixo | **Aplicar** |
| `CalendarMonthView.tsx` | Dias do mês sem hierarquia de volume. | Reforçar o dia atual com anel de profundidade suave em vez de apenas preenchimento plano. | Alta | P | Baixo | **Aplicar** |

> **Justificativa:** O aluno precisa reconhecer instintivamente o que é clicável, o que é conteúdo estático e o que está sobreposto na tela através do volume percebido.

---

### Princípio 10: Appeal (Carisma, Sobriedade e Acabamento)
* **Definição em 1 linha:** Qualidade estética superior pautada por precisão tipográfica, espaçamento impecável, clareza e ausência de ruído visual.
* **Critério de encaixe perfeito:** Páginas de boas-vindas, telas vazias (empty states), resumos de progresso e cartões de vitória/conquistas.
* **Critério de não encaixe:** Modismos gráficos passageiros, paletas pastel sem contraste, ícones puramente decorativos em excesso.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Empty States (Questões, Baralhos, Documentos) | Ícone cinza genérico com mensagem simples ("Nenhum item"). | Redesenhar empty states com ilustração geométrica sóbria em vetor, copy encorajador e botão de ação primária destacado. | Média | M | Baixo | **Aplicar** |
| `AchievementsPage.tsx` (Conquistas) | Lista de insígnias com badges simples. | Apresentação com acabamento refinado inspirado em design industrial (Linear/Stripe), destacando conquistas ativas sem infantilização. | Rara | M | Baixo | **Aplicar** |
| `ResultsView.tsx` (Resultado do Simulado) | Tabela direta de acertos e erros. | Cabeçalho de resultado com métrica de aproveitamento em destaque sóbrio e tipografia balanceada. | Rara | M | Baixo | **Aplicar** |

> **Justificativa:** Plataforma de concurso público exige maturidade e confiança. O "Appeal" aqui significa sofisticação, respeito ao tempo do aluno e tipografia profissional.

---

### Princípio 11: Feedback (Visibilidade do Status do Sistema)
* **Definição em 1 linha:** Comunicação imediata, clara e inequívoca sobre o resultado de qualquer ação ou estado do sistema.
* **Critério de encaixe perfeito:** Todos os cliques, submissões de formulário, cópia de links, ações de salvar e processos assíncronos.
* **Critério de não encaixe:** Ações passivas que não alteram dados (ex.: rolagem de página comum).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| Botões com `isPending` / `loading` | Alguns exibem `Loader2` e travam; outros apenas desabilitam sem indicar o motivo. | Padronizar todos os botões de ação com estado de spinner + texto indicativo (ex.: "Salvando...") e cursor apropriado. | Alta | M | Baixo | **Aplicar** |
| `InviteMembers.tsx` (Copiar código de amigo) | Feedback via toast apenas. | Mudar o botão instantaneamente para "Copiado! ✓" por 2 segundos antes de voltar ao estado inicial. | Média | P | Baixo | **Aplicar** |
| `ScheduleActions` (Reorganizar cronograma) | Toast genérico após processamento. | Indicador inline de recalculo na própria grade antes do toast final de confirmação. | Média | M | Baixo | **Aplicar** |

> **Justificativa:** O estudante nunca deve se perguntar: "será que meu clique funcionou?". Resposta perceptível imediata é o alicerce da confiança na aplicação.

---

### Princípio 12: Lei de Fitts (Ergonomia e Alvos de Toque)
* **Definição em 1 linha:** O tempo para alcançar um alvo depende da distância até ele e de seu tamanho; alvos maiores e mais próximos são mais rápidos de acertar.
* **Critério de encaixe perfeito:** Botões de resposta em questões, avançar/virar flashcards, botões de salvar, ações no mobile na zona do polegar.
* **Critério de não encaixe:** Links de rodapé secundários ou ações destrutivas (que deliberadamente devem ser mais difíceis de acionar por engano).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `StudyPage.tsx` (Botão "Responder / Próxima") | Posicionado abaixo das opções ou no rodapé, variando de posição. | Fixar botão de ação primária em barra de ação sticky na zona de fácil alcance (especialmente no mobile), com altura mínima de 48px. | Muito Alta | M | Médio | **Aplicar** |
| `FlashcardViewer.tsx` (Botões Errei / Bom / Fácil) | Botões relativamente pequenos em telas móveis. | Expandir área de toque dos 3 botões de classificação para preencher a largura total da base (mínimo 44px de altura). | Muito Alta | P | Baixo | **Aplicar** |
| `Sidebar.tsx` (Itens de navegação mobile) | Áreas clicáveis de 36px. | Aumentar padding vertical dos itens da sidebar para garantir alvo de no mínimo 44px (padrão WCAG). | Alta | P | Baixo | **Aplicar** |
| Botão "Excluir Concurso" (`DeleteContestDialog`) | Botão destrutivo. | Manter afastado das ações principais e dentro de diálogo; Fitts não deve facilitar exclusões acidentais. | Rara | - | - | **Não se aplica** |

> **Justificativa:** Em sessões longas de questões e flashcards, errar o clique por alvos pequenos gera fadiga física e perda de tempo no estudo.

---

### Princípio 13: Lei de Hick (Tempo de Decisão)
* **Definição em 1 linha:** O tempo para tomar uma decisão aumenta com o número e a complexidade das opções disponíveis.
* **Critério de encaixe perfeito:** Menus de navegação, formulários de geração de IA, filtros de questões e telas de configuração.
* **Critério de não encaixe:** Resolução de questões (onde a banca examinadora já determina as 5 alternativas fixas).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `GenerateAIModal.tsx` | Exibe quantidade, banca, matéria, dificuldade e foco simultaneamente sem hierarquia. | Organizar em revelação progressiva (*progressive disclosure*): Matéria → Quantidade (padrões rápidos 5/10/20) → Opções avançadas recolhidas. | Alta | M | Baixo | **Aplicar** |
| `CalendarFilters.tsx` | Mostra todos os tipos e todas as disciplinas de uma só vez. | Agrupar por tipo (estudo vs lembrete) e permitir busca rápida de matérias em vez de dezenas de chips soltos. | Alta | P | Baixo | **Aplicar** |
| `Sidebar.tsx` | Menu com 22 opções visíveis divididas em grupos abertos. | Manter recolhidos por padrão os grupos de menor uso semanal (`Progresso` e `Suporte`). | Alta | P | Baixo | **Aplicar** |

> **Justificativa:** Quanto menos decisões simultâneas o aluno precisar tomar para começar a estudar, mais rápido ele entra no estado de fluxo (*flow*).

---

### Princípio 14: Lei de Miller (Agrupamento Cognitivo / Chunking)
* **Definição em 1 linha:** A memória de trabalho humana processa informações com mais eficiência quando agrupadas em blocos lógicos significativos.
* **Critério de encaixe perfeito:** Divisão de tópicos do edital, detalhamento de semanas do cronograma, dashboards com muitas métricas.
* **Critério de não encaixe:** Leituras lineares de textos de apoio ou enunciados de questões discursivas.

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `CronogramaPage.tsx` / `ScheduleDetailView.tsx` | Listagem contínua de dezenas de dias. | Agrupamento explícito em Semanas e Fases de Estudo (Base, Intensificação, Revisão Final) com cabeçalhos de resumo por bloco. | Alta | M | Baixo | **Aplicar** |
| `ContestDetailView.tsx` (Disciplinas do edital) | Lista extensa de dezenas de tópicos soltos. | Manter agrupamento por disciplina com barra de progresso individual e expansão sob demanda. | Alta | P | Baixo | **Aplicar** |
| `StatsPage.tsx` | Mais de 12 números de métricas espalhados. | Agrupar em 3 blocos conceituais: *Consistência* (horas/dias), *Eficiência* (% acerto) e *Retenção* (curva de memória). | Média | M | Baixo | **Aplicar** |

> **Justificativa:** Ver 90 dias de estudo numa lista contínua paralisa o estudante por sobrecarga mental. Agrupar em ciclos semanais torna o plano digerível.

---

### Princípio 15: Limiar de Doherty (Resposta em Tempo Hábil)
* **Definição em 1 linha:** A produtividade e o engajamento aumentam significativamente quando a interação entre o usuário e o sistema ocorre em menos de 400 ms.
* **Critério de encaixe perfeito:** Validação inline de campos, optimistic updates ao marcar tarefas, transição instantânea de flashcards e resposta de botões.
* **Critério de não encaixe:** Chamadas reais de LLMs que levam 20 segundos por natureza (nestas, a resposta deve ser em progresso contínuo transparente).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `CalendarPage.tsx` / `useCalendarData.ts` (Toggle de tarefa) | Espera a mutação na API retornar para mudar o estado na tela. | Aplicar *optimistic update* imediato (< 50ms) com rollback em caso de falha de rede. | Muito Alta | M | Baixo | **Aplicar** |
| `StudyPage.tsx` (Seleção de alternativa) | Resposta visual imediata (< 80ms) ao toque, antes de submeter a resposta ao servidor. | Garantir renderização da pose selecionada no frame seguinte (< 16ms). | Muito Alta | P | Baixo | **Aplicar** |
| `GenerationProgressModal.tsx` (IA) | Barra de progresso estática por tempo estimado. | Apresentar streaming ou mensagens dinâmicas de cada etapa real para a espera não parecer congelada. | Alta | M | Médio | **Aplicar** |

> **Justificativa:** Tarefas mecânicas simples (marcar como feito, selecionar alternativa) devem parecer instantâneas para não quebrar o ritmo da sessão de estudos.

---

### Princípio 16: Lei de Postel (Princípio da Robustez)
* **Definição em 1 linha:** Seja liberal no que aceita e rigoroso no que envia; tolere variações comuns na entrada do usuário e normalize os dados.
* **Critério de encaixe perfeito:** Campos de busca, e-mail de login, inputs de nickname/amigos, datas de concurso, colagem de texto.
* **Critério de não encaixe:** Senhas de autenticação (senhas devem ser preservadas rigorosamente caractere por caractere).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `AddFriendForm.tsx` & `InviteMembers.tsx` | Exigia formato específico de nickname ou código. | Já tolera `@` inicial e maiúsculas/minúsculas; manter tolerante no frontend e normalizar no backend com trim e uppercase no código. | Média | P | Baixo | **Aplicar** |
| `LoginForm.tsx` (E-mail) | Erros comuns de espaço no final ou letras maiúsculas em teclados mobile. | Normalizar e-mail com `.trim().toLowerCase()` antes do envio. | Alta | P | Baixo | **Aplicar** |
| `NewContestForm.tsx` (Data da prova) | Validação rígida que pode falhar em formatos `DD/MM/AAAA` digitados. | Aceitar datas tanto no formato ISO quanto brasileiro e normalizar antes da requisição. | Média | P | Baixo | **Aplicar** |
| Campos de Senha (`LoginForm`, `RegisterForm`) | Senha digitada. | Proibir qualquer tipo de trim automático em senhas para não alterar a credencial do usuário. | Alta | - | - | **Não se aplica** |

> **Justificativa:** O sistema não deve punir o usuário por ter deixado um espaço acidental no final do e-mail no celular.

---

### Princípio 17: Lei de Jakob (Convenções Estabelecidas)
* **Definição em 1 linha:** Os usuários passam a maior parte do tempo em outros produtos; esperam que a sua interface funcione da mesma forma que as referências consolidadas do mercado.
* **Critério de encaixe perfeito:** Posição do menu de conta, atalhos de teclado (Espaço/Enter), ícones de fechar/voltar, paginação e breadcrumbs.
* **Critério de não encaixe:** Recursos proprietários únicos do método Engrama (ex.: simulação de retenção de memória e nó da constância).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `FlashcardViewer.tsx` (Atalhos de teclado) | Espaço vira o card; números 1, 2, 3 avaliam (convenção similar ao Anki). | Manter e deixar visíveis na UI as dicas de atalho para novos usuários. | Muito Alta | P | Baixo | **Aplicar** |
| `DashboardLayout.tsx` (Perfil e Logout) | Menu de perfil/conta no rodapé da sidebar e no topo. | Seguir padrão Linear/Notion: avatar com dropdown clássico contendo Perfil, Configurações, Tema e Sair. | Alta | P | Baixo | **Aplicar** |
| `StudyPage.tsx` (Teclas 1 a 5 para alternativas) | Apenas clique por mouse/toque. | Adicionar atalhos de teclado A-E ou 1-5 para responder questões rapidamente (padrão de plataformas de concurso). | Muito Alta | P | Baixo | **Aplicar** |

> **Justificativa:** Inovar no lugar errado (como criar formas exóticas de sair da conta ou de virar cartas) gera atrito e frustração desnecessários.

---

### Princípio 18: Frequência de Uso (Hierarquia de Acesso)
* **Definição em 1 linha:** Elementos e ações mais frequentes devem exigir o menor número de cliques e a menor distância motora, enquanto ações esporádicas ficam em camadas mais profundas.
* **Critério de encaixe perfeito:** Organização da sidebar, barra de ações rápidas no dashboard, botões de ação na resolução de questões.
* **Critério de não encaixe:** Ações críticas de emergência (ex.: suporte ou logout, que devem ser fáceis de achar, mesmo sendo raras).

| Tela / Componente | Situação Atual | Mudança Proposta | Frequência | Esforço | Risco | Decisão |
|---|---|---|---|---|---|---|
| `DashboardLayout.tsx` (Sidebar) | `Visão Geral`, `Editais`, `Calendário` e `Questões` no topo. `Redações`, `Jogos` e `Documentos` misturados. | Colocar as ações de estudo diário (`Questões`, `Cronograma`, `Flashcards`) com acesso a 1 clique; recolher itens de configuração e progresso. | Muito Alta | P | Baixo | **Aplicar** |
| `DashboardPage.tsx` (Ações Rápidas) | Botão "Continuar Estudando" e "Revisões de Hoje". | Destacar o botão "Continuar de onde parou" com maior peso visual para o aluno iniciar em 1 clique. | Alta | P | Baixo | **Aplicar** |
| `CalendarPage.tsx` (Visualizações) | Alternador mensal/semanal. | Lembrar a última visualização preferida do aluno via localStorage. | Alta | P | Baixo | **Aplicar** |

> **Justificativa:** Reduzir a fricção de entrada na sessão diária de estudos é o fator que mais impacta a retenção de longo prazo do aluno.

---

## 4. Plano de Lotes e Priorização das Fases (1 a 7)

Cada fase subsequente será executada em **lotes de no máximo 3 telas ou componentes**, priorizados pela fórmula:
$$\text{Prioridade} = \frac{\text{Impacto} \times \text{Frequência}}{\text{Risco}}$$

### 📦 Fase 1 — Fundação de Movimento e Tokens (Semana 1)
*Arquivos permitidos: `apps/frontend/src/styles/tokens.css`, `apps/frontend/src/styles/globals.css`, novo hook `useMotionPreference.ts`, documentação `docs/ux/motion-guidelines.md`.*
- **Lote 1.1:** Criação dos tokens de duração (`--duration-instant` a `--duration-deliberate`) e curvas de easing (`--ease-out-standard`, `--ease-overshoot`, etc.).
- **Lote 1.2:** Hook `useMotionPreference.ts` (integração com `prefers-reduced-motion`) e classes utilitárias no Tailwind.
- **Lote 1.3:** Testes unitários do hook e matriz de orçamentos por frequência em `docs/ux/motion-guidelines.md`.

---

### 📦 Fase 2 — Feedback e Percepção de Velocidade (Lotes de até 3 componentes)
- **Lote 2.1 (Core Estudo):**
  1. `Button.tsx`: estados completos (hover, active, disabled, loading com spinner acessível).
  2. `StudyPage.tsx`: feedback instantâneo ao selecionar alternativa e resposta visual em < 100ms.
  3. `FlashcardViewer.tsx`: resposta imediata ao teclado e toque nas classificações.
- **Lote 2.2 (Feedback do Sistema):**
  1. `Toaster.tsx` & `toast-store.ts`: transição de entrada/saída, tom sóbrio e sem poluição.
  2. `CalendarPage.tsx` / `useCalendarData.ts`: *optimistic update* imediato ao concluir tarefas.
  3. `GenerationProgressModal.tsx`: feedback transparente de etapas reais na geração com IA.

---

### 📦 Fase 3 — Entrada de Dados e Formulários (Lotes de até 3 componentes)
- **Lote 3.1 (Autenticação e Amigos):**
  1. `LoginForm.tsx`: normalização de e-mail (trim/lowercase) e feedback inline claro.
  2. `RegisterForm.tsx`: validação de senha sem trim, mensagens orientativas.
  3. `AddFriendForm.tsx`: tolerância a `@`, espaços e maiúsculas no nickname/código.
- **Lote 3.2 (Estudo e Planejamento):**
  1. `NewContestForm.tsx`: tolerância a formatos de data e drag-and-drop de edital PDF.
  2. `GeneratePlanForm.tsx`: simplificação de escolhas (Hick) e valores padrão sensatos.
  3. `GenerateAIModal.tsx`: progressive disclosure de opções avançadas de banca e dificuldade.

---

### 📦 Fase 4 — Navegação, Hierarquia e Alvos (Lotes de até 3 componentes)
- **Lote 4.1 (Navegação Global):**
  1. `DashboardLayout.tsx` (Sidebar): organização por frequência de uso e alvos mínimos de 44px.
  2. `AccountMenu.tsx`: alinhamento à convenção da Lei de Jakob (Notion/Linear).
  3. `ActiveStudySelector.tsx`: dropdown ergonômico com busca rápida de edital ativo.
- **Lote 4.2 (Telas Principais):**
  1. `DashboardPage.tsx`: destaque no botão primário "Continuar Estudando" na zona de foco.
  2. `CalendarPage.tsx`: filtros simplificados (Hick) e persistência da visualização.
  3. `CronogramaPage.tsx`: chunking (Miller) das semanas de estudo com fases bem delimitadas.

---

### 📦 Fase 5 — Linguagem de Movimento: Encenação e Continuidade
- **Lote 5.1 (Máquinas de Estados / Pose to Pose):**
  1. `StudyPage.tsx` (Alternativas): formalização das poses (`idle`, `selected`, `correct`, `wrong`).
  2. `FlashcardViewer.tsx`: flip 3D autêntico com antecipação e pose frente/verso.
  3. `WeekCollapsible.tsx`: expansão suave de semana com easing centralizado.
- **Lote 5.2 (Staging e Assentamento):**
  1. `ConfirmDialog.tsx` & `NewItemDialog.tsx`: encenação com backdrop blur e foco direcionado.
  2. `ExamsPanel.tsx` / `StatCards.tsx`: entrada escalonada suave (*follow-through*) limitada a 4 cards.
  3. `ResultsView.tsx`: encenação do resultado da prova com leitura direcionada do desempenho.

---

### 📦 Fase 6 — Expressividade Controlada
- **Lote 6.1 (Tato e Resposta Frequente):**
  1. `Button.tsx`: micro-squash tátil discreto nas variantes primárias.
  2. `StudyPage.tsx`: micro-squash na seleção de alternativas antes da confirmação.
  3. `FlashcardViewer.tsx`: micro-squash nos botões de rating.
- **Lote 6.2 (Recompensa e Acabamento):**
  1. `MetasCard.tsx` & `XpCard.tsx`: animação secundária sutil no atingimento da meta diária.
  2. Empty states de `GeneratePage.tsx`, `FlashcardsPage.tsx` e `DocumentsPage.tsx`: redesenho vetorial sóbrio.
  3. `PomodoroMini.tsx`: acabamento sólido de profundidade e pulso discreto de ciclo finalizado.

---

### 📦 Fase 7 — Verificação Final e Conformidade
1. Auditoria completa de `prefers-reduced-motion` em todos os componentes tocados.
2. Auditoria de contraste WCAG AA e navegação completa por teclado sem mouse.
3. Testes de regressão: `pnpm lint`, `pnpm test`, `tsc --noEmit`.
4. Atualização final da matriz com links para os arquivos modificados.

---

## 5. Resumo das Premissas para Confirmação

> [!IMPORTANT]
> As seguintes premissas de produto embasam o orçamento de movimento e a priorização dos lotes acima. Favor confirmar ou ajustar antes do início da Fase 1:
>
> 1. **Fluxos de altíssima frequência:** Consideramos que a resolução de questões (`StudyPage`) e o treino de flashcards (`FlashcardViewer`) são o centro da rotina diária do aluno. Devem ter animações ultra-rápidas (80–150ms) e zero latência perceptível. (`CONFIRMAR COM GABRIEL`)
> 2. **Redações (`/essays`):** Mantida como ação de frequência baixa/rara (1 a 2 vezes por semana). Não priorizada para micro-animações de repetição, mas sim para clareza e staging de envio. (`CONFIRMAR COM GABRIEL`)
> 3. **Biblioteca de Animação:** Confirmamos a decisão de **não instalar Framer Motion** para evitar peso no bundle, executando 100% das transições com CSS nativo e classes Tailwind com tokens em variáveis CSS. (`CONFIRMAR COM GABRIEL`)
> 4. **Acessibilidade e Desativação:** Em dispositivos com `prefers-reduced-motion: reduce`, todas as animações com deslocamento ou escala serão convertidas em transições imediatas ou fade curto de opacidade (sem movimento espacial). (`CONFIRMAR COM GABRIEL`)

---

*Fim do documento da Fase 0. Aguardando aprovação explícita ("OK MAPA UX") para avançar para a Fase 1.*
