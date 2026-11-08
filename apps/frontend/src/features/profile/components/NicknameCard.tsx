import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AtSign, Loader2 } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import { getErrorMessage } from '@/utils/error-message';

const NICKNAME_MIN = 3;
const NICKNAME_MAX = 15;
const NICKNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

function validate(value: string): string | null {
  if (value.length < NICKNAME_MIN) return `Use pelo menos ${NICKNAME_MIN} caracteres.`;
  if (!NICKNAME_PATTERN.test(value)) return 'Use apenas letras, números e _, começando por uma letra.';
  return null;
}

// Nickname é como os colegas te encontram para convidar para grupos.
export function NicknameCard() {
  const { user, refreshProfile } = useAuth();
  const [value, setValue] = useState(user?.nickname ?? '');
  const trimmed = value.trim();
  const error = trimmed ? validate(trimmed) : null;
  const unchanged = trimmed === (user?.nickname ?? '');

  const save = useMutation({
    mutationFn: () => authService.updateProfile({ nickname: trimmed }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Nickname salvo.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Não foi possível salvar o nickname.')),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <AtSign className="h-4 w-4 text-primary-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Nickname</h3>
      </div>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Seus colegas usam o nickname para te convidar para grupos de estudo. De {NICKNAME_MIN} a {NICKNAME_MAX} caracteres: letras, números e _.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed && !error && !unchanged) save.mutate();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
          <input
            value={value}
            maxLength={NICKNAME_MAX}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Nickname"
            aria-invalid={!!error}
            className="w-44 rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={!trimmed || !!error || unchanged || save.isPending}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </button>
      </form>
      {error && trimmed && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
