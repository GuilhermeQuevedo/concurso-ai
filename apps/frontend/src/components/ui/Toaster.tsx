import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { Toast as AstryxToast } from '@astryxdesign/core';

import { isFeatureEnabled } from '@/config/feature-flags';
import { dismissToast, useToasts, type ToastKind } from './toast-store';

const STYLES: Record<ToastKind, string> = {
  error: 'border-destructive/40 bg-card text-destructive',
  success: 'border-emerald-500/40 bg-card text-emerald-500',
  warning: 'border-amber-500/40 bg-card text-amber-500',
};

interface ToastItemProps {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

/**
 * Toast individual renderizado via Astryx Toast sob a flag ASTRYX_FEEDBACK.
 */
function AstryxToastItem({ id, kind, message }: ToastItemProps) {
  return (
    <div className="pointer-events-auto">
      <AstryxToast
        type={kind === 'error' ? 'error' : kind === 'warning' ? 'warning' : 'info'}
        body={message}
        isAutoHide={true}
        autoHideDuration={5000}
        onDismiss={() => dismissToast(id)}
      />
    </div>
  );
}

/**
 * Toast individual legatário com Tailwind para fallback seguro.
 */
function LegacyToastItem({ id, kind, message }: ToastItemProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 text-sm shadow-lg ${STYLES[kind]}`}
    >
      {kind === 'error' ? (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : kind === 'warning' ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1 text-foreground">{message}</p>
      <button
        type="button"
        onClick={() => dismissToast(id)}
        aria-label="Fechar aviso"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Ponto de montagem global para notificações toast da plataforma.
 */
export function Toaster() {
  const toasts = useToasts();
  const isAstryxActive = isFeatureEnabled('ASTRYX_FEEDBACK');

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((item) =>
        isAstryxActive ? (
          <AstryxToastItem key={item.id} id={item.id} kind={item.kind} message={item.message} />
        ) : (
          <LegacyToastItem key={item.id} id={item.id} kind={item.kind} message={item.message} />
        ),
      )}
    </div>
  );
}
