import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { friendService } from '../services/friend.service';

export function AddFriendForm() {
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState('');
  const clean = identifier.trim().replace(/^@/, '');

  const add = useMutation({
    mutationFn: () => friendService.request(clean),
    onSuccess: (result) => {
      toast.success(result.accepted ? 'Vocês agora são amigos!' : 'Pedido de amizade enviado com sucesso.');
      setIdentifier('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar o pedido de amizade.')),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length >= 3) add.mutate();
      }}
      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <UserPlus className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Adicionar amigo
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Digite o nickname com ou sem arroba ou insira o código alfanumérico do amigo.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <input
          value={identifier}
          maxLength={20}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="@nickname ou código"
          aria-label="Nickname ou código do amigo"
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={clean.length < 3 || add.isPending}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
        >
          {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Adicionar
        </button>
      </div>
    </form>
  );
}
