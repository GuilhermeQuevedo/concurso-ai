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
      toast.success(result.accepted ? 'Vocês agora são amigos!' : 'Pedido de amizade enviado.');
      setIdentifier('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar o pedido.')),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length >= 3) add.mutate();
      }}
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <UserPlus className="h-4 w-4 text-primary-600" /> Adicionar amigo
      </h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Digite o nickname ou o código de amigo da pessoa.</p>
      <div className="flex gap-2">
        <input
          value={identifier}
          maxLength={20}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="@nickname ou código"
          aria-label="Nickname ou código do amigo"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={clean.length < 3 || add.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Adicionar
        </button>
      </div>
    </form>
  );
}
