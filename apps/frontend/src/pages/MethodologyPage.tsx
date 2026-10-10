import {
  FlaskConical,
  Repeat,
  Clock,
  Target,
  Brain,
  MessageCircle,
  Lightbulb,
  Shuffle,
  BookMarked,
  Layers,
  CheckCircle2,
  Trophy,
  Gauge,
  Bell,
  type LucideIcon,
} from 'lucide-react';

interface Method {
  icon: LucideIcon;
  title: string;
  science: string;
  study: string;
  app: string[];
}

interface Section {
  title: string;
  subtitle: string;
  methods: Method[];
}

const SECTIONS: Section[] = [
  {
    title: 'Como fixamos na memória',
    subtitle: 'Princípios de memória (Griggs, cap. 5)',
    methods: [
      {
        icon: Repeat,
        title: 'Repetição espaçada',
        science:
          'Estudar distribuído no tempo retém muito mais que estudar tudo de uma vez na véspera.',
        study: 'Payne & Wenger (1996)',
        app: [
          'Os flashcards usam o algoritmo SM-2: cada card volta em intervalos crescentes (1 → 6 → 15 → 30+ dias).',
          'Acertou com facilidade? O card demora mais pra voltar. Errou? Volta amanhã.',
        ],
      },
      {
        icon: Clock,
        title: 'Curva do esquecimento',
        science:
          'A maior parte do esquecimento acontece nos primeiros ~2 dias; depois estabiliza. A 1ª revisão precisa ser cedo.',
        study: 'Ebbinghaus (1885)',
        app: [
          'A primeira revisão é agendada logo (mesmo dia/dia seguinte), antes da queda mais forte.',
          'O "Simulador de Memória" mostra visualmente a curva e o efeito das revisões.',
        ],
      },
      {
        icon: Target,
        title: 'Recordação ativa (não releitura)',
        science:
          'Produzir a resposta de memória (recordação) fixa muito mais que reconhecê-la pronta — e reler é a estratégia mais fraca.',
        study: 'Griggs, cap. 5 (medidas de recuperação)',
        app: [
          'Na revisão, você tenta lembrar a resposta antes de virar o card.',
          'As questões exigem que você escolha/produza a resposta, não só reconhecer o texto.',
        ],
      },
      {
        icon: Brain,
        title: 'Significado vence forma',
        science:
          'Processar o significado gera memória muito melhor que processar som ou aparência (≈80% vs 15% de retenção).',
        study: 'Craik & Tulving (1975)',
        app: [
          'As questões da IA cobram compreensão ("por quê", "qual a diferença", "aplique a um caso"), não decoreba.',
          'A explicação de cada questão justifica a certa e por que cada errada está errada.',
        ],
      },
      {
        icon: MessageCircle,
        title: 'Elaboração e autorreferência',
        science:
          'Relacionar o conteúdo ao que você já sabe — e à sua própria vida — é a forma mais eficaz de codificar.',
        study: 'Craik & Tulving (1975); Rogers, Kuiper & Kirker (1977)',
        app: [
          'Na revisão, após ver a resposta, você escreve "explique com suas palavras ou dê um exemplo da sua vida".',
          'Sua elaboração fica salva no card e serve de pista nas próximas revisões.',
        ],
      },
      {
        icon: Lightbulb,
        title: 'Pistas graduais',
        science:
          'Às vezes a informação está lá, mas falta a pista para recuperá-la. Dicas parciais ajudam a puxar a memória.',
        study: 'Tulving (1974)',
        app: [
          'Antes de revelar a resposta, o botão "Dica gradual" mostra o começo dela em 3 níveis.',
          'Você treina a recuperação com esforço, em vez de só ver a resposta pronta.',
        ],
      },
      {
        icon: Shuffle,
        title: 'Efeito de posição serial',
        science:
          'Lembramos melhor o início (primazia) e o fim (recência) de uma lista; o meio é o mais frágil.',
        study: 'Glanzer & Cunitz (1966)',
        app: [
          'A ordem dos flashcards é embaralhada a cada revisão, para nenhum card ficar sempre no meio.',
        ],
      },
      {
        icon: Layers,
        title: 'Capacidade da memória de curto prazo',
        science:
          'A memória de trabalho segura cerca de 7 ± 2 itens por vez. Blocos grandes demais sobrecarregam.',
        study: 'Miller (1956)',
        app: [
          'O conteúdo é quebrado em blocos curtos e um foco por tela, evitando excesso de itens novos de uma vez.',
        ],
      },
      {
        icon: BookMarked,
        title: 'Memória é reconstrução',
        science:
          'Lembramos o essencial e reconstruímos o resto; informação errada pode se consolidar, e erramos a fonte do que lembramos.',
        study: 'Bartlett (1932); Loftus & Palmer (1974)',
        app: [
          'Feedback correto imediato após cada erro, para a versão errada não se fixar.',
          'Cada flashcard gerado registra a fonte (de qual material veio).',
        ],
      },
    ],
  },
  {
    title: 'Como mantemos você estudando',
    subtitle: 'Princípios de aprendizagem e motivação (Griggs, cap. 4)',
    methods: [
      {
        icon: CheckCircle2,
        title: 'Metas progressivas (modelagem)',
        science:
          'Comportamentos complexos se constroem reforçando passos cada vez mais próximos do alvo — começando pequeno.',
        study: 'Skinner; Griggs, cap. 4 (modelagem)',
        app: [
          'Meta diária ajustável e dificuldade das questões em degraus (reconhecer → recordar → aplicar).',
        ],
      },
      {
        icon: Trophy,
        title: 'Recompensar domínio, não presença',
        science:
          'Recompensas externas por apenas "aparecer" podem reduzir a motivação. O que funciona é recompensar progresso real.',
        study: 'Lepper, Greene & Nisbett (1973); Eisenberger & Cameron (1996)',
        app: [
          'Os pontos vêm de desempenho: questão certa, sessão concluída, revisão feita, streak — não de só abrir o app.',
          'O progresso de conhecimento tem destaque, acima da pontuação.',
        ],
      },
      {
        icon: Gauge,
        title: 'Nível ótimo de ativação',
        science:
          'O desempenho melhora com a pressão até um ponto; ansiedade demais piora. O ideal é uma pressão moderada.',
        study: 'Yerkes & Dodson (1908)',
        app: [
          'Cronômetro é opcional; o Modo Estudo é mais calmo e o Modo Simulado treina pressão de prova.',
          'Sem contagens agressivas ou rankings públicos por padrão.',
        ],
      },
      {
        icon: Bell,
        title: 'Gatilho do hábito',
        science:
          'Um sinal fixo (horário, local, aviso) indica quando estudar e ajuda o hábito a se formar.',
        study: 'Griggs, cap. 4 (estímulo discriminativo)',
        app: [
          'Notificações de revisão avisam quando há flashcards e tarefas do dia pendentes.',
          'O Quadro (Kanban) e o calendário mantêm as tarefas sempre à vista.',
        ],
      },
    ],
  },
];

export function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-primary-600 dark:bg-gray-800">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metodologia</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A base científica por trás de cada recurso da plataforma, com exemplos práticos.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        Cada ferramenta aqui não é "achismo": é baseada em pesquisa consolidada de psicologia da memória e
        da aprendizagem. Abaixo, o princípio, o estudo que o sustenta e como você usa na prática.
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-400">{section.subtitle}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {section.methods.map((m) => (
                <MethodCard key={m.title} method={m} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">Fonte</p>
        <p>
          Base teórica: Griggs, R. A. <em>Psicologia: Uma Abordagem Concisa</em> — cap. 4 (Aprendizagem) e
          cap. 5 (Memória). Os estudos citados (Ebbinghaus, Craik & Tulving, Miller, Skinner, Lepper,
          Yerkes & Dodson, entre outros) são os clássicos apresentados na obra. Os intervalos de revisão
          são calibrados com o uso real da plataforma.
        </p>
      </div>
    </div>
  );
}

function MethodCard({ method }: { method: Method }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg bg-primary-50 p-1.5 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <method.icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{method.title}</h3>
      </div>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{method.science}</p>
      <p className="mb-3 text-[11px] font-medium text-gray-400">📖 {method.study}</p>
      <div className="mt-auto rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
          Na plataforma
        </p>
        <ul className="space-y-1">
          {method.app.map((item, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
