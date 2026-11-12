import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, UserMinus, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { TierBadge } from '@/features/xp/components/TierBadge';
import { getErrorMessage } from '@/utils/error-message';

import { friendService, type FriendOverviewDTO } from '../services/friend.service';

const label = (u: { name: string; nickname: string | null }) => (u.nickname ? `@${u.nickname}` : u.name);

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const ROW = 'flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900';

export function FriendLists({ overview }: { overview: FriendOverviewDTO }) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível concluir a ação.'));

  const accept = useMutation({ mutationFn: friendService.accept, onSuccess: () => { toast.success('Amizade aceita.'); refresh(); }, onError });
  const decline = useMutation({ mutationFn: friendService.decline, onSuccess: refresh, onError });
  const cancel = useMutation({ mutationFn: friendService.cancel, onSuccess: refresh, onError });
  const remove = useMutation({
    mutationFn: friendService.remove,
    onSuccess: () => {
      toast.success('Amigo removido.');
      refresh();
    },
    onError,
  });

  return (
    <div className="space-y-6">
      {overview.received.length > 0 && (
        <section aria-label="Pedidos recebidos">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Pedidos recebidos ({overview.received.length})</h2>
          <ul className="space-y-2">
            {overview.received.map((r) => (
              <li key={r.friendshipId} className={ROW}>
                <Avatar name={r.user.name} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{label(r.user)}</span>
                <button type="button" onClick={() => accept.mutate(r.friendshipId)} disabled={accept.isPending} className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" /> Aceitar
                </button>
                <button type="button" onClick={() => decline.mutate(r.friendshipId)} disabled={decline.isPending} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  Recusar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Meus amigos">
        <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Meus amigos ({overview.friends.length})</h2>
        {overview.friends.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Você ainda não tem amigos por aqui. Passe o seu código ou adicione alguém pelo nickname.
          </p>
        ) : (
          <ul className="space-y-2">
            {overview.friends.map((f) => (
              <li key={f.friendshipId} className={ROW}>
                <Avatar name={f.user.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{f.user.name}</span>
                  {f.user.nickname && <span className="block truncate text-xs text-gray-500">@{f.user.nickname}</span>}
                </span>
                <TierBadge level={f.user.level} tier={f.user.tier} />
                <button
                  type="button"
                  onClick={() => window.confirm(`Remover ${f.user.name} dos seus amigos?`) && remove.mutate(f.friendshipId)}
                  aria-label={`Remover ${f.user.name}`}
                  title="Remover amigo"
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {overview.sent.length > 0 && (
        <section aria-label="Pedidos enviados">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Pedidos enviados ({overview.sent.length})</h2>
          <ul className="space-y-2">
            {overview.sent.map((r) => (
              <li key={r.friendshipId} className={ROW}>
                <Avatar name={r.user.name} />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{label(r.user)} · aguardando resposta</span>
                <button type="button" onClick={() => cancel.mutate(r.friendshipId)} aria-label="Cancelar pedido" title="Cancelar pedido" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
