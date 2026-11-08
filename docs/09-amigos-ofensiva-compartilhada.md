# 09 — Amigos, ofensiva compartilhada e avisos de atividade

Status: **proposta para aprovação** (nenhum código escrito). Complementa `docs/07-grupos-colaborativos.md` (grupos) e `docs/08-pontuacao.md` (XP e níveis).

## 1. Objetivo
Dar um motivo a mais para estudar todo dia: ter **amigos** na plataforma, manter uma **ofensiva em dupla** (se um falta, os dois perdem) e receber **avisos dentro da plataforma** quando o amigo ainda não estudou hoje.

Definição de "dia de estudo" (já em vigor): concluir uma sessão de questões, **ou** revisar 15 flashcards, **ou** concluir 1 jogo. O dia vira à meia-noite de São Paulo.

## 2. Entregas e PRs
| PR | Conteúdo | Migração |
|----|----------|----------|
| F1 | Amigos: código pessoal, convite por nickname ou código, aceitar/recusar, lista e remover | `User.friendCode`, `Friendship` |
| F2 | Perfil do amigo (nível, ofensiva, XP da semana, tempo de estudo) e privacidade | `User.showStats` |
| F3 | **Ofensiva em dupla** (pacto entre dois amigos) e registro dos dias de estudo | `StudyDay`, `PairStreak` |
| F4 | Avisos: amigo ainda não estudou hoje, cutucada ("Bora estudar!") e ofensiva em risco | `Notification` (já existe) + chave de unicidade |

Ordem F1 → F2 → F3 → F4, um PR por vez. Cada fase mantém Controller → Service → Repository, Zod nos inputs e o formato de resposta padrão.

## 3. F1 — Amigos
- **Código pessoal** (`friendCode`): 8 caracteres do alfabeto sem ambíguos (como o código de grupo), único, gerado na primeira vez que a pessoa abre "Amigos". Dá para regenerar.
- **Convidar:** por **nickname** ou por **código**. Cria um pedido `PENDING`; a outra pessoa recebe aviso no sino e aceita ou recusa.
- Regras: não convida a si mesma, nem quem já é amigo, nem quem já tem pedido pendente; se a outra pessoa já tinha enviado um pedido para você, o convite vira aceite automático.
- **Segurança:** limite de 20 pedidos por hora (mesmo limite dos convites de grupo); a resposta de "não encontrado" é igual para nickname e código inexistentes; e-mail nunca aparece para o amigo, só nome e nickname.
- Modelo: `Friendship { userLowId, userHighId, requestedById, status, createdAt }` com índice único no par (ordenado), para existir uma única linha por dupla.
- Tela "Amigos" no menu (junto de Competição): lista, pedidos recebidos/enviados, botão "Copiar meu código", "Convidar por WhatsApp" (mesmo `wa.me` dos grupos), remover amigo.

## 4. F2 — Perfil do amigo e privacidade
- Ao tocar em um amigo: nome, nickname, **nível e faixa**, **🔥 ofensiva atual e recorde**, **XP da semana**, **tempo de estudo na semana** e, se houver, a ofensiva em dupla com você.
- **Privacidade (`showStats`, padrão ligado para amigos):** quem desliga mostra aos amigos só nome e nickname. Quem **não é amigo** nunca vê estatísticas.
- No ranking de grupo e no global aparece o 🔥 da ofensiva **somente de quem deixou as estatísticas visíveis** (opt-in no Perfil).
- Tempo de estudo vem das sessões já registradas (soma de tempo das sessões de questões e dos jogos da semana).

## 5. F3 — Ofensiva em dupla
**Pacto, não automático.** Dois amigos criam uma ofensiva em dupla: um convida, o outro aceita. Cada pessoa pode ter até **3 ofensivas em dupla** ativas (para não virar obrigação com muita gente).

**Regra do dia:** para a dupla, o dia conta quando **os dois** tiveram dia de estudo. Se um falta, **os dois perdem** a ofensiva da dupla (volta a 0). O recorde da dupla é guardado.

**Escudo:** o escudo pessoal de quem faltou pode cobrir o dia (consome 1 escudo dessa pessoa), igual à ofensiva individual. Sem escudo, a dupla quebra.

**Como calcular sem tarefa agendada:**
- Nova tabela `StudyDay { userId, date (AAAA-MM-DD, São Paulo) }`, única por pessoa e dia, criada quando o dia de estudo é cumprido (no mesmo ponto onde hoje a ofensiva individual é atualizada).
- A ofensiva da dupla é **calculada de forma preguiçosa**: ao abrir a tela, ou quando qualquer um estuda, o servidor percorre os dias fechados desde a última avaliação, aplica a regra acima e grava (`PairStreak { current, longest, lastEvaluatedDate }`). O dia de hoje fica "pendente" até acabar: a tela mostra "você ✓ · amigo ⏳".
- Nenhum recálculo pode contar o mesmo dia duas vezes (guarda em `lastEvaluatedDate`).

**Tela:** card "Ofensiva em dupla" na Visão Geral e na tela do amigo: 🔥 da dupla, recorde, e o estado de hoje de cada um.

## 6. F4 — Avisos dentro da plataforma
Todos usam o sino que já existe (`Notification`), sem e-mail nem push.
1. **Amigo ainda não estudou hoje:** se você já cumpriu o dia e seu parceiro de ofensiva em dupla não, e já passou das **18h (São Paulo)**, você recebe "Seu parceiro ainda não estudou hoje. A ofensiva de N dias está em risco." Uma vez por dia por dupla.
2. **Ofensiva em risco para você:** às **20h**, se você ainda não estudou e tem ofensiva em dupla ativa, aviso para você.
3. **Cutucada:** botão "Bora estudar!" no perfil do amigo. Limite de 1 por amigo por dia; o amigo vê "@nick te chamou para estudar".
- **Como gerar sem cron externo:** um agendador simples dentro do próprio backend roda a cada 15 minutos e cria os avisos. Cada aviso tem chave única `(usuário, tipo, dupla, dia)`, então rodar duas vezes nunca duplica. (Se o servidor passar a ter mais de uma instância, trocar por tarefa agendada do sistema.)
- O aviso some quando a pessoa estuda (o app esconde avisos de "ainda não estudou" de quem já cumpriu o dia).

## 7. Segurança e privacidade
- Toda rota valida que as duas pessoas são amigas (aceitas) antes de mostrar qualquer dado.
- Estatísticas de quem desligou a visibilidade nunca são enviadas ao amigo (o servidor filtra, não só o app).
- Limites por hora nos pedidos de amizade, cutucadas e criação de pactos.
- Remover amigo encerra os pactos entre os dois e apaga os pedidos pendentes.

## 8. Fora de escopo (por enquanto)
Bate-papo entre amigos, desafios 1×1, ranking só de amigos, e-mail ou push, grupos de ofensiva com mais de duas pessoas.

## 9. Decisões para você
1. **Escudo cobre a falta do amigo?** Proposta: sim, com o escudo de quem faltou. Alternativa: dupla não aceita escudo (mais rígido).
2. **Horários dos avisos:** 18h para avisar o parceiro e 20h para avisar você. Está bom?
3. **Limite de 3 ofensivas em dupla por pessoa.** Está bom?
4. **Privacidade padrão:** estatísticas visíveis para amigos já ligado, e 🔥 no ranking só para quem ativar. Está bom?
5. **Código pessoal de 8 caracteres.** Está bom (o de grupo tem 6)?
