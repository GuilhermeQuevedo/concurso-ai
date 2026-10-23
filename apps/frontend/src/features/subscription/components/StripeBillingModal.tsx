import { useState } from 'react';
import {
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useStripeBilling } from '../hooks/useStripeBilling';
import type { StripePlanType } from '../types/stripe';

export interface StripeBillingModalProps {
  onClose: () => void;
}

interface PlanOption {
  type: StripePlanType;
  title: string;
  monthlyEquivalent: string;
  billingText: string;
  badge?: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    type: 'monthly',
    title: 'Mensal',
    monthlyEquivalent: 'R$ 29,99',
    billingText: 'Cobrado todo mês',
  },
  {
    type: 'semestral',
    title: 'Semestral',
    monthlyEquivalent: 'R$ 24,99',
    billingText: 'R$ 149,94 faturado a cada 6 meses',
    badge: '17% OFF',
  },
  {
    type: 'yearly',
    title: 'Anual',
    monthlyEquivalent: 'R$ 19,99',
    billingText: 'R$ 239,88 faturado por ano',
    badge: 'Mais Popular • 33% OFF',
  },
];

export function StripeBillingModal({ onClose }: StripeBillingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<StripePlanType>('yearly');

  const {
    config,
    invoices,
    isLoadingConfig,
    isLoadingInvoices,
    isStartingCheckout,
    isOpeningPortal,
    errorMessage,
    clearError,
    startCheckout,
    openCustomerPortal,
  } = useStripeBilling();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
              <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pagamentos & Assinatura (Stripe)</h2>
                {config?.isConfigured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Stripe Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie sua assinatura, formas de pagamento e notas fiscais / faturas
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

        {errorMessage && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
            <button onClick={clearError} className="text-red-600 hover:underline">
              Fechar
            </button>
          </div>
        )}

        {isLoadingConfig ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 to-purple-50/30 p-5 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-purple-950/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                  Planos Engrama Pro
                </span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Acesso Ilimitado
                </span>
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">
                Escolha o seu ciclo de assinatura
              </h3>
              <p className="mb-4 text-xs text-gray-600 dark:text-gray-300">
                Questões com IA no estilo da sua banca, redações corrigidas, flashcards e cronograma inteligente.
              </p>

              <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {PLAN_OPTIONS.map((plan) => {
                  const isSelected = selectedPlan === plan.type;
                  return (
                    <button
                      key={plan.type}
                      type="button"
                      onClick={() => setSelectedPlan(plan.type)}
                      className={`relative flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-sm dark:bg-gray-800'
                          : 'border-gray-200 bg-white/70 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-850'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2.5 right-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{plan.title}</span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <div className="mt-2 text-lg font-extrabold text-gray-900 dark:text-white">
                        {plan.monthlyEquivalent}
                        <span className="text-xs font-normal text-gray-500">/mês</span>
                      </div>
                      <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{plan.billingText}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={() => startCheckout({ planType: selectedPlan })}
                  disabled={isStartingCheckout}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50"
                >
                  {isStartingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Iniciando Checkout...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Assinar Plano Selecionado
                    </>
                  )}
                </button>

                <button
                  onClick={() => openCustomerPortal()}
                  disabled={isOpeningPortal}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 disabled:opacity-50"
                >
                  {isOpeningPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Portal do Cliente (Faturas & Cartão)
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Faturas & Recibos (Invoicing)</h3>
                </div>
                {isLoadingInvoices && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
              </div>

              {invoices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhuma fatura encontrada nesta conta ainda. Quando uma compra for realizada, ela aparecerá aqui para download.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Fatura #{inv.number ?? inv.id.slice(0, 10)}
                          </span>
                          <span className="ml-2 text-gray-500">
                            {new Date(inv.created * 1000).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(inv.amountPaid / 100).toLocaleString('pt-BR', { style: 'currency', currency: inv.currency })}
                        </span>
                        {inv.pdfUrl && (
                          <a
                            href={inv.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
