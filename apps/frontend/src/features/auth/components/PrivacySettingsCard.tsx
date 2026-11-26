import { useState } from 'react';
import { Shield, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@astryxdesign/core';
import { useDsar } from '../hooks/useDsar';
import { isFeatureEnabled } from '@/config/feature-flags';

export function PrivacySettingsCard() {
  const { isExporting, isErasing, error, exportData, eraseAccount, clearError } = useDsar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [reason, setReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const isAstryxSettings = isFeatureEnabled('ASTRYX_SETTINGS');

  const handleConfirmExport = async () => {
    setActionSuccess(null);
    clearError();
    try {
      await exportData(exportPassword || undefined);
      setActionSuccess('Dados exportados com sucesso!');
      setIsExportModalOpen(false);
      setExportPassword('');
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
    <div
      data-astryx-theme={isAstryxSettings ? 'engrama' : undefined}
      className={
        isAstryxSettings
          ? 'rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-5 text-[var(--color-text-primary)] shadow-xs transition-colors'
          : 'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900'
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[var(--color-brand,#2E8C82)]" />
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          Privacidade e Dados Pessoais (LGPD)
        </h3>
      </div>

      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        Gerencie seus direitos como titular de dados pessoais conforme a Lei Geral de Proteção de Dados (Art. 18 da LGPD).
      </p>

      {actionSuccess && (
        <div className="mb-4 rounded-xl border border-hairline bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-hairline bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Exportação de Dados */}
        <div className="flex flex-col gap-3 rounded-xl border border-hairline p-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--color-canvas)]">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Exportação de dados</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Baixe uma cópia de suas informações cadastrais e dados de estudo em formato JSON interoperável.
            </p>
          </div>
          {isAstryxSettings ? (
            <Button
              type="button"
              variant="secondary"
              label={isExporting ? 'Exportando...' : 'Exportar meus dados'}
              isDisabled={isExporting}
              onClick={() => {
                clearError();
                setIsExportModalOpen(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 font-medium"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-secondary)]" />
              ) : (
                <Download className="h-4 w-4 text-[var(--color-text-secondary)]" />
              )}
              <span>{isExporting ? 'Exportando...' : 'Exportar meus dados'}</span>
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => {
                clearError();
                setIsExportModalOpen(true);
              }}
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
          )}
        </div>

        {/* Exclusão de Conta */}
        <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 p-4 sm:flex-row sm:items-center sm:justify-between bg-red-500/5">
          <div>
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Excluir minha conta</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Solicite a eliminação definitiva da sua conta e de todos os dados pessoais associados.
            </p>
          </div>
          {isAstryxSettings ? (
            <Button
              type="button"
              variant="destructive"
              label="Excluir minha conta"
              onClick={() => {
                clearError();
                setIsModalOpen(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span>Excluir minha conta</span>
            </Button>
          ) : (
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
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exportação */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            data-astryx-theme={isAstryxSettings ? 'engrama' : undefined}
            className="w-full max-w-md rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1,#ffffff)] p-6 shadow-2xl text-[var(--color-text-primary)]"
          >
            <div className="mb-4 flex items-center gap-3 text-[var(--color-brand,#2E8C82)]">
              <Download className="h-6 w-6" />
              <h3 className="text-lg font-bold">Exportação de Dados Pessoais</h3>
            </div>

            <p className="mb-4 text-xs text-[var(--color-text-secondary)]">
              Por segurança, confirme sua senha para realizar o download dos seus dados cadastrais e de estudo (Art. 18 da LGPD).
            </p>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Senha da sua conta (deixe em branco se seu cadastro foi via Google)
                </label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full rounded-xl border border-control-interactive bg-[var(--color-canvas)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-hairline bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {isAstryxSettings ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    label="Cancelar exportação"
                    isDisabled={isExporting}
                    onClick={() => {
                      setIsExportModalOpen(false);
                      setExportPassword('');
                      clearError();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    label={isExporting ? 'Exportando...' : 'Confirmar e Baixar'}
                    isDisabled={isExporting}
                    onClick={handleConfirmExport}
                    className="inline-flex items-center gap-2"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>{isExporting ? 'Exportando...' : 'Confirmar e Baixar'}</span>
                  </Button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      setExportPassword('');
                      clearError();
                    }}
                    disabled={isExporting}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>{isExporting ? 'Exportando...' : 'Confirmar e Baixar'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            data-astryx-theme={isAstryxSettings ? 'engrama' : undefined}
            className="w-full max-w-lg rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1,#ffffff)] p-6 shadow-2xl text-[var(--color-text-primary)]"
          >
            <div className="mb-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Confirmação de Exclusão Definitiva</h3>
            </div>

            <div className="mb-4 space-y-3 text-xs text-[var(--color-text-secondary)]">
              <p>
                Esta ação é <strong>irreversível</strong>. Ao confirmar:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Suas redações, histórico de resoluções de questões e flashcards serão permanentemente apagados.</li>
                <li>Sua assinatura no Stripe será cancelada imediatamente.</li>
                <li>Integrações com o Google Calendar serão revogadas e removidas.</li>
              </ul>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-200">
                <strong>Obrigação Legal e Fiscal (Art. 16, I da LGPD):</strong> Se você realizou compras ou assinaturas na plataforma, os registros fiscais da transação financeira serão preservados de forma anonimizada pelo prazo legal mínimo de 5 anos para cumprimento de obrigações contábeis e tributárias.
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Senha da sua conta (deixe em branco se seu cadastro foi via Google)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full rounded-xl border border-control-interactive bg-[var(--color-canvas)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Motivo da exclusão (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Nos conte o motivo para melhorarmos..."
                  className="w-full rounded-xl border border-control-interactive bg-[var(--color-canvas)] px-3.5 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-hairline bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {isAstryxSettings ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    label="Cancelar exclusão"
                    isDisabled={isErasing}
                    onClick={() => {
                      setIsModalOpen(false);
                      setPassword('');
                      setReason('');
                      clearError();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    label={isErasing ? 'Excluindo...' : 'Confirmar Exclusão'}
                    isDisabled={isErasing}
                    onClick={handleConfirmErasure}
                    className="inline-flex items-center gap-2"
                  >
                    {isErasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>{isErasing ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
