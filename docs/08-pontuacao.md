# 08 — Pontuação (XP), níveis e recompensas

Status: **aprovada pelo produto**; implementada em PR próprio. As regras vivem em um único módulo (`packages/shared/src/xp-rules.ts`), usado pelo servidor e pelo app.

## 1. Princípios
- **Uma só moeda: o XP.** Ranking global, ranking de grupo, nível e recompensas usam o mesmo número.
- **Levemente mais difícil:** errar não pontua, existe teto diário e a ofensiva vira multiplicador (não soma fixa).
- **Nivelado:** níveis de 1 a 30, em faixas, com recompensa ao subir de faixa.
- **Tudo no servidor:** cada evento pontua uma única vez (idempotente) e respeita os tetos.

## 2. Quanto vale cada ação
| Ação | XP |
|---|---|
| Questão certa | fácil 3, média 5, difícil 8 (não pontua se acertou a mesma questão nos últimos 7 dias) |
| Questão errada | 0 |
| Sessão de questões concluída (mín. 10 questões) | +10 com 70% ou mais de acertos; +25 com 90% ou mais |
| Flashcard revisado | Acertei 2, Em dúvida 1, Errei 0 (uma pontuação por cartão por dia) |
| Revisão de tópico do edital | 6 |
| Jogo concluído | nota do jogo ÷ 5 (arredondado para baixo) |
| Redação corrigida | 20 + até 30 pela nota (1 por semana) |
| Dúvida esclarecida (quem respondeu) | 8 |
| Sala de questões (por acerto) | 3 |

## 3. Tetos por dia
Total de **250 XP por dia**. Cada fonte tem teto próprio: questões 140, flashcards 40, jogos 60, revisões 30, dúvidas 40, salas 30. Redação não entra no teto diário (1 por semana). O dia vira à meia-noite de São Paulo (UTC−3).

## 3.1 Dia de estudo (ofensiva)
Conta como dia de estudo: concluir uma sessão de questões, **ou** revisar 15 flashcards, **ou** concluir 1 jogo. As regras de escudo continuam as mesmas (1 escudo a cada 7 dias seguidos, máx. 2).

## 4. Multiplicador da ofensiva
Vale para XP de questões e flashcards (não para bônus): 1,1× com 7 dias, 1,2× com 14 dias, 1,3× com 30 dias ou mais.

## 5. Níveis e faixas
- Custo para subir do nível *n* para *n+1*: `100 + 25·n` XP. Nível 10 ≈ 2.025 XP; nível 30 ≈ 13.775 XP.
- Faixas: Calouro (1–4), Aplicado (5–9), Dedicado (10–14), Veterano (15–19), Mestre (20–24), Lenda (25–30).
- **Ao entrar em uma faixa nova:** +1 escudo de sequência (respeitando o máximo de 2), aviso no sino, selo da faixa no perfil, no ranking e no grupo, e uma conquista.

## 6. Ranking
Ranking global e de grupo usam o **XP da semana** (reset na segunda-feira, fuso de São Paulo). O XP total define o nível exibido.

## 7. Dados
- `XpEvent { userId, source, refId, xp, createdAt }` com índice único `(userId, source, refId)`: a idempotência vem do banco.
- `User.totalXp` e `User.tierRewarded` (maior faixa já premiada, para o escudo ser dado uma vez).
- **Contas antigas:** um script opcional recalcula o XP a partir do histórico (acertos por dificuldade, jogos, redações e revisões), sem tetos e sem multiplicador. Ninguém perde nível.

## 8. Fora de escopo
Moldura de avatar e loja de itens; temporadas; XP por tempo de estudo.
