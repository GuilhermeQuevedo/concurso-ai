import { useQuery } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';

import { AddFriendForm } from '@/features/friends/components/AddFriendForm';
import { FriendLists } from '@/features/friends/components/FriendLists';
import { MyFriendCode } from '@/features/friends/components/MyFriendCode';
import { friendService } from '@/features/friends/services/friend.service';

export function FriendsPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.overview,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <Users className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Amigos & Comunidade de Estudos
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Estudar com parceiros conhecidos fortalece a disciplina diária, o compromisso mútuo e a constância no edital.
        </p>
      </div>

      {/* Code Sharing & Add Friend Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <MyFriendCode />
        <AddFriendForm />
      </div>

      {/* Friends Lists Section */}
      {isLoading || !overview ? (
        <div className="flex justify-center py-16" role="status" aria-label="Carregando lista de amigos">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
        </div>
      ) : (
        <FriendLists overview={overview} />
      )}
    </div>
  );
}

export default FriendsPage;
