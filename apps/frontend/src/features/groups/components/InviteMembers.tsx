import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, MessageCircle, UserPlus } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { groupService } from '../services/group.service';

export interface InviteMembersProps {
  groupId: string;
  groupName: string;
  code: string;
}

function whatsappLink(groupName: string, code: string): string {
  const message = `Vem estudar comigo no Engrama! Entre no grupo "${groupName}" com o código ${code}: ${window.location.origin}/groups`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Dois jeitos de trazer gente: convite direto por nickname ou código pelo WhatsApp.
export function InviteMembers({ groupId, groupName, code }: InviteMembersProps) {
  const [nickname, setNickname] = useState('');
  const trimmed = nickname.trim().replace(/^@/, '');

  const invite = useMutation({
    mutationFn: () => groupService.invite(groupId, trimmed),
    onSuccess: () => {
      toast.success(`Convite enviado para @${trimmed}.`);
      setNickname('');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar o convite.')),
  });

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <UserPlus className="h-4 w-4 text-primary-600" /> Convidar para o grupo
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed.length >= 3) invite.mutate();
          }}
          className="flex flex-1 items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
            <input
              value={nickname}
              maxLength={16}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="nickname do colega"
              aria-label="Nickname do colega"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={trimmed.length < 3 || invite.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Convidar
          </button>
        </form>
        <a
          href={whatsappLink(groupName, code)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar código por WhatsApp
        </a>
      </div>
    </div>
  );
}
