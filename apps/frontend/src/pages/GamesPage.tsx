import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, Layers, Map, Lightbulb, LifeBuoy, Loader2, Lock, CheckCircle2, ArrowLeft, Gamepad2, type LucideIcon } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  gameService,
  apiMessage,
  type GameType,
  type Round,
} from '@/features/games/services/game.service';
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
  const [subjectId, setSubjectId] = useState('');
  const [showTrilha, setShowTrilha] = useState(false);
  const [active, setActive] = useState<{ round: Round; subjectId?: string } | null>(null);

  const { data: overview } = useQuery({ queryKey: ['games', 'overview'], queryFn: gameService.overview });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const { data: trilha, isLoading: trilhaLoading } = useQuery({
    queryKey: ['games', 'trilha'],
    queryFn: gameService.trilha,
    enabled: showTrilha,
  });

  const start = useMutation({
    mutationFn: (v: { game: GameType; subjectId?: string }) => gameService.start(v.game, v.subjectId),
    onSuccess: (round, v) => setActive({ round, subjectId: v.subjectId }),
  });

  const exit = () => {
    setActive(null);
    queryClient.invalidateQueries({ queryKey: ['games'] });
  };
  const playAgain = () => {
    if (active) start.mutate({ game: active.round.game, subjectId: active.subjectId });
  };

  if (active) {
    const { round } = active;
    const props = { round, onAgain: playAgain, onExit: exit };
    const key = round.roundId;
    return (
      <div>
        <button onClick={exit} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
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
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Gamepad2 className="h-6 w-6 text-primary-600" /> Jogos
          </h1>
          <p className="max-w-xl text-sm text-gray-600 dark:text-gray-400">
            Estude jogando: cada jogo usa um princípio da ciência da memória e da aprendizagem, com o seu próprio conteúdo.
          </p>
        </div>
        <div className="w-56">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            Pontos de hoje: {earned}/{cap}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div className="h-full bg-primary-600" style={{ width: `${Math.min(100, (earned / cap) * 100)}%` }} />
          </div>
        </div>
      </div>

      {showTrilha ? (
        <TrilhaMap
          nodes={trilha?.nodes ?? []}
          hidden={trilha?.hidden ?? 0}
          loading={trilhaLoading}
          starting={start.isPending}
          onBack={() => setShowTrilha(false)}
          onPick={(id) => start.mutate({ game: 'TRILHA', subjectId: id })}
        />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Disciplina (opcional)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todo o meu conteúdo</option>
              {flatten(subjects).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prefix}
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORDER.map((game) => {
              const info = GAME_INFO[game];
              const stat = overview?.games.find((g) => g.game === game);
              return (
                <div
                  key={game}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <info.icon className="mb-2 h-7 w-7 text-primary-600" />
                  <p className="font-semibold text-gray-900 dark:text-white">{info.title}</p>
                  <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">{info.science}</p>
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{info.description}</p>
                  <p className="mt-auto mb-3 text-xs text-gray-500 dark:text-gray-400">
                    {stat?.plays ? `Melhor: ${stat.best} pts · ${stat.plays} partidas` : 'Ainda não jogado'}
                  </p>
                  <button
                    onClick={() => (game === 'TRILHA' ? setShowTrilha(true) : start.mutate({ game, subjectId: subjectId || undefined }))}
                    disabled={start.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {start.isPending && start.variables?.game === game && <Loader2 className="h-4 w-4 animate-spin" />}
                    Jogar
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {start.isError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">
          {apiMessage(start.error)}
        </p>
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
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ArrowLeft className="h-4 w-4" /> Voltar aos jogos
      </button>
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Trilha do Saber</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Acerte pelo menos 3 de 5 questões para conquistar um território e liberar o próximo.
      </p>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      ) : nodes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhuma disciplina com questões suficientes ainda. Gere simulados em Questões para abrir a trilha.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n, i) => (
            <button
              key={n.id}
              disabled={!n.unlocked || starting}
              onClick={() => onPick(n.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                n.conquered
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : n.unlocked
                    ? 'border-primary-400 bg-white hover:bg-primary-50 dark:bg-gray-900 dark:hover:bg-primary-950/30'
                    : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {n.conquered ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : n.unlocked ? i + 1 : <Lock className="h-4 w-4" />}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{n.name}</span>
            </button>
          ))}
        </div>
      )}
      {hidden > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          + {hidden} territórios ainda escondidos. Conquiste os próximos para revelá-los.
        </p>
      )}
    </div>
  );
}
