import { useEffect, useRef, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  readonly title: string;
  readonly message: ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly isPending?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/**
 * Diálogo de confirmação para ações irreversíveis ou destrutivas.
 * Aplica:
 * - Staging: Fundo escurecido e desfocado com transição suave, isolando o foco visual.
 * - Anticipation: Foco inicial fixado no botão seguro ("Cancelar"), prevenindo execuções involuntárias.
 * - Follow Through: Entrada suave do cartão via duration-slow e ease-standard.
 * - Lei de Fitts: Alvos de toque padronizados (mínimo 44px em mobile) e layout responsivo.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Apagar',
  cancelLabel = 'Cancelar',
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPending, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity duration-fast ease-standard"
      onClick={() => {
        if (!isPending) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-slow ease-standard dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {message}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isPending}
            loadingText={confirmLabel}
            leftIcon={<Trash2 className="size-4" />}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
