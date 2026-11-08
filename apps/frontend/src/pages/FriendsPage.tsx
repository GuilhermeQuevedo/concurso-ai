import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { AddFriendForm } from '@/features/friends/components/AddFriendForm';
import { FriendLists } from '@/features/friends/components/FriendLists';
import { MyFriendCode } from '@/features/friends/components/MyFriendCode';
import { friendService } from '@/features/friends/services/friend.service';

export function FriendsPage() {
  const { data: overview, isLoading } = useQuery({ queryKey: ['friends'], queryFn: friendService.overview });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amigos</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Estudar com quem você conhece é mais fácil de manter.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <MyFriendCode />
        <AddFriendForm />
      </div>

      {isLoading || !overview ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <FriendLists overview={overview} />
      )}
    </div>
  );
}
