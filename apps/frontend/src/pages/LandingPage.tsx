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
      'Correção aprofundada de redações com critérios oficiais',
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
    title: 'Mapeamento de Tópicos e Fraquezas',
    description:
      'Quadro visual em tempo real mostrando onde você domina e quais matérias precisam de reforço imediato antes da prova.',
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
    a: 'Você tem controle total pelo portal de autoatendimento Stripe. O cancelamento pode ser feito com 1 clique a qualquer momento, sem taxas ocultas.',
  },
  {
    q: 'A garantia de 7 dias é real?',
    a: 'Sim, incondicional. Se você assinar e não gostar por qualquer motivo, basta solicitar o reembolso nos primeiros 7 dias e o Stripe estorna 100% do valor.',
  },
  {
    q: 'As questões geradas por IA são confiáveis para concursos?',
    a: 'Sim. Nosso motor utiliza modelos avançados de IA treinados especificamente com jurisprudência, súmulas e histórico de pegadinhas das maiores bancas do país.',
  },
  {
    q: 'Como recebo meu acesso após pagar?',
    a: 'A ativação é instantânea. O Stripe processa seu pagamento e o sistema libera o acesso em menos de 2 segundos.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCheckout, isStartingCheckout } = useStripeBilling();
  const [selectedPlanLoading, setSelectedPlanLoading] = useState<StripePlanType | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = async (planType: StripePlanType) => {
    if (user) {
      setSelectedPlanLoading(planType);
      try {
        startCheckout({ planType });
      } finally {
        setSelectedPlanLoading(null);
      }
    } else {
      navigate(`/register?plan=${planType}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Header Sticky com Efeito Glass */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Lado Esquerdo: Logo Engrama */}
          <div className="flex items-center z-10">
            <button
              onClick={() => navigate('/')}
              className="flex items-center focus:outline-none"
              aria-label="Ir para a página inicial"
            >
              <EngramaWordmark logoClass="h-8 w-8" textClass="text-2xl text-slate-900 dark:text-white" />
            </button>
          </div>

          {/* Centro: Links de Navegação Perfeitamente Centralizados */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 z-10">
            <a
              href="#planos"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
            >
              Planos
            </a>
            <a
              href="#metodologia"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
            >
              Metodologia
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
            >
              Dúvidas
            </a>
          </nav>

          {/* Lado Direito: Ações / Login */}
          <div className="flex items-center gap-3 z-10">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-xs"
              >
                Acessar Plataforma
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-ghost flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary rounded-lg px-4 py-2 text-sm font-bold shadow-xs"
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
          {/* Badge de Destaque */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-800 shadow-xs dark:border-teal-800/60 dark:bg-teal-950/60 dark:text-teal-300">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Inteligência Artificial & Neurociência da Memória para Concursos</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            O que você estuda, <span className="text-teal-600 dark:text-teal-400">fica.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-300">
            Chega de estudar por horas e esquecer na semana seguinte. O Engrama une a curva de retenção de Ebbinghaus à IA generativa para fixar o conteúdo até a posse.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a
              href="#planos"
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold shadow-md sm:w-auto"
            >
              Ver Planos e Começar
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold sm:w-auto"
            >
              Já tenho uma conta
            </button>
          </div>

          {/* Social Proof & Métricas no Hero */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-10 sm:grid-cols-4 dark:border-slate-800">
            <div className="flex flex-col items-center p-3">
              <span className="metric-value text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                +15.000
              </span>
              <span className="metric-label mt-1 text-[11px]">Questões Geradas</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="metric-value text-3xl font-extrabold text-amber-500">
                98%
              </span>
              <span className="metric-label mt-1 text-[11px]">Retenção com Spaced</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="metric-value text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                2 seg
              </span>
              <span className="metric-label mt-1 text-[11px]">Ativação Stripe</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="metric-value text-3xl font-extrabold text-slate-800 dark:text-white">
                7 Dias
              </span>
              <span className="metric-label mt-1 text-[11px]">Garantia Total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Recursos com os Novos Ícones Customizados */}
      <section id="metodologia" className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              O Arsenal do Concursando de Alta Performance
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Tudo o que você precisa para ser aprovado
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              Cada ferramenta foi projetada com base nos princípios de recuperação ativa e consolidação de memória de longo prazo.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_LIST.map((feature, index) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={index}
                  className="card-primary group relative flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shadow-xs transition-colors group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-950/80 dark:text-teal-300">
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

      {/* Seção de Planos e Preços Refatorada */}
      <section id="planos" className="border-t border-slate-200 py-20 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Investimento no seu cargo público
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Escolha o plano ideal para a sua jornada
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              Sem fidelidade forçada. Pagamento 100% criptografado e seguro pelo Stripe com liberação imediata.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.type}
                className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-xs transition-all hover:shadow-xl dark:bg-slate-900 ${
                  plan.isPopular
                    ? 'border-2 border-teal-600 shadow-lg ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-600 to-amber-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {plan.monthlyEquivalent}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/mês</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{plan.billedText}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.type)}
                  disabled={isStartingCheckout && selectedPlanLoading === plan.type}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
                    plan.isPopular
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 hover:bg-teal-700 hover:shadow-lg'
                      : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750'
                  }`}
                >
                  {isStartingCheckout && selectedPlanLoading === plan.type ? (
                    'Abrindo Checkout Stripe...'
                  ) : (
                    <>
                      Assinar {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Banner de Garantia Stripe */}
          <div className="mt-14 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-teal-50/70 p-6 text-center dark:border-teal-900/40 dark:from-teal-950/30 dark:to-emerald-950/20">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <ShieldCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Garantia Incondicional de 7 Dias
              </h4>
            </div>
            <p className="mx-auto mt-1 max-w-xl text-xs text-slate-600 dark:text-slate-300">
              Se você não sentir um salto imediato na memorização dos seus estudos, devolvemos 100% do seu dinheiro com 1 clique pela Stripe. Risco zero para você.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Perguntas Frequentes
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tudo o que você precisa saber
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180 text-teal-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200/60 px-5 pt-3 pb-5 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
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
          <EngramaWordmark logoClass="h-7 w-7" textClass="text-lg text-slate-900 dark:text-white" />

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            Feito com <BookOpen className="h-3.5 w-3.5 text-teal-600" /> para concursandos que buscam o topo da lista.
          </p>

          <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <a href="#planos" className="hover:text-teal-600">Planos</a>
            <span>•</span>
            <button onClick={() => navigate('/login')} className="hover:text-teal-600">Login</button>
            <span>•</span>
            <button onClick={() => navigate('/help')} className="hover:text-teal-600 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Ajuda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
