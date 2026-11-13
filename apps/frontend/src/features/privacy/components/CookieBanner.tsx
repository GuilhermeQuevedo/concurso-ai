import { useState } from 'react';
import { Link } from 'react-router';
import { Cookie, Shield, Check, X } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';

export function CookieBanner() {
  const {
    hasConsented,
    consent,
    isPreferencesOpen,
    openPreferences,
    closePreferences,
    acceptAll,
    acceptNecessaryOnly,
    saveCustomPreferences,
  } = useCookieConsent();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => consent?.preferences.analytics ?? false,
  );
  const [marketingEnabled, setMarketingEnabled] = useState(
    () => consent?.preferences.marketing ?? false,
  );

  // Se já consentiu e a modal de preferências não está aberta, não renderiza nada
  if (hasConsented && !isPreferencesOpen) {
    return null;
  }

  const handleSaveCustom = () => {
    saveCustomPreferences({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });
  };

  return (
    <>
      {/* Banner Principal Fixo na Base */}
      {!hasConsented && (
        <aside
          role="region"
          aria-label="Consentimento de Cookies"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 shrink-0">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Sua privacidade e controle de cookies (LGPD)
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Utilizamos cookies essenciais para autenticação e segurança. Com seu consentimento
                    explícito, podemos utilizar cookies analíticos anônimos para aprimorar sua experiência de estudos.
                    Consulte nossa{' '}
                    <Link
                      to="/politica-de-cookies"
                      className="font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
                    >
                      Política de Cookies
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openPreferences}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                >
                  Gerenciar preferências
                </button>
                <button
                  type="button"
                  onClick={acceptNecessaryOnly}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
                >
                  Aceitar necessários
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700 shadow-sm"
                >
                  Aceitar todos
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal / Painel de Gerenciamento de Preferências */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Preferências de Cookies e Privacidade
                </h3>
              </div>
              {hasConsented && (
                <button
                  type="button"
                  onClick={closePreferences}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
              Personalize quais categorias de cookies você autoriza. Cookies essenciais não podem ser desativados
              pois são necessários para o funcionamento e login na plataforma.
            </p>

            <div className="space-y-3 mb-6">
              {/* Necessários */}
              <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Cookies Necessários</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Sempre Ativos
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Sessão segura de autenticação (JWT), prevenção de ataques CSRF e preferências de tema.
                  </p>
                </div>
                <div className="pt-0.5">
                  <div className="inline-flex h-5 w-9 items-center rounded-full bg-emerald-600 px-1 opacity-75 cursor-not-allowed">
                    <span className="h-3.5 w-3.5 translate-x-3.5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Analíticos */}
              <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-850">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Cookies Analíticos</span>
                    <span className="text-[10px] text-gray-400">(Opcional)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Métricas de uso anônimas para entender o engajamento e aprimorar as ferramentas de estudo.
                  </p>
                </div>
                <div className="pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    onClick={() => setAnalyticsEnabled((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      analyticsEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        analyticsEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-850">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Cookies de Marketing</span>
                    <span className="text-[10px] text-gray-400">(Opcional)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Aferição de campanhas institucionais e canais de atração de novos concurseiros.
                  </p>
                </div>
                <div className="pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketingEnabled}
                    onClick={() => setMarketingEnabled((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      marketingEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        marketingEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={acceptNecessaryOnly}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Rejeitar opcionais
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Salvar preferências</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
