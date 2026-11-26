import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MessageCircle, RefreshCw, KeyRound, Check } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getErrorMessage } from '@/utils/error-message';

import { friendService } from '../services/friend.service';

const QUERY_KEY = ['friend-code'];

function buildWhatsappLink(code: string, nickname: string | null): string {
  const who = nickname ? ` ou pelo nickname @${nickname}` : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engrama.ai';
  const message = `Me adiciona no Engrama! Meu código de amigo é ${code}${who}. Acesse ${origin}/friends`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Código pessoal para compartilhar com outros estudantes
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
    <section
      aria-label="Código de Amigo"
      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <KeyRound className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Seu código de amigo
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Passe este código{user?.nickname ? ` (ou o seu nickname @${user.nickname})` : ''} para os amigos adicionarem você na rede de estudos.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <code
          className="min-h-[44px] inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 font-mono text-xl font-extrabold tracking-widest text-[#2E8C82] select-all dark:bg-slate-800 dark:text-[#38b2a6]"
          aria-label="Seu código de amigo"
        >
          {code ?? '········'}
        </code>

        <button
          type="button"
          onClick={copy}
          disabled={!code}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>

        {code && (
          <a
            href={buildWhatsappLink(code, user?.nickname ?? null)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 transition-all duration-fast touch-manipulation dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
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
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
