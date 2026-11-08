import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { shareService, type ShareDTO } from '../services/share.service';
import { SHARE_META } from './shareMeta';
import { ShareDetailDialog } from './ShareDetailDialog';
import { SharePickerDialog } from './SharePickerDialog';

// Aba "Compartilhados": tudo que os membros publicaram para o grupo, em modo leitura.
export function SharedItems({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  const [picking, setPicking] = useState(false);
  const [openShare, setOpenShare] = useState<ShareDTO | null>(null);

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['group-shares', groupId],
    queryFn: () => shareService.list(groupId),
  });

  const remove = useMutation({
    mutationFn: (shareId: string) => shareService.remove(groupId, shareId),
    onSuccess: () => {
      toast.success('Item retirado do grupo.');
      queryClient.invalidateQueries({ queryKey: ['group-shares', groupId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível retirar o item.')),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Decks, cronogramas e editais que os colegas compartilharam.</p>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Compartilhar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : shares.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nada compartilhado ainda. Seja o primeiro a compartilhar um deck, cronograma ou edital.
        </p>
      ) : (
        <ul className="space-y-2">
          {shares.map((share) => (
            <ShareRow key={share.id} share={share} onOpen={() => setOpenShare(share)} onRemove={() => remove.mutate(share.id)} />
          ))}
        </ul>
      )}

      {picking && <SharePickerDialog groupId={groupId} onClose={() => setPicking(false)} />}
      {openShare && <ShareDetailDialog groupId={groupId} share={openShare} onClose={() => setOpenShare(null)} />}
    </div>
  );
}

function ShareRow({ share, onOpen, onRemove }: { share: ShareDTO; onOpen: () => void; onRemove: () => void }) {
  const { icon: Icon, label, color } = SHARE_META[share.type];
  const who = share.isMine ? 'você' : share.sharedBy.nickname ? `@${share.sharedBy.nickname}` : share.sharedBy.name;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{share.title}</span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {label} · {share.summary} · por {who}
          </span>
        </span>
      </button>
      {share.isMine && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirar do grupo"
          title="Retirar do grupo"
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
