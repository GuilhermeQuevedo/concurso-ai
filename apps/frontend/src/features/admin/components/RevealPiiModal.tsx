import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Loader2, Eye, X } from 'lucide-react';

export interface RevealPiiModalProps {
  isOpen: boolean;
  title: string;
  targetName: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

export function RevealPiiModal({
  isOpen,
  title,
  targetName,
  isPending = false,
  onClose,
  onConfirm,
}: RevealPiiModalProps) {
  const [justification, setJustification] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setJustification('');
      const timer = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const trimmed = justification.trim();
  const isValid = trimmed.length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isPending) {
      onConfirm(trimmed);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs motion-safe:animate-in motion-safe:fade-in duration-fast"
      onClick={() => !isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-pii-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:zoom-in-95 duration-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[#F2A93B] dark:bg-amber-500/20 dark:text-[#f7bf67]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reveal-pii-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alvo: <span className="font-semibold text-slate-700 dark:text-slate-300">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Fechar modal"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] transition-colors duration-fast disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LGPD Compliance Warning Banner */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>Aviso de Conformidade LGPD:</strong> A visualização de dados pessoais (PII) é restrita e auditada. Seu acesso será registrado na trilha imutável com seu identificador de administrador, timestamp, IP e a justificativa abaixo.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="justification"
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Justificativa formal do acesso (mínimo 10 caracteres):
            </label>
            <textarea
              id="justification"
              ref={textareaRef}
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex.: Verificação de solicitação de suporte aberta pelo titular sob protocolo #1234."
              className="min-h-[96px] w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              disabled={isPending}
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{trimmed.length} / 10 caracteres mínimos</span>
              {!isValid && justification.length > 0 && (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Mínimo de 10 caracteres obrigatório
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Revelar Dados Pessoais
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
