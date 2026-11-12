import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MessageCircle, RefreshCw } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getErrorMessage } from '@/utils/error-message';

import { friendService } from '../services/friend.service';

const QUERY_KEY = ['friend-code'];

function whatsappLink(code: string, nickname: string | null): string {
  const who = nickname ? ` ou pelo nickname @${nickname}` : '';
  const message = `Me adiciona no Engrama! Meu código de amigo é ${code}${who}. Entre em ${window.location.origin}/friends`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Código pessoal: é o que a pessoa passa para os amigos adicionarem.
export function MyFriendCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { data: code } = useQuery({ queryKey: QUERY_KEY, queryFn: friendService.code });

  const regenerate = useMutation({
    mutationFn: friendService.regenerateCode,
    onSuccess: (next) => {
      queryClient.setQueryData(QUERY_KEY, next);
      toast.success('Código novo gerado. O anterior deixou de valer.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível gerar um código novo.')),
  });

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Selecione o código e copie manualmente.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Seu código de amigo</h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Passe este código{user?.nickname ? ` (ou o seu nickname @${user.nickname})` : ''} para os amigos adicionarem você.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-gray-100 px-4 py-2 font-mono text-xl font-bold tracking-widest text-primary-600 dark:bg-gray-800 dark:text-primary-400" aria-label="Seu código de amigo">
          {code ?? '········'}
        </code>
        <button type="button" onClick={copy} disabled={!code} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          <Copy className="h-4 w-4" /> {copied ? 'Copiado!' : 'Copiar'}
        </button>
        {code && (
          <a
            href={whatsappLink(code, user?.nickname ?? null)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          title="Gerar um código novo (o atual deixa de valer)"
          aria-label="Gerar código novo"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
