import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { friendService } from '@/features/friends/services/friend.service';
import { notificationService, type NotificationDTO } from '../services/notification.service';

const QUERY_KEY = ['notifications'];
const POLL_MS = 60_000;

// Sino com contador de avisos dentro da plataforma (por enquanto: convites para grupos).
export function NotificationBell() {
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: notificationService.list, refetchInterval: POLL_MS });
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível responder ao convite.'));

  // Convite de grupo e pedido de amizade têm a mesma ação no sino: aceitar ou recusar.
  const accept = useMutation({
    mutationFn: (item: NotificationDTO) =>
      item.friendRequest ? friendService.accept(item.friendRequest.id) : notificationService.acceptInvite(item.invite?.id ?? '').then(() => undefined),
    onSuccess: (_data, item) => {
      toast.success(item.friendRequest ? 'Amizade aceita.' : 'Você entrou no grupo.');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      refresh();
    },
    onError,
  });
  const decline = useMutation({
    mutationFn: (item: NotificationDTO) =>
      item.friendRequest ? friendService.decline(item.friendRequest.id) : notificationService.declineInvite(item.invite?.id ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      refresh();
    },
    onError,
  });
  const markAll = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: refresh });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAll.mutate();
  };

  return (
    <div ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notificações (${unread} novas)` : 'Notificações'}
        aria-expanded={open}
        className="relative rounded-lg p-1.5 text-white/65 transition-colors hover:bg-white/8 hover:text-white"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute inset-x-3 top-full z-50 mt-1 rounded-xl border border-white/10 bg-[#1B2547] p-2 shadow-2xl"
        >
          {!data || data.items.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-white/50">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {data.items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  busy={accept.isPending || decline.isPending}
                  onAccept={(target) => accept.mutate(target)}
                  onDecline={(target) => decline.mutate(target)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  item,
  busy,
  onAccept,
  onDecline,
}: {
  item: NotificationDTO;
  busy: boolean;
  onAccept: (item: NotificationDTO) => void;
  onDecline: (item: NotificationDTO) => void;
}) {
  const pendingInvite = item.invite?.status === 'PENDING' || item.friendRequest?.status === 'PENDING';
  const answered = item.invite && item.invite.status !== 'PENDING' ? (item.invite.status === 'ACCEPTED' ? 'Convite aceito' : 'Convite recusado') : null;
  return (
    <li className="rounded-lg px-3 py-2 text-xs text-white/80 hover:bg-white/5">
      <p>{item.message}</p>
      {pendingInvite && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onAccept(item)}
            className="rounded-md bg-teal-600 px-2.5 py-1 font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            Aceitar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecline(item)}
            className="rounded-md border border-white/20 px-2.5 py-1 font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            Recusar
          </button>
        </div>
      )}
      {answered && <p className="mt-1 text-[10px] text-white/40">{answered}</p>}
    </li>
  );
}
