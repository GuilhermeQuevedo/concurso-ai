# 01 — Visão do Produto (PRD)

## Nome do Produto

**Concurso AI** — Plataforma inteligente de preparação para concursos públicos brasileiros.

---

## Problema

Estudantes de concursos públicos no Brasil enfrentam:

- Escassez de questões inéditas sobre temas específicos
- Dificuldade em encontrar questões alinhadas ao estilo de bancas específicas
- Falta de feedback detalhado sobre erros
- Ausência de acompanhamento personalizado de desempenho
- Materiais fragmentados (PDFs, apostilas, leis) sem integração com prática

## Solução

Uma plataforma SaaS que utiliza IA generativa para gerar questões inéditas a partir de conteúdos específicos (leis, editais, apostilas), corrigir respostas com explicações detalhadas, acompanhar desempenho e organizar estudos — tudo personalizado para a banca, disciplina e nível do concurso.

---

## Público-Alvo

### Persona Principal: Concurseiro Dedicado

- **Perfil:** 22-40 anos, graduado, estuda 4-10h/dia
- **Objetivo:** Aprovação em concurso público (federal, estadual ou municipal)
- **Dor:** Precisa de questões novas, específicas para sua banca e disciplina
- **Comportamento:** Usa QConcursos, Estratégia, Gran, mas sente falta de personalização

### Persona Secundária: Estudante Iniciante

- **Perfil:** 18-30 anos, começando a estudar para concursos
- **Objetivo:** Entender o formato das provas e identificar pontos fracos
- **Dor:** Não sabe por onde começar, precisa de orientação

---

## Diferencial Competitivo

| Plataforma        | Questões   | IA Gerativa | Importação de Docs | Personalização |
| ----------------- | ---------- | ----------- | ------------------- | -------------- |
| QConcursos        | Banco fixo | Não         | Não                 | Básica         |
| Estratégia        | Banco fixo | Não         | Não                 | Básica         |
| Gran Cursos       | Banco fixo | Não         | Não                 | Básica         |
| **Concurso AI**   | **Infinitas (IA)** | **Sim** | **Sim**         | **Total**      |

### Diferenciais-chave:

1. **Geração ilimitada de questões** via IA, no estilo da banca escolhida
2. **Base de conhecimento própria** — o usuário importa PDFs, editais, leis e a IA gera questões contextualizadas
3. **Correção com explicação** de cada alternativa (correta e incorretas)
4. **Dashboard inteligente** com estatísticas detalhadas por assunto, dificuldade e tempo
5. **Arquitetura preparada para RAG** — busca semântica e embeddings no futuro

---

## Funcionalidades Core

### F1 — Autenticação e Perfil
- Cadastro, login, JWT, refresh token
- Recuperação de senha, confirmação por e-mail
- Perfil com foto, concurso-alvo, cargo, meta diária

### F2 — Biblioteca de Conteúdos
- Estrutura hierárquica em árvore: Disciplina → Assunto → Subassunto
- CRUD completo (admin)
- Navegação intuitiva com breadcrumb

### F3 — Importador de Conteúdo
- Upload de PDF, DOCX, TXT, HTML, Markdown
- Extração de texto, separação de capítulos, criação de tópicos
- Armazenamento no banco para uso como contexto da IA
- Preparado para embeddings/RAG futuramente

### F4 — Gerador de Questões (IA)
- Configuração: disciplina, assunto, subassunto, quantidade, dificuldade, tipo, banca, tempo
- Modos: estudo (feedback imediato) e simulado (correção no final)
- Prompt rígido para o Gemini com instruções de formato e estilo
- Retorno em JSON estruturado

### F5 — Resolução de Questões
- Uma questão por vez, barra de progresso, cronômetro
- Salvar automaticamente, favoritar, anotar, marcar para revisão
- Navegação: voltar/próxima

### F6 — Correção e Feedback
- Nota, tempo, acertos, erros
- Explicação de cada alternativa
- Estatísticas por assunto/subassunto

### F7 — Dashboard e Estatísticas
- Desempenho geral e por assunto
- Tempo estudado, questões resolvidas, taxa de acerto
- Assuntos fortes e fracos
- Metas, gráficos de evolução

### F8 — Painel Administrativo
- CRUD: disciplinas, conteúdos, usuários, questões, bancas
- Logs de atividade

### F9-F15 — Funcionalidades Futuras
- Plano de estudos personalizado
- Flashcards
- Revisão espaçada (Spaced Repetition)
- Gamificação (conquistas, ranking, streaks)

---

## Roadmap

| Fase | Escopo                        | Dependência |
| ---- | ----------------------------- | ----------- |
| 1    | Estrutura do projeto          | —           |
| 2    | Autenticação                  | Fase 1      |
| 3    | CRUD de conteúdos             | Fase 2      |
| 4    | Integração Gemini             | Fase 1      |
| 5    | Gerador de questões           | Fases 3, 4  |
| 6    | Resolução de questões         | Fase 5      |
| 7    | Correção e feedback           | Fase 6      |
| 8    | Dashboard                     | Fase 7      |
| 9    | Importação de PDFs            | Fase 3      |
| 10   | IA contextual (RAG)           | Fases 5, 9  |
| 11   | Plano de estudos              | Fase 8      |
| 12   | Flashcards                    | Fase 3      |
| 13   | Revisão espaçada              | Fase 12     |
| 14   | Gamificação                   | Fase 8      |
| 15   | Publicação                    | Todas       |

---

## Critérios de Sucesso (MVP — Fases 1-8)

- Usuário consegue se cadastrar, logar e configurar perfil
- Usuário navega pela biblioteca de conteúdos
- Usuário gera questões inéditas por IA com configurações personalizadas
- Usuário responde questões em ambiente de prova
- Usuário recebe correção detalhada com explicação de cada alternativa
- Dashboard mostra estatísticas de desempenho
- Admin consegue gerenciar conteúdos e usuários
