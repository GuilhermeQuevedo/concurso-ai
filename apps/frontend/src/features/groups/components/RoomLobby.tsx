import { CheckCircle2, Circle, Loader2, Play } from 'lucide-react';

import type { RoomPlayer } from '../services/room.service';

interface RoomLobbyProps {
  players: RoomPlayer[];
  currentUserId: string;
  joined: boolean;
  isHost: boolean;
  settingReady: boolean;
  starting: boolean;
  onToggleReady: (ready: boolean) => void;
  onForceStart: () => void;
}

export function RoomLobby({ players, currentUserId, joined, isHost, settingReady, starting, onToggleReady, onForceStart }: RoomLobbyProps) {
  const readyCount = players.filter((p) => p.ready).length;
  const me = players.find((p) => p.userId === currentUserId);
  const enough = players.length >= 2;

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="mb-1 font-medium text-gray-900 dark:text-white">
        {readyCount} de {players.length} prontos
      </p>
      <p className="mb-3 text-gray-600 dark:text-gray-300">
        {enough
          ? 'Quando todos marcarem “Pronto”, a contagem de 5 segundos começa sozinha.'
          : 'Aguardando mais gente entrar. São necessárias pelo menos 2 pessoas.'}
      </p>

      <ul className="mb-4 grid gap-2 sm:grid-cols-2">
        {players.map((p) => (
          <li key={p.userId} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
            {p.ready ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-400" />}
            <span className="truncate text-gray-800 dark:text-gray-100">{p.nickname ? `@${p.nickname}` : p.name}</span>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{p.ready ? 'pronto' : 'aguardando'}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        {joined && (
          <button
            type="button"
            onClick={() => onToggleReady(!me?.ready)}
            disabled={settingReady}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50 ${
              me?.ready ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {settingReady && <Loader2 className="h-4 w-4 animate-spin" />}
            {me?.ready ? 'Cancelar pronto' : 'Estou pronto'}
          </button>
        )}
        {isHost && (
          <button
            type="button"
            onClick={onForceStart}
            disabled={starting}
            className="flex items-center gap-1.5 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Iniciar sem esperar todos
          </button>
        )}
      </div>
    </div>
  );
}
