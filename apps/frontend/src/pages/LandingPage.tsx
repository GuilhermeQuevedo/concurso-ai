import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  HelpCircle,
  LogIn,
  Check,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  FlashcardsIcon,
  SimuladosIcon,
  ProvasComentadasIcon,
  MapaEditalIcon,
  CronogramaIcon,
  AwardIcon,
} from '@/components/icons/EngramaIcons';
import { EngramaWordmark } from '@/components/EngramaWordmark';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useStripeBilling } from '@/features/subscription/hooks/useStripeBilling';
import type { StripePlanType } from '@/features/subscription/types/stripe';

interface PricingPlan {
  type: StripePlanType;
  name: string;
  monthlyEquivalent: string;
  billedText: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
}

const PRICING_PLANS: PricingPlan[] = [
  {
    type: 'monthly',
    name: 'Plano Mensal',
    monthlyEquivalent: 'R$ 29,99',
    billedText: 'Cobrado mensalmente • Cancele quando quiser',
    features: [
      'Geração ilimitada de questões com IA',
      'Questões no padrão fiel da sua banca (Cebraspe, FGV, FCC)',
      'Flashcards inteligentes com repetição espaçada',
      'Cronograma e calendário de estudos com ciclos automáticos',
    ],
  },
  {
    type: 'semestral',
    name: 'Plano Semestral',
    monthlyEquivalent: 'R$ 24,99',
    billedText: 'R$ 149,94 faturado a cada 6 meses (17% OFF)',
    features: [
      'Tudo do Plano Mensal incluso',
      'Desconto garantido de 17%',
      'Ideal para editais publicados e sprints de curto prazo',
      'Simulador da curva de esquecimento (Ebbinghaus)',
      'Suporte prioritário na plataforma',
    ],
  },
  {
    type: 'yearly',
    name: 'Plano Anual',
    monthlyEquivalent: 'R$ 19,99',
    billedText: 'R$ 239,88 faturado anualmente (33% OFF)',
    badge: 'Mais Escolhido • Melhor Custo-Benefício',
    isPopular: true,
    features: [
      'Tudo dos planos anteriores incluso',
      'Maior economia da plataforma (33% de desconto)',
      'Acesso garantido até o dia da sua posse',
      'Sincronização bidirecional com Google Calendar',
      'Acesso antecipado a novas ferramentas e modelos de IA',
      'Garantia incondicional de 7 dias ou seu dinheiro de volta',
    ],
  },
];

const FEATURES_LIST = [
  {
    icon: SimuladosIcon,
    title: 'Questões com IA no Padrão da Banca',
    description:
      'Enunciados inéditos, alternativas contextualizadas e fundamentação jurídica exata no estilo da Cebraspe, FGV, FCC e Vunesp.',
  },
  {
    icon: FlashcardsIcon,
    title: 'Repetição Espaçada com Flashcards',
    description:
      'O algoritmo inteligente calcula o declínio da memória e apresenta cada card no momento exato antes de você esquecer.',
  },
  {
    icon: ProvasComentadasIcon,
    title: 'Caderno do Edital & Gerador de PDF',
    description:
      'Carregue qualquer edital em PDF e transforme tópicos inteiros em baterias estruturadas de estudo em minutos.',
  },
  {
    icon: CronogramaIcon,
    title: 'Ciclo de Estudos & Google Calendar',
    description:
      'Monte sua rotina de estudos diária por blocos e sincronize revisões automaticamente com a sua agenda pessoal.',
  },
  {
    icon: MapaEditalIcon,
    title: 'Progresso por Prova e Tópico',
    description:
      'Marque o que já estudou em cada prova e acompanhe, em tempo real, quanto falta e quais matérias precisam de reforço.',
  },
  {
    icon: AwardIcon,
    title: 'Rankings Semanais & Competição Saudável',
    description:
      'Crie ou participe de grupos de estudo com amigos, dispute posições no ranking e mantenha seu streak de estudo ativo.',
  },
];

const FAQS = [
  {
    q: 'Como funciona o cancelamento da assinatura?',
    a: 'Você tem controle total pela sua área de configurações. O cancelamento pode ser efetuado com 1 clique a qualquer momento, sem retenção nem taxas ocultas.',
  },
  {
    q: 'A garantia de 7 dias é incondicional?',
    a: 'Sim, incondicional. Se você assinar e entender que a metodologia não se adequa ao seu perfil, basta solicitar o reembolso nos primeiros 7 dias e devolvemos 100% do valor.',
  },
  {
    q: 'As questões geradas por IA são confiáveis para concursos públicos?',
    a: 'Sim. Nosso motor utiliza modelos avançados de IA calibrados especificamente com legislação atualizada, jurisprudência recente, súmulas e histórico de pegadinhas das maiores bancas.',
  },
  {
    q: 'Como recebo meu acesso após pagar?',
    a: 'A ativação é instantânea. Assim que o pagamento é processado pela Stripe de forma criptografada, o sistema libera todas as ferramentas da plataforma imediatamente.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCheckout, isStartingCheckout, errorMessage, clearError } = useStripeBilling();
  const [selectedPlanLoading, setSelectedPlanLoading] = useState<StripePlanType | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = (planType: StripePlanType) => {
    setSelectedPlanLoading(planType);
    if (user) {
      startCheckout({ planType });
    } else {
      navigate(`/register?plan=${planType}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 selection:bg-[#2E8C82]/20 selection:text-[#2E8C82]">
      {/* Header Sticky com Superfície Astryx Glass */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center z-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] rounded-lg p-1"
              aria-label="Ir para a página inicial"
            >
              <EngramaWordmark logoClass="h-8 w-8" textClass="text-2xl font-extrabold text-slate-900 dark:text-white" />
            </button>
          </div>

          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 z-10">
            <a
              href="#planos"
              className="text-sm font-semibold text-slate-600 transition-colors duration-fast hover:text-[#2E8C82] dark:text-slate-300 dark:hover:text-[#38b2a6]"
            >
              Planos
            </a>
            <a
              href="#metodologia"
              className="text-sm font-semibold text-slate-600 transition-colors duration-fast hover:text-[#2E8C82] dark:text-slate-300 dark:hover:text-[#38b2a6]"
            >
              Metodologia
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 transition-colors duration-fast hover:text-[#2E8C82] dark:text-slate-300 dark:hover:text-[#38b2a6]"
            >
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-3 z-10">
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast touch-manipulation"
              >
                Acessar Plataforma
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-[#2E8C82] px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast touch-manipulation"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-4 py-1.5 text-xs font-bold text-[#20635c] shadow-xs dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <Sparkles className="h-4 w-4 text-[#2E8C82] dark:text-[#38b2a6]" />
            <span>Inteligência Artificial & Neurociência da Memória para Concursos</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            O que você estuda, <span className="text-[#2E8C82] dark:text-[#38b2a6]">fica.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-300">
            Chega de estudar por horas e esquecer na semana seguinte. O Engrama une a curva de retenção de Ebbinghaus à IA generativa para fixar o conteúdo até a posse.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a
              href="#planos"
              className="min-h-[48px] inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8C82] px-8 py-3.5 text-base font-bold text-white shadow-md shadow-[#2E8C82]/20 hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast sm:w-auto touch-manipulation"
            >
              Ver Planos e Começar
              <ArrowRight className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="min-h-[48px] inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast sm:w-auto touch-manipulation"
            >
              Já tenho uma conta
            </button>
          </div>

          {/* Social Proof & Métricas no Hero */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-10 sm:grid-cols-4 dark:border-slate-800">
            <div className="flex flex-col items-center p-3">
              <span className="text-3xl font-extrabold text-[#2E8C82] dark:text-[#38b2a6]">
                +15.000
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Questões Geradas</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">
                98%
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Retenção com Spaced</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-3xl font-extrabold text-[#2E8C82] dark:text-[#38b2a6]">
                2 seg
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Ativação imediata</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                7 Dias
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Garantia Total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Recursos / Metodologia */}
      <section id="metodologia" className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8C82] dark:text-[#38b2a6]">
              O Arsenal de Estudo de Alta Performance
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Tudo o que você precisa para ser aprovado
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Cada ferramenta foi projetada com base nos princípios de recuperação ativa e consolidação de memória de longo prazo.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_LIST.map((feature, index) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-fast hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] shadow-xs transition-colors duration-fast group-hover:bg-[#2E8C82] group-hover:text-white dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                    <IconComp size={22} />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção de Planos e Preços */}
      <section id="planos" className="border-t border-slate-200 py-20 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8C82] dark:text-[#38b2a6]">
              Investimento no seu cargo público
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Escolha o plano ideal para a sua jornada
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Sem fidelidade forçada. Pagamento 100% criptografado e seguro, com liberação imediata.
            </p>
          </div>

          {errorMessage && (
            <div className="mx-auto mt-8 flex max-w-xl items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-rose-600 hover:underline dark:text-rose-400 font-bold"
              >
                Fechar
              </button>
            </div>
          )}

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.type}
                className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-xs transition-all duration-fast hover:shadow-xl dark:bg-slate-900 ${
                  plan.isPopular
                    ? 'border-2 border-[#2E8C82] shadow-lg ring-2 ring-[#2E8C82]/20 dark:border-[#2E8C82]'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2E8C82] to-[#F2A93B] px-4 py-1 text-xs font-bold text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {plan.monthlyEquivalent}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/mês</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{plan.billedText}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#2E8C82] dark:text-[#38b2a6]" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.type)}
                  disabled={isStartingCheckout}
                  className={`min-h-[48px] flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-xs transition-all duration-fast active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 touch-manipulation ${
                    plan.isPopular
                      ? 'bg-[#2E8C82] text-white shadow-md shadow-[#2E8C82]/30 hover:bg-[#26776f] focus-visible:ring-[#2E8C82] disabled:opacity-60'
                      : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/80 focus-visible:ring-slate-500 disabled:opacity-60'
                  }`}
                >
                  {isStartingCheckout && selectedPlanLoading === plan.type ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-current" />
                      Abrindo pagamento seguro...
                    </>
                  ) : (
                    <>
                      {`Assinar ${plan.name}`}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Banner de Garantia */}
          <div className="mt-14 rounded-2xl border border-[#2E8C82]/30 bg-gradient-to-r from-[#2E8C82]/10 via-emerald-500/5 to-[#2E8C82]/10 p-6 text-center shadow-xs dark:border-[#2E8C82]/30 dark:from-[#2E8C82]/20 dark:to-emerald-950/20">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <ShieldCheck className="h-6 w-6 text-[#2E8C82] dark:text-[#38b2a6]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Garantia Incondicional de 7 Dias
              </h3>
            </div>
            <p className="mx-auto mt-1.5 max-w-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Se você não sentir um salto imediato na retenção dos seus estudos, devolvemos 100% do seu dinheiro com 1 clique. Risco zero para você.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E8C82] dark:text-[#38b2a6]">
              Perguntas Frequentes
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tudo o que você precisa saber
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              const contentId = `landing-faq-${index}`;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 transition-colors duration-fast dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="min-h-[48px] flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:bg-slate-100/60 dark:text-white dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E8C82]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-fast ${
                        isOpen ? 'rotate-180 text-[#2E8C82]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div id={contentId} role="region" className="border-t border-slate-200/60 px-5 pt-3 pb-5 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <EngramaWordmark logoClass="h-7 w-7" textClass="text-lg font-bold text-slate-900 dark:text-white" />

          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            Feito com <BookOpen className="h-3.5 w-3.5 text-[#2E8C82]" /> para concursandos que buscam o topo da lista.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <a href="#planos" className="hover:text-[#2E8C82] transition-colors">Planos</a>
            <span>•</span>
            <button type="button" onClick={() => navigate('/login')} className="hover:text-[#2E8C82] transition-colors">Login</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/termos-de-uso')} className="hover:text-[#2E8C82] transition-colors">Termos de Uso</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/politica-de-privacidade')} className="hover:text-[#2E8C82] transition-colors">Privacidade</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/politica-de-cookies')} className="hover:text-[#2E8C82] transition-colors">Cookies</button>
            <span>•</span>
            <button type="button" onClick={() => navigate('/help')} className="hover:text-[#2E8C82] transition-colors flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Ajuda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
