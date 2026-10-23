import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Unlink,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCalendarIntegration } from '../hooks/useCalendarIntegration';

export interface GoogleCalendarPluginModalProps {
  onClose: () => void;
}

export function GoogleCalendarPluginModal({ onClose }: GoogleCalendarPluginModalProps) {
  const {
    integration,
    isLoading,
    copied,
    feedbackMessage,
    isUpdating,
    isRegenerating,
    isSyncing,
    isDisconnecting,
    updateSettings,
    regenerateToken,
    syncGoogle,
    disconnectGoogle,
    copyToClipboard,
    openGoogleCalendarWeb,
    startGoogleOAuth,
  } = useCalendarIntegration();

  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4" />
                <path d="M3 9H21" stroke="white" strokeWidth="2" />
                <rect x="7" y="2" width="2" height="4" rx="1" fill="#EA4335" />
                <rect x="15" y="2" width="2" height="4" rx="1" fill="#EA4335" />
                <text x="12" y="17" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">31</text>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plugin Google Calendar</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Plugin Ativo
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sincronize automaticamente seus estudos e provas na sua agenda Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {feedbackMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {feedbackMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : !integration ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Não foi possível carregar a integração de calendário.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-indigo-50/30 p-5 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Integração Direta com Google Agenda
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Recomendado
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                Adicione o calendário de estudos do Engrama ao seu Google Agenda com 1 clique. Quaisquer alterações
                feitas no seu cronograma serão refletidas no seu Google Calendar.
              </p>

              <button
                onClick={openGoogleCalendarWeb}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Adicionar ao meu Google Agenda</span>
                <ExternalLink className="h-4 w-4 opacity-80" />
              </button>

              <div className="mt-4 pt-4 border-t border-blue-100/80 dark:border-blue-900/30">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Ou copie a URL segura do feed (.ics) para inscrição manual:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={integration.feedUrl}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-600 select-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                  <button
                    onClick={() => copyToClipboard(integration.feedUrl)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Compatível também com Apple Calendar, Outlook e celulares.</span>
                  {confirmRegenerate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Revogar link anterior?</span>
                      <button
                        onClick={() => {
                          regenerateToken();
                          setConfirmRegenerate(false);
                        }}
                        disabled={isRegenerating}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmRegenerate(false)}
                        className="text-gray-500 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRegenerate(true)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                    >
                      Regerar chave de segurança
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Opções de Sincronização</h3>
                </div>
                {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200/80 cursor-pointer dark:bg-gray-800 dark:border-gray-700/80">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Tarefas Diárias de Estudo</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Sincroniza tópicos, revisões espaçadas e redações do edital</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integration.syncTasks}
                    onChange={(e) => updateSettings({ syncTasks: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200/80 cursor-pointer dark:bg-gray-800 dark:border-gray-700/80">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Datas das Provas</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Sincroniza o dia da prova dos seus concursos cadastrados</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={integration.syncExams}
                    onChange={(e) => updateSettings({ syncExams: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary-600 cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200/80 dark:bg-gray-800 dark:border-gray-700/80">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Horário Padrão de Início</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Hora que as tarefas diárias começam na sua agenda</p>
                  </div>
                  <input
                    type="time"
                    value={integration.defaultTime}
                    onChange={(e) => updateSettings({ defaultTime: e.target.value })}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {integration.isGoogleConfigured && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sincronização Bidirecional via API Google</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {integration.isGoogleConnected
                        ? `Conectado via OAuth. Última sincronização: ${integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleString('pt-BR') : 'Pendente'}`
                        : 'Conecte sua conta Google para sincronizar eventos diretamente como um calendário secundário.'}
                    </p>
                  </div>

                  {integration.isGoogleConnected ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncGoogle()}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-300"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sincronizar</span>
                      </button>
                      <button
                        onClick={() => disconnectGoogle()}
                        disabled={isDisconnecting}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        <span>Desconectar</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startGoogleOAuth}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      Conectar Conta Google
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
