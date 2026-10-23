# Jogos educativos

Cinco jogos, cada um ancorado em um princípio de memória e aprendizagem, usando o conteúdo do próprio aluno
(flashcards e questões). Acessados em **Estudos > Jogos** (`/games`).

## Base teórica

Referências: *Memória* (Lisa Genova) e *Psicologia da Aprendizagem* (Lima, Silveira e Falcão, EdUECE).

| Jogo | Mecânica | Princípio |
|---|---|---|
| Duelo Relâmpago | Questões contra o relógio, combo de acertos seguidos | Recordação ativa; atenção como porta de entrada da codificação; reforço imediato (Skinner) |
| Memória Pareada | Ligar conceito à definição | Memória semântica como rede de associações; recuperação reconstrói memórias interligadas |
| Trilha do Saber | Conquistar disciplinas em sequência (3 de 5 acertos) | Aprendizagem significativa (Ausubel): novo conteúdo ancorado no anterior; nível de desafio adequado (Vigotski) |
| Na Ponta da Língua | Dicas graduais; menos dicas, mais pontos | Dicas de recuperação (fenômeno "ponta da língua"); esforço de evocação antes da ajuda |
| Resgate da Memória | Resgatar primeiro o que está mais fraco; reagenda a revisão do flashcard | Curva do esquecimento; revisão espaçada; consolidação |

## Decisões de design

- **Pontos por processo, não por volume.** O livro de aprendizagem alerta que depender de recompensa externa
  enfraquece a motivação. Por isso há um limite diário de pontos (`DAILY_POINT_CAP`) e o resultado mostra
  acertos e conteúdo fixado, não só pontuação.
- **Pontuação no servidor.** O cliente nunca recebe o gabarito na rodada. Cada rodada (`GameRound`) guarda as
  respostas certas; ao finalizar, o servidor recalcula a pontuação, confere se a duração é plausível e grava a
  sessão (`GameSession`). Uma rodada só pode ser finalizada uma vez.
- **Integração.** Os pontos entram no ranking global (peso menor que o estudo real) e no placar dos grupos
  (`GroupActivity`), e contam para a ofensiva diária (assiduidade).
- **Resgate vira revisão de verdade.** Acertar ou errar no Resgate atualiza o agendamento SM-2 do flashcard.
- **Trilha com "névoa".** Mostra só o que foi conquistado, a fronteira atual e os próximos passos.

## Requisitos de conteúdo

- Memória Pareada, Na Ponta da Língua e Resgate: pelo menos 4 flashcards.
- Duelo: pelo menos 5 questões. Trilha: disciplina com pelo menos 5 questões.

## API

`GET /games/overview`, `GET /games/trilha`, `POST /games/rounds`, `POST /games/rounds/:id/check`,
`POST /games/rounds/:id/finish`.

## Desenvolvimento local

`pnpm --filter @concurso-ai/backend exec tsx prisma/seed-dev.ts` cria o usuário de teste (login e senha no
próprio arquivo) e conteúdo de exemplo. O seed recusa rodar em produção.
