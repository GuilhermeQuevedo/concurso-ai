import { useState } from 'react';
import { Shield, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useDsar } from '../hooks/useDsar';

export function PrivacySettingsCard() {
  const { isExporting, isErasing, error, exportData, eraseAccount, clearError } = useDsar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    setActionSuccess(null);
    clearError();
    try {
      await exportData();
      setActionSuccess('Dados exportados com sucesso!');
    } catch {
      // erro gerenciado pelo hook useDsar
    }
  };

  const handleConfirmErasure = async () => {
    const success = await eraseAccount(password || undefined, reason || undefined);
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Privacidade e Dados Pessoais (LGPD)
        </h3>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Gerencie seus direitos como titular de dados pessoais conforme a Lei Geral de Proteção de Dados (Art. 18 da LGPD).
      </p>

      {actionSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Exportação de Dados */}
        <div className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Exportação de dados</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Baixe uma cópia de suas informações cadastrais e dados de estudo em formato JSON interoperável.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <Download className="h-4 w-4 text-gray-500" />
            )}
            <span>{isExporting ? 'Exportando...' : 'Exportar meus dados'}</span>
          </button>
        </div>

        {/* Exclusão de Conta */}
        <div className="flex flex-col gap-3 rounded-lg border border-red-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-950/50">
          <div>
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Excluir minha conta</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Solicite a eliminação definitiva da sua conta e de todos os dados pessoais associados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearError();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir minha conta</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Confirmação de Exclusão Definitiva</h3>
            </div>

            <div className="mb-4 space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <p>
                Esta ação é <strong>irreversível</strong>. Ao confirmar:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Suas redações, histórico de resoluções de questões e flashcards serão permanentemente apagados.</li>
                <li>Sua assinatura no Stripe será cancelada imediatamente.</li>
                <li>Integrações com o Google Calendar serão revogadas e removidas.</li>
              </ul>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <strong>Obrigação Legal e Fiscal (Art. 16, I da LGPD):</strong> Se você realizou compras ou assinaturas na plataforma, os registros fiscais da transação financeira serão preservados de forma anonimizada pelo prazo legal mínimo de 5 anos para cumprimento de obrigações contábeis e tributárias.
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Senha da sua conta (deixe em branco se seu cadastro foi via Google)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Motivo da exclusão (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Nos conte o motivo para melhorarmos..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setPassword('');
                  setReason('');
                  clearError();
                }}
                disabled={isErasing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmErasure}
                disabled={isErasing}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isErasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{isErasing ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
