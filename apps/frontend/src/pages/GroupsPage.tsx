import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Share2,
  Radio,
  MessageCircleQuestion,
  Crown,
  Medal,
  Loader2,
  ChevronRight,
  Clock,
  LogOut,
  Trophy,
  Flame,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  groupService,
  type GroupDTO,
  type RankingEntry,
  type FeedEntry,
} from '@/features/groups/services/group.service';
import { TierBadge } from '@/features/xp/components/TierBadge';
import { RoomsTab } from '@/features/groups/components/RoomsTab';
import { GroupHelp } from '@/features/groups/components/GroupHelp';
import { SharedItems } from '@/features/groups/components/SharedItems';
import { InviteMembers } from '@/features/groups/components/InviteMembers';

type View = 'list' | 'create' | 'join' | 'detail';

export function GroupsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const openGroup = (id: string) => {
    setSelectedGroupId(id);
    setView('detail');
  };

  if (view === 'create') return <CreateGroup onBack={() => setView('list')} />;
  if (view === 'join') return <JoinGroup onBack={() => setView('list')} />;
  if (view === 'detail') {
    return <GroupDetail groupId={selectedGroupId} onBack={() => setView('list')} />;
  }

  return <GroupList onCreate={() => setView('create')} onJoin={() => setView('join')} onOpen={openGroup} />;
}

function GroupList({
  onCreate,
  onJoin,
  onOpen,
}: {
  onCreate: () => void;
  onJoin: () => void;
  onOpen: (id: string) => void;
}) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.list,
  });

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Competição & Grupos de Estudo
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Estude com amigos, tire dúvidas colaborativas e compare seu ritmo com foco no edital.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onJoin}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast shadow-xs touch-manipulation"
          >
            <Plus className="h-4 w-4" />
            Criar Grupo
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Carregando grupos de estudos">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-3.5 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhum grupo de estudos encontrado
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Crie sua turma ou entre com o código de convite de amigos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group: GroupDTO) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onOpen(group.id)}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all duration-fast hover:border-[#2E8C82]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-[0.99] touch-manipulation dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#2E8C82]/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{group.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {group._count?.members ?? group.members?.length ?? 0} membros
                    {group.myRole === 'ADMIN' && ' · Admin'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGroup({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => groupService.create({ name, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onBack();
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para grupos
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Criar Novo Grupo de Estudos</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Monte uma turma com seus amigos e definam metas conjuntas de aprendizado.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Nome do grupo *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Foco Polícia Federal 2026"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Descrição (opcional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Resolução de questões discursivas e jurisprudência"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="min-h-[44px] flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar Grupo
        </button>
      </div>
    </div>
  );
}

function JoinGroup({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => groupService.join(code.toUpperCase().trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onBack();
    },
    onError: () => setError('Código inválido ou você já participa deste grupo.'),
  });

  return (
    <div className="mx-auto max-w-lg space-y-5 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para grupos
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Entrar em um Grupo</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Insira o código de 6 dígitos compartilhado pelo organizador.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
            Código do grupo
          </label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="ABC123"
            maxLength={6}
            aria-label="Código do grupo"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-center font-mono text-xl font-extrabold tracking-widest text-[#2E8C82] uppercase placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-[#38b2a6]"
          />
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={code.trim().length < 4 || mutation.isPending}
          className="min-h-[44px] flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Entrar no Grupo
        </button>
      </div>
    </div>
  );
}

function GroupDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'ranking' | 'feed' | 'shared' | 'help' | 'rooms'>('ranking');
  const [copied, setCopied] = useState(false);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupService.getById(groupId),
  });

  const { data: ranking = [] } = useQuery({
    queryKey: ['group-ranking', groupId],
    queryFn: () => groupService.getRanking(groupId),
    enabled: tab === 'ranking',
  });

  const { data: feed = [] } = useQuery({
    queryKey: ['group-feed', groupId],
    queryFn: () => groupService.getFeed(groupId),
    enabled: tab === 'feed',
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupService.leave(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onBack();
    },
  });

  const copyCode = async () => {
    if (group?.code) {
      await navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canModerate = group?.members.some((m) => m.user.id === user?.id && m.role === 'ADMIN') ?? false;

  if (!group) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Carregando detalhes do grupo">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para lista de grupos
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{group.description}</p>
          )}
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Código de convite:</span>
            <code className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-extrabold text-[#2E8C82] dark:bg-slate-800 dark:text-[#38b2a6]">
              {group.code}
            </code>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copiar código do grupo"
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all duration-fast dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
            {copied && <span className="text-xs font-bold text-emerald-600">Copiado!</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => leaveMutation.mutate()}
          disabled={leaveMutation.isPending}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair do Grupo
        </button>
      </div>

      <InviteMembers
        groupId={group.id}
        groupName={group.name}
        code={group.code}
        memberIds={group.members.map((m) => m.user.id)}
      />

      {/* Segmented Tabs Bar */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <TabButton active={tab === 'ranking'} onClick={() => setTab('ranking')} icon={Trophy} label="Ranking Semanal" />
        <TabButton active={tab === 'feed'} onClick={() => setTab('feed')} icon={Flame} label="Atividades Recentes" />
        <TabButton active={tab === 'shared'} onClick={() => setTab('shared')} icon={Share2} label="Compartilhados" />
        <TabButton active={tab === 'help'} onClick={() => setTab('help')} icon={MessageCircleQuestion} label="Dúvidas Coletivas" />
        <TabButton active={tab === 'rooms'} onClick={() => setTab('rooms')} icon={Radio} label="Salas ao Vivo" />
      </div>

      {tab === 'ranking' && <RankingView ranking={ranking} currentUserId={user?.id ?? ''} />}
      {tab === 'feed' && <FeedView feed={feed} />}
      {tab === 'shared' && <SharedItems groupId={group.id} canModerate={canModerate} />}
      {tab === 'rooms' && <RoomsTab groupId={group.id} currentUserId={user?.id ?? ''} />}
      {tab === 'help' && <GroupHelp groupId={group.id} canModerate={canModerate} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Trophy;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] shrink-0 flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all duration-fast touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] ${
        active
          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      <Icon className="mr-1.5 hidden h-4 w-4 sm:inline" />
      {label}
    </button>
  );
}

function RankingView({ ranking, currentUserId }: { ranking: RankingEntry[]; currentUserId: string }) {
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-[#F2A93B]" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="flex h-5 w-5 items-center justify-center font-mono text-xs font-bold text-slate-400">{index + 1}</span>;
  };

  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Nenhuma pontuação registrada esta semana. Estude para liderar o grupo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {ranking.map((entry, index) => {
        const isMe = entry.userId === currentUserId;
        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3.5 rounded-2xl border p-4.5 transition-all duration-fast ${
              isMe
                ? 'border-[#2E8C82]/30 bg-[#2E8C82]/10 dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/20'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            } ${index === 0 ? 'ring-2 ring-amber-300 dark:ring-amber-700 shadow-xs' : ''}`}
          >
            <div className="flex w-8 justify-center shrink-0">{getMedalIcon(index)}</div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-bold truncate ${isMe ? 'text-[#2E8C82] dark:text-[#38b2a6]' : 'text-slate-900 dark:text-white'}`}>
                  {entry.name}
                </span>
                {isMe && (
                  <span className="rounded-md border border-[#2E8C82]/30 bg-[#2E8C82]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#2E8C82] dark:text-[#38b2a6]">
                    Você
                  </span>
                )}
                <TierBadge level={entry.level} tier={entry.tier} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                Total acumulado: {entry.totalPoints} XP
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{entry.weekPoints}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">XP na semana</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeedView({ feed }: { feed: FeedEntry[] }) {
  const typeLabels: Record<string, string> = {
    SESSION_COMPLETED: 'Sessão',
    PERFECT_SESSION: 'Perfeito!',
    FLASHCARD_REVIEW: 'Flashcard',
    STREAK_DAY: 'Streak',
    ESSAY_SUBMITTED: 'Redação',
    GAME: 'Jogo',
    ROOM_FINISHED: 'Sala de questões',
    DOUBT_CLEARED: 'Dúvida esclarecida',
  };

  const typeColors: Record<string, string> = {
    SESSION_COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    PERFECT_SESSION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    FLASHCARD_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    STREAK_DAY: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    ESSAY_SUBMITTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    GAME: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    ROOM_FINISHED: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    DOUBT_CLEARED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  };

  if (feed.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Nenhuma atividade registrada recentemente na turma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {feed.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {entry.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900 dark:text-white">
              <span className="font-bold">{entry.user.name}</span>{' '}
              <span className="text-slate-600 dark:text-slate-400">{entry.description}</span>
            </p>
            <div className="mt-1 flex items-center gap-2.5">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${typeColors[entry.type] ?? 'bg-slate-100 text-slate-700'}`}>
                {typeLabels[entry.type] ?? 'Atividade'}
              </span>
              <span className="font-mono text-xs font-bold text-[#2E8C82] dark:text-[#38b2a6]">+{entry.points} XP</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {timeAgo(entry.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default GroupsPage;
