import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Layers,
  Map,
  Lightbulb,
  LifeBuoy,
  Loader2,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Gamepad2,
  type LucideIcon,
} from 'lucide-react';
import { useScheduleTarget } from '@/features/content/hooks/useScheduleTarget';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  gameService,
  apiMessage,
  type GameSource,
  type GameType,
  type Round,
} from '@/features/games/services/game.service';
import { deckService } from '@/features/flashcards/services/flashcard.service';
import { questionSetService } from '@/features/questions/services/question-set.service';
import { GameSetupModal } from '@/features/games/components/GameSetupModal';
import { ChoiceGame } from '@/features/games/components/ChoiceGame';
import { MemoriaGame } from '@/features/games/components/MemoriaGame';
import { ResgateGame } from '@/features/games/components/ResgateGame';

interface GameInfo {
  icon: LucideIcon;
  title: string;
  science: string;
  description: string;
}

const GAME_INFO: Record<GameType, GameInfo> = {
  DUELO: {
    icon: Zap,
    title: 'Duelo Relâmpago',
    science: 'Recordação ativa e atenção',
    description: 'Responda questões contra o relógio. Acertos seguidos formam combos que multiplicam os pontos.',
  },
  MEMORIA: {
    icon: Layers,
    title: 'Memória Pareada',
    science: 'Memória semântica em rede',
    description: 'Ligue cada conceito à sua definição e fortaleça as associações entre as ideias.',
  },
  TRILHA: {
    icon: Map,
    title: 'Trilha do Saber',
    science: 'Aprendizagem significativa',
    description: 'Conquiste um território por disciplina. O próximo só abre quando você dominar o anterior.',
  },
  PONTA: {
    icon: Lightbulb,
    title: 'Na Ponta da Língua',
    science: 'Dicas de recuperação',
    description: 'Descubra a resposta pedindo dicas graduais. Quanto menos dicas, mais pontos.',
  },
  RESGATE: {
    icon: LifeBuoy,
    title: 'Resgate da Memória',
    science: 'Curva do esquecimento',
    description: 'Veja o que está sendo esquecido e resgate primeiro o mais fraco. Reagenda suas revisões.',
  },
};

const ORDER: GameType[] = ['DUELO', 'MEMORIA', 'TRILHA', 'PONTA', 'RESGATE'];

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

export function GamesPage() {
  const queryClient = useQueryClient();
  const target = useScheduleTarget();
  const [setupGame, setSetupGame] = useState<GameType | null>(null);
  const [showTrilha, setShowTrilha] = useState(false);
  const [active, setActive] = useState<{ round: Round; source: GameSource } | null>(null);

  const { data: overview } = useQuery({ queryKey: ['games', 'overview'], queryFn: gameService.overview });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: decks = [] } = useQuery({ queryKey: ['flashcard-decks'], queryFn: deckService.list });
  const { data: sets = [] } = useQuery({ queryKey: ['question-sets'], queryFn: questionSetService.list });
  const { data: trilha, isLoading: trilhaLoading } = useQuery({
    queryKey: ['games', 'trilha'],
    queryFn: gameService.trilha,
    enabled: showTrilha,
  });

  const start = useMutation({
    mutationFn: (v: { game: GameType; source: GameSource }) => gameService.start(v.game, v.source),
    onSuccess: (round, v) => {
      setSetupGame(null);
      setActive({ round, source: v.source });
    },
  });

  const exit = () => {
    setActive(null);
    queryClient.invalidateQueries({ queryKey: ['games'] });
  };
  const playAgain = () => {
    if (active) start.mutate({ game: active.round.game, source: active.source });
  };

  if (active) {
    const { round } = active;
    const props = { round, onAgain: playAgain, onExit: exit };
    const key = round.roundId;
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={exit}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Sair do jogo
        </button>
        {(round.game === 'DUELO' || round.game === 'TRILHA' || round.game === 'PONTA') && (
          <ChoiceGame key={key} {...props} mode={round.game} />
        )}
        {round.game === 'MEMORIA' && <MemoriaGame key={key} {...props} />}
        {round.game === 'RESGATE' && <ResgateGame key={key} {...props} />}
      </div>
    );
  }

  const earned = overview?.earnedToday ?? 0;
  const cap = overview?.dailyCap ?? 400;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20">
              <Gamepad2 className="h-6 w-6 text-[#2E8C82]" />
            </span>
            Jogos Cognitivos
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Estude jogando: cada jogo usa um princípio da neurociência da memória e da aprendizagem ativa com o seu próprio conteúdo.
          </p>
        </div>
        <div className="w-full sm:w-60 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">XP diário de jogos</span>
            <span className="font-bold text-slate-900 dark:text-white">{`${earned}/${cap} XP`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#2E8C82] transition-all duration-normal"
              style={{ width: `${Math.min(100, (earned / cap) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {target.name && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-4 py-3.5 text-sm text-slate-800 dark:text-slate-100 shadow-xs">
          <Lightbulb className="h-5 w-5 shrink-0 text-[#2E8C82] mt-0.5" />
          <p>
            Escolha um jogo para treinar <strong className="font-semibold text-slate-950 dark:text-white">{target.subject?.name ?? target.name}</strong>.
            {target.ready && !target.subject && ' Não achei essa disciplina na sua lista; selecione-a dentro do jogo.'}
          </p>
        </div>
      )}

      {showTrilha ? (
        <TrilhaMap
          nodes={trilha?.nodes ?? []}
          hidden={trilha?.hidden ?? 0}
          loading={trilhaLoading}
          starting={start.isPending}
          onBack={() => setShowTrilha(false)}
          onPick={(id) => start.mutate({ game: 'TRILHA', source: { subjectId: id } })}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ORDER.map((game) => {
            const info = GAME_INFO[game];
            const stat = overview?.games.find((g) => g.game === game);
            return (
              <div
                key={game}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-fast dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20">
                    <info.icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    {info.science}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{info.title}</h2>
                <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {info.description}
                </p>
                <div className="mt-4 mb-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat?.plays ? `Melhor: ${stat.best} pts · ${stat.plays} partidas` : 'Ainda não jogado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupGame(game)}
                  disabled={start.isPending}
                  className="min-h-[44px] inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation"
                >
                  Jogar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {setupGame && (
        <GameSetupModal
          game={setupGame}
          title={GAME_INFO[setupGame].title}
          decks={decks}
          sets={sets}
          subjects={flatten(subjects)}
          initialSubjectId={target.subject?.id}
          starting={start.isPending}
          onStart={(source) => start.mutate({ game: setupGame, source })}
          onTrilhaMap={() => {
            setSetupGame(null);
            setShowTrilha(true);
          }}
          onClose={() => setSetupGame(null)}
        />
      )}

      {start.isError && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {apiMessage(start.error)}
        </div>
      )}
    </div>
  );
}

function TrilhaMap({
  nodes,
  hidden,
  loading,
  starting,
  onBack,
  onPick,
}: {
  nodes: Array<{ id: string; name: string; conquered: boolean; unlocked: boolean }>;
  hidden: number;
  loading: boolean;
  starting: boolean;
  onBack: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos jogos
      </button>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Trilha do Saber</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Acerte pelo menos 3 de 5 questões para conquistar um território e liberar o próximo.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E8C82]" />
        </div>
      ) : nodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Nenhuma disciplina com questões suficientes ainda. Gere simulados em Questões para abrir a trilha.
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n, i) => (
            <button
              key={n.id}
              type="button"
              disabled={!n.unlocked || starting}
              onClick={() => onPick(n.id)}
              className={`min-h-[52px] flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-fast touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] ${
                n.conquered
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 hover:border-emerald-500/60 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100'
                  : n.unlocked
                    ? 'border-[#2E8C82]/40 bg-white hover:border-[#2E8C82] hover:bg-[#2E8C82]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#2E8C82] dark:hover:bg-[#2E8C82]/10 shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 text-slate-400 opacity-60 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm">
                {n.conquered ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                ) : n.unlocked ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-sm font-bold text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                    {i + 1}
                  </span>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/60 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{n.name}</span>
            </button>
          ))}
        </div>
      )}

      {hidden > 0 && (
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {`+ ${hidden} territórios ainda escondidos. Conquiste os próximos para revelá-los.`}
        </p>
      )}
    </div>
  );
}
