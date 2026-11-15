import { useState } from 'react';
import { Loader2, MessageCircle, UserPlus } from 'lucide-react';

import { useGroupInvite } from '../hooks/useGroupInvite';

export interface InviteMembersProps {
  groupId: string;
  groupName: string;
  code: string;
  memberIds: string[];
}

function whatsappLink(groupName: string, code: string): string {
  const message = `Vem estudar comigo no Engrama! Entre no grupo "${groupName}" com o código ${code}: ${window.location.origin}/groups`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Dois jeitos de trazer gente: convite direto por nickname ou código pelo WhatsApp.
export function InviteMembers({ groupId, groupName, code, memberIds }: InviteMembersProps) {
  const [nickname, setNickname] = useState('');
  const trimmed = nickname.trim().replace(/^@/, '');
  const { friends, invitedIds, pendingFriendId, isInviting, inviteFriend, inviteByNickname } = useGroupInvite(groupId, memberIds);

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <UserPlus className="h-4 w-4 text-primary-600" /> Convidar para o grupo
      </h2>
      <FriendPicker
        friends={friends}
        invitedIds={invitedIds}
        pendingId={pendingFriendId}
        onInvite={inviteFriend}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed.length >= 3) inviteByNickname(trimmed, () => setNickname(''));
          }}
          className="flex flex-1 items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
            <input
              value={nickname}
              maxLength={20}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="nickname ou código do colega"
              aria-label="Nickname ou código do colega"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={trimmed.length < 3 || isInviting}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
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

interface FriendPickerProps {
  friends: Array<{ user: { id: string; name: string; nickname: string | null } }>;
  invitedIds: string[];
  pendingId: string | null;
  onInvite: (friendUserId: string) => void;
}

function FriendPicker({ friends, invitedIds, pendingId, onInvite }: FriendPickerProps) {
  if (friends.length === 0) {
    return (
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Seus amigos aparecem aqui para convidar com um clique. Adicione amigos na página Amigos.
      </p>
    );
  }
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Seus amigos</p>
      <ul className="flex flex-wrap gap-2">
        {friends.map(({ user }) => {
          const invited = invitedIds.includes(user.id);
          return (
            <li key={user.id}>
              <button
                type="button"
                disabled={invited || pendingId === user.id}
                onClick={() => onInvite(user.id)}
                className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm hover:border-primary-500 hover:bg-primary-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-primary-950"
              >
                {pendingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {user.nickname ? `@${user.nickname}` : user.name}
                {invited && <span className="text-xs text-green-600">convidado</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
