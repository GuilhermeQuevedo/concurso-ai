import { CheckCircle2, X, XCircle } from 'lucide-react';

import { dismissToast, useToasts, type ToastKind } from './toast-store';

const STYLES: Record<ToastKind, string> = {
  error: 'border-destructive/40 bg-card text-destructive',
  success: 'border-emerald-500/40 bg-card text-emerald-500',
};

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 text-sm shadow-lg ${STYLES[item.kind]}`}
        >
          {item.kind === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <p className="flex-1 text-foreground">{item.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            aria-label="Fechar aviso"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
