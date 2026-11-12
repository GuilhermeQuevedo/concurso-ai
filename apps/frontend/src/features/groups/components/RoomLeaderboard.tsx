import { Crown } from 'lucide-react';

import type { RoomPlayer } from '../services/room.service';

export interface RoomLeaderboardProps {
  players: RoomPlayer[];
  currentUserId: string;
  total: number;
}

export function RoomLeaderboard({ players, currentUserId, total }: RoomLeaderboardProps) {
  return (
    <ol className="space-y-1.5" aria-label="Placar da sala">
      {players.map((p, i) => (
        <li
          key={p.userId}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
            p.userId === currentUserId
              ? 'border-primary-500/60 bg-primary-50 dark:bg-primary-950/30'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
          }`}
        >
          <span className="flex w-6 justify-center text-xs font-bold text-gray-500">{i === 0 && p.score > 0 ? <Crown className="h-4 w-4 text-amber-500" /> : i + 1}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-white">
            {p.nickname ? `@${p.nickname}` : p.name}
            {p.userId === currentUserId && <span className="ml-1 text-xs text-primary-600">(você)</span>}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {p.answered}/{total} · {p.correct} acerto{p.correct === 1 ? '' : 's'}
          </span>
          <span className="w-12 text-right font-bold tabular-nums text-gray-900 dark:text-white">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
