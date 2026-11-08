import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Radio, Users } from 'lucide-react';

import { roomService, type RoomSummary } from '../services/room.service';
import { CreateRoomDialog } from './CreateRoomDialog';
import { RoomPlay } from './RoomPlay';

const LIST_POLL_MS = 10_000;

const STATUS_LABEL: Record<RoomSummary['status'], string> = { LOBBY: 'Lobby', RUNNING: 'Em andamento', FINISHED: 'Encerrada' };

// Aba "Salas": responder questões junto com o grupo, ao vivo ou no próprio ritmo.
export function RoomsTab({ groupId, currentUserId }: { groupId: string; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['group-rooms', groupId],
    queryFn: () => roomService.list(groupId),
    refetchInterval: LIST_POLL_MS,
  });

  if (openId) {
    return (
      <RoomPlay
        groupId={groupId}
        roomId={openId}
        currentUserId={currentUserId}
        onBack={() => {
          setOpenId(null);
          queryClient.invalidateQueries({ queryKey: ['group-rooms', groupId] });
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">Respondam questões juntos: ao vivo ou cada um no seu ritmo.</p>
        <button type="button" onClick={() => setCreating(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Nova sala
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : rooms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nenhuma sala ainda. Crie a primeira e chame o grupo!
        </p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => setOpenId(room.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-primary-400 dark:border-gray-800 dark:bg-gray-900"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${room.status === 'FINISHED' ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' : 'bg-green-50 text-green-600 dark:bg-green-950/40'}`}>
                  <Radio className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{room.title}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {room.mode === 'LIVE' ? 'Ao vivo' : 'No próprio ritmo'} · {room.total} questões · {STATUS_LABEL[room.status]}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="h-3.5 w-3.5" /> {room.players}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <CreateRoomDialog
          groupId={groupId}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ['group-rooms', groupId] });
            setOpenId(id);
          }}
        />
      )}
    </div>
  );
}
