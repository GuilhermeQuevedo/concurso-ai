# 07 — Grupos de estudo colaborativos

Status: **proposta para aprovação** (nenhum código escrito). Escopo: tudo acontece dentro de "Seu grupo de estudos".

## 1. Objetivo

Hoje o grupo tem código de entrada, ranking e feed. A proposta é transformá-lo em um espaço de estudo em conjunto:

1. Convidar por **nickname** e enviar o código por **WhatsApp**.
2. **Compartilhar** decks de flashcards, cronogramas e editais com o grupo.
3. **Comentar** questões e decks, com um modo de **pedir ajuda**.
4. **Responder questões juntos**, ao vivo ou no próprio ritmo (PR próprio).

## 2. Entregas e PRs

| PR | Conteúdo | Migração |
|----|----------|----------|
| G1 | Nickname, convite por nickname, notificação in-app, código por WhatsApp | `User.nickname`, `GroupInvite`, `Notification` |
| G2 | Compartilhar deck, cronograma e edital no grupo (ver e copiar) | `GroupShare` |
| G3 | Comentários em questões e decks + pedido de ajuda | `GroupComment` |
| G4 | **Sala de questões juntos** (ao vivo e no próprio ritmo) — PR próprio | `GroupRoom`, `GroupRoomPlayer`, `GroupRoomAnswer` |

G1 → G2 → G3 → G4, um PR por vez, cada um validado antes do próximo. Cada fase mantém Controller → Service → Repository, DTOs com Zod e respostas no formato padrão.

## 3. G1 — Convites

### Nickname
- 3 a **15** caracteres, apenas letras, números e `_`; começa com letra.
- Único sem diferenciar maiúsculas (a collation `utf8mb4_unicode_ci` já garante no índice único).
- **Filtro de ofensivos:** o texto é normalizado (minúsculas, sem acento, `0→o 1→i 3→e 4→a 5→s @→a`, sem `_`) e comparado com uma lista de palavrões e termos discriminatórios em português e inglês, em `packages/shared`. Nome bloqueado devolve `NICKNAME_NOT_ALLOWED` sem dizer qual termo bateu. A lista é curada e pode crescer sem mudar código de regra.
- Limitação assumida: filtro por lista não pega tudo; denúncia e remoção pelo admin ficam como evolução.
- Nickname também alimenta amigos, ofensiva compartilhada e perfil público (fases futuras).

### Convite por nickname
- `POST /groups/:id/invites { nickname }` — só membro do grupo convida; não convida quem já é membro nem quem já tem convite pendente.
- Resposta não confirma se o nickname existe para quem não pode convidar (evita varredura de usuários); limite de 20 convites/hora por usuário.
- `Notification` in-app (tipo `GROUP_INVITE`) para o convidado, com ações **aceitar** e **recusar**.
- `GET /invites` lista convites pendentes; `POST /invites/:id/accept|decline`.

### Código por WhatsApp
- Botão "Enviar código" abre `https://wa.me/?text=…` com mensagem pronta (nome do grupo, código e link de entrada). Sem API do WhatsApp e sem guardar telefone.

## 4. G2 — Compartilhar conteúdo

- Tabela `GroupShare { groupId, sharedById, type: DECK | SCHEDULE | CONTEST, refId, createdAt }`.
- **Somente o dono compartilha e retira.** Retirar remove o acesso dos demais (cópias já feitas continuam).
- Membros veem o item **somente leitura** em uma aba "Compartilhados" e podem **copiar para o próprio perfil**:
  - Deck: copia o deck e os cartões; o progresso de revisão é de cada pessoa (começa do zero).
  - Cronograma: copia a grade; datas são recalculadas a partir da prova da pessoa.
  - Edital: copia o conteúdo programático; **não** copia progresso, notas nem documentos.
- Toda leitura valida: membro do grupo + compartilhamento ativo (nunca por id solto).

## 5. G3 — Comentários e ajuda

- Tabela `GroupComment { groupId, userId, targetType: QUESTION | DECK, targetId, parentId?, body, kind: COMMENT | HELP, resolved, bestAnswerId? }`.
- Comentário só é visível **dentro do grupo**; a mesma questão pode ter conversas diferentes em grupos diferentes.
- **Pedir ajuda:** o comentário vira `HELP` (destaque na lista). Colegas respondem; quem pediu marca uma resposta como **útil** e o pedido como **resolvido**. Pedidos em aberto aparecem em uma lista "Precisam de ajuda" no grupo, e quem ajuda ganha reconhecimento no feed (ponto de ajuda definido junto com a revisão de pontuação).
- Regras: até 500 caracteres, respostas em um nível, autor apaga o próprio comentário, admin do grupo apaga qualquer um, limite de 30 comentários/hora por usuário, mesmo filtro de ofensivos do nickname.

## 6. G4 — Sala de questões juntos (PR próprio)

Duas formas de jogar, escolhidas pelo criador ao abrir a sala:

- **Ao vivo:** todos entram no lobby, o criador inicia, cada questão tem tempo fixo, o placar atualiza a cada resposta e há revelação conjunta do gabarito.
- **No próprio ritmo:** a sala fica aberta por uma janela (ex.: 24 h); cada um responde quando quiser e o placar final compara todos.

Modelo: `GroupRoom { groupId, hostId, mode, status: LOBBY | RUNNING | FINISHED, questionIds, secondsPerQuestion, startsAt, endsAt }`, `GroupRoomPlayer`, `GroupRoomAnswer { roomId, userId, questionId, choice, isCorrect, ms }` (única por usuário e questão).

Decisões técnicas:
- **Servidor é a fonte da verdade:** questão atual e prazo são calculados no servidor por horário; o cliente só exibe.
- **Ao vivo sem nova dependência:** o cliente consulta o estado a cada ~2 s (TanStack Query com `refetchInterval`); grupos são pequenos, então o custo é baixo. Se o volume crescer, trocar por SSE sem mudar o contrato da API.
- O gabarito só é enviado depois do fim do tempo da questão (ou de a pessoa responder, no próprio ritmo), para não vazar a resposta.
- Pontos usam o módulo único de regras da revisão de pontuação (limite diário continua valendo).
- Reaproveita as questões já existentes do banco e as regras de acerto atuais.

## 7. Segurança e privacidade

- Todo endpoint de grupo valida participação no grupo antes de ler ou escrever.
- Compartilhamento é sempre ação explícita do dono; nada vaza por padrão.
- Rate limit nos convites, comentários e respostas de sala.
- Sem dados sensíveis em logs; e-mail nunca aparece para outros membros, apenas nome e nickname.

## 8. Fora de escopo (por enquanto)

Chat livre, vídeo/voz, edição colaborativa em tempo real, amigos fora de grupo, ofensiva compartilhada e notificações por e-mail ou push.

## 9. Decisões

1. Qualquer membro do grupo pode compartilhar conteúdo.
2. A sala no próprio ritmo fica aberta por 24 h.
3. Os pontos de ajuda entram já; as regras de pontuação serão organizadas depois, na revisão de pontuação.
