import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

type Perm = 'default' | 'granted' | 'denied' | 'unsupported';

function currentPerm(): Perm {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as Perm;
}

export function NotificationsCard() {
  const [perm, setPerm] = useState<Perm>(currentPerm);

  const enable = async () => {
    if (perm === 'unsupported') return;
    const result = (await Notification.requestPermission()) as Perm;
    setPerm(result);
    if (result === 'granted') {
      new Notification('Notificações ativadas ✅', {
        body: 'Você será avisado das revisões e tarefas pendentes.',
      });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Notificações de revisão</h3>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Receba um aviso do navegador quando tiver flashcards e tarefas pendentes do dia.
        </p>
        {perm === 'granted' ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            <Check className="h-3.5 w-3.5" /> Ativadas
          </span>
        ) : perm === 'denied' ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <BellOff className="h-3.5 w-3.5" /> Bloqueadas no navegador
          </span>
        ) : perm === 'unsupported' ? (
          <span className="shrink-0 text-xs text-gray-400">Não suportado neste navegador</span>
        ) : (
          <button
            onClick={enable}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Bell className="h-4 w-4" /> Ativar
          </button>
        )}
      </div>
      {perm === 'denied' && (
        <p className="mt-2 text-xs text-gray-400">
          Para reativar, permita notificações nas configurações do site no seu navegador.
        </p>
      )}
    </div>
  );
}
