import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Crown,
  Medal,
  Loader2,
  ChevronRight,
  Clock,
  LogOut,
  Trophy,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  groupService,
  type GroupDTO,
  type RankingEntry,
  type FeedEntry,
} from '@/features/groups/services/group.service';

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Competição</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Estude com amigos e compare seu progresso
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onJoin}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Criar Grupo
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nenhum grupo ainda
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Crie um grupo ou entre com um código de convite
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group: GroupDTO) => (
            <button
              key={group.id}
              onClick={() => onOpen(group.id)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                  <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group._count?.members ?? group.members?.length ?? 0} membros
                    {group.myRole === 'ADMIN' && ' · Admin'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
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
    <div className="mx-auto max-w-md">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        ← Voltar
      </button>
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Criar Grupo</h2>
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do grupo *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Turma do TRT"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar
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
    onError: () => setError('Código inválido ou você já faz parte deste grupo'),
  });

  return (
    <div className="mx-auto max-w-md">
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        ← Voltar
      </button>
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Entrar em um Grupo</h2>
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Código do grupo</label>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="Ex: ABC123"
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center text-lg font-mono tracking-widest dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={code.trim().length < 4 || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
  const [tab, setTab] = useState<'ranking' | 'feed'>('ranking');
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

  if (!group) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        ← Voltar
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Código:</span>
            <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm font-bold text-primary-600 dark:bg-gray-800 dark:text-primary-400">
              {group.code}
            </code>
            <button onClick={copyCode} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Copy className="h-3.5 w-3.5" />
            </button>
            {copied && <span className="text-xs text-green-600">Copiado!</span>}
          </div>
        </div>
        <button
          onClick={() => leaveMutation.mutate()}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setTab('ranking')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'ranking'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Trophy className="mr-1.5 inline h-4 w-4" />
          Ranking
        </button>
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'feed'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Flame className="mr-1.5 inline h-4 w-4" />
          Atividades
        </button>
      </div>

      {tab === 'ranking' ? (
        <RankingView ranking={ranking} currentUserId={user?.id ?? ''} />
      ) : (
        <FeedView feed={feed} />
      )}
    </div>
  );
}

function RankingView({ ranking, currentUserId }: { ranking: RankingEntry[]; currentUserId: string }) {
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-gray-400">{index + 1}</span>;
  };

  if (ranking.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Nenhuma atividade esta semana</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranking.map((entry, index) => {
        const isMe = entry.userId === currentUserId;
        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              isMe
                ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
            } ${index === 0 ? 'ring-2 ring-yellow-300 dark:ring-yellow-700' : ''}`}
          >
            <div className="flex w-8 justify-center">{getMedalIcon(index)}</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isMe ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                {entry.name} {isMe && '(você)'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total: {entry.totalPoints} pts
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{entry.weekPoints}</p>
              <p className="text-xs text-gray-500">pts/semana</p>
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
  };

  const typeColors: Record<string, string> = {
    SESSION_COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    PERFECT_SESSION: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    FLASHCARD_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    STREAK_DAY: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };

  if (feed.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Nenhuma atividade ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {feed.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {entry.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-semibold">{entry.user.name}</span>{' '}
              <span className="text-gray-500 dark:text-gray-400">{entry.description}</span>
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[entry.type] ?? 'bg-gray-100 text-gray-700'}`}>
                {typeLabels[entry.type] ?? entry.type}
              </span>
              <span className="text-xs font-medium text-primary-600">+{entry.points} pts</span>
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
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
