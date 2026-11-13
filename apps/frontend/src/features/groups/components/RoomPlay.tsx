import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Timer } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { roomService, type RoomState } from '../services/room.service';
import { RoomLobby } from './RoomLobby';
import { RoomLeaderboard } from './RoomLeaderboard';
import { RoomQuestionCard } from './RoomQuestionCard';

const LIVE_POLL_MS = 1500;
const OWN_PACE_POLL_MS = 8000;

export interface RoomPlayProps {
  groupId: string;
  roomId: string;
  currentUserId: string;
  onBack: () => void;
}

// O servidor manda quanto falta; aqui só se desenha a contagem entre uma consulta e outra.
function useCountdown(remainingMs: number, updatedAt: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, remainingMs - (now - updatedAt));
}

function formatRemaining(ms: number, long: boolean): string {
  const total = Math.ceil(ms / 1000);
  if (!long) return `${total}s`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

export function RoomPlay({ groupId, roomId, currentUserId, onBack }: RoomPlayProps) {
  const queryClient = useQueryClient();
  const queryKey = ['group-room', groupId, roomId] as const;
  const { data: room, dataUpdatedAt } = useQuery({
    queryKey,
    queryFn: () => roomService.get(groupId, roomId),
    refetchInterval: (query) => {
      const state = query.state.data;
      if (!state || state.status === 'FINISHED') return false;
      return state.mode === 'LIVE' ? LIVE_POLL_MS : OWN_PACE_POLL_MS;
    },
  });
  const remaining = useCountdown(room?.remainingMs ?? 0, dataUpdatedAt);

  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const onError = (error: unknown) => {
    toast.error(getErrorMessage(error, 'Não foi possível concluir a ação.'));
    refresh();
  };
  const join = useMutation({ mutationFn: () => roomService.join(groupId, roomId), onSuccess: refresh, onError });
  const start = useMutation({ mutationFn: () => roomService.start(groupId, roomId), onSuccess: refresh, onError });
  const setReady = useMutation({ mutationFn: (ready: boolean) => roomService.setReady(groupId, roomId, ready), onSuccess: refresh, onError });
  const answer = useMutation({
    mutationFn: ({ questionId, choice }: { questionId: string; choice: string }) => roomService.answer(groupId, roomId, questionId, choice),
    onSuccess: refresh,
    onError,
  });

  if (!room) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const live = room.mode === 'LIVE';
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <ArrowLeft className="h-4 w-4" /> Voltar às salas
      </button>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{room.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {live ? `Ao vivo · ${room.secondsPerQuestion}s por pergunta` : 'No próprio ritmo'} · {room.total} questões
          </p>
        </div>
        <StatusBadge room={room} remaining={remaining} />
      </div>

      {!room.joined && room.status !== 'FINISHED' && (
        <div className="mb-4 rounded-xl border border-primary-300 bg-primary-50 p-4 text-sm dark:border-primary-800 dark:bg-primary-950/30">
          <p className="mb-2 text-gray-800 dark:text-gray-200">Você ainda não está nesta sala.</p>
          <button type="button" onClick={() => join.mutate()} disabled={join.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            Entrar na sala
          </button>
        </div>
      )}

      {room.phase === 'LOBBY' && (
        <RoomLobby
          players={room.players}
          currentUserId={currentUserId}
          joined={room.joined}
          isHost={room.isHost}
          settingReady={setReady.isPending}
          starting={start.isPending}
          onToggleReady={(ready) => setReady.mutate(ready)}
          onForceStart={() => start.mutate()}
        />
      )}

      {room.phase === 'COUNTDOWN' && (
        <div className="mb-4 rounded-xl bg-amber-50 p-8 text-center dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Todos prontos! Começando em</p>
          <p className="text-6xl font-extrabold text-amber-700 dark:text-amber-300">{Math.max(1, Math.ceil(remaining / 1000))}</p>
        </div>
      )}

      <div className="mb-4 space-y-3">
        {room.questions.map((q) => (
          <RoomQuestionCard
            key={q.id}
            question={q}
            position={`Questão ${q.index + 1} de ${room.total}`}
            canAnswer={room.joined && room.status === 'RUNNING' && (live ? room.phase === 'ANSWERING' : true)}
            pending={answer.isPending}
            onAnswer={(choice) => answer.mutate({ questionId: q.id, choice })}
          />
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{room.status === 'FINISHED' ? 'Resultado final' : 'Placar'}</h3>
      <RoomLeaderboard players={room.players} currentUserId={currentUserId} total={room.total} />
    </div>
  );
}

function StatusBadge({ room, remaining }: { room: RoomState; remaining: number }) {
  if (room.status === 'FINISHED') return <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">Encerrada</span>;
  if (room.phase === 'LOBBY') return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">Lobby</span>;
  const live = room.mode === 'LIVE';
  const label = live
    ? room.phase === 'REVEAL'
      ? `Gabarito · próxima em ${formatRemaining(remaining, false)}`
      : `Pergunta ${room.index + 1}/${room.total} · ${formatRemaining(remaining, false)}`
    : `Aberta por mais ${formatRemaining(remaining, true)}`;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
      <Timer className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
