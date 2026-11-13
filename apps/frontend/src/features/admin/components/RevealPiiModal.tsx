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
      setTimeout(() => textareaRef.current?.focus(), 50);
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

  const isValid = justification.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isPending) {
      onConfirm(justification.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={() => !isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-pii-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reveal-pii-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Alvo: <span className="font-semibold text-gray-700 dark:text-gray-300">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <strong>Aviso de Conformidade LGPD:</strong> A visualização de dados pessoais (PII) é restrita e
          auditada. Seu acesso será registrado na trilha imutável com seu identificador de administrador, timestamp, IP e a justificativa abaixo.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="justification" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Justificativa formal do acesso (mínimo 10 caracteres):
            </label>
            <textarea
              id="justification"
              ref={textareaRef}
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex.: Verificação de solicitação de suporte aberta pelo titular sob protocolo #1234."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              disabled={isPending}
            />
            <div className="mt-1 flex justify-between text-[11px] text-gray-400">
              <span>{justification.trim().length} / 10 caracteres mínimos</span>
              {!isValid && justification.length > 0 && (
                <span className="text-red-500">Mínimo de 10 caracteres obrigatório</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Revelar Dados Pessoais
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
