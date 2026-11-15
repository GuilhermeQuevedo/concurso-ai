import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { friendService } from '@/features/friends/services/friend.service';
import { getErrorMessage } from '@/utils/error-message';

import { groupService } from '../services/group.service';

type InviteTarget = { nickname: string } | { friendUserId: string };

// Orquestra o convite ao grupo: amigos que ainda não são membros, convite por amigo ou por nickname/código.
export function useGroupInvite(groupId: string, memberIds: string[]) {
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const { data: overview } = useQuery({ queryKey: ['friends'], queryFn: friendService.overview });
  const friends = (overview?.friends ?? []).filter((friend) => !memberIds.includes(friend.user.id));

  const invite = useMutation({
    mutationFn: (target: InviteTarget) => groupService.invite(groupId, target),
    onSuccess: (_data, target) => {
      toast.success('Convite enviado.');
      if ('friendUserId' in target) setInvitedIds((current) => [...current, target.friendUserId]);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar o convite.')),
  });

  const pendingFriendId = invite.isPending && invite.variables && 'friendUserId' in invite.variables ? invite.variables.friendUserId : null;

  return {
    friends,
    invitedIds,
    pendingFriendId,
    isInviting: invite.isPending,
    inviteFriend: (friendUserId: string) => invite.mutate({ friendUserId }),
    inviteByNickname: (nickname: string, onSuccess: () => void) => invite.mutate({ nickname }, { onSuccess }),
  };
}
