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
  Timer,
  GraduationCap,
  Zap,
  FileCheck,
  type LucideIcon,
} from 'lucide-react';

interface Method {
  icon: LucideIcon;
  title: string;
  science: string;
  app: string[];
}

interface Section {
  title: string;
  subtitle: string;
  methods: Method[];
}

const SECTIONS: Section[] = [
  {
    title: 'Como você fixa o conteúdo na memória',
    subtitle: 'Princípios de memória',
    methods: [
      {
        icon: Repeat,
        title: 'Repetição espaçada',
        science:
          'Estudar distribuído no tempo retém muito mais que estudar tudo de uma vez na véspera.',
        app: [
          'Os flashcards usam o algoritmo SM-2: cada card volta em intervalos crescentes (1 → 6 → 15 → 30+ dias).',
          'Acertou com facilidade? O card demora mais pra voltar. Errou? Volta amanhã.',
        ],
      },
      {
        icon: Clock,
        title: 'Curva do esquecimento',
        science:
          'A maior parte do esquecimento acontece nos primeiros dias; depois estabiliza. A 1ª revisão precisa ser cedo.',
        app: [
          'A primeira revisão é agendada logo (mesmo dia/dia seguinte), antes da queda mais forte.',
          'O "Simulador de Memória" mostra visualmente a curva e o efeito das revisões.',
        ],
      },
      {
        icon: Target,
        title: 'Recordação ativa (não releitura)',
        science:
          'Produzir a resposta de memória fixa muito mais que reconhecê-la pronta — e reler é a estratégia mais fraca.',
        app: [
          'Na revisão, você tenta lembrar a resposta antes de virar o card.',
          'As questões exigem que você produza/escolha a resposta, não só reconhecer o texto.',
        ],
      },
      {
        icon: Brain,
        title: 'Significado vence forma',
        science:
          'Processar o significado gera memória muito melhor que decorar som ou aparência das palavras.',
        app: [
          'As questões cobram compreensão ("por quê", "qual a diferença", "aplique a um caso"), não decoreba.',
          'Cada questão vem com explicação da certa e de por que cada errada está errada.',
        ],
      },
      {
        icon: MessageCircle,
        title: 'Elaboração e autorreferência',
        science:
          'Relacionar o conteúdo ao que você já sabe — e à sua própria vida — é a forma mais eficaz de memorizar.',
        app: [
          'Após ver a resposta, você escreve "explique com suas palavras ou dê um exemplo da sua vida".',
          'Sua elaboração fica salva no card e serve de pista nas próximas revisões.',
        ],
      },
      {
        icon: Lightbulb,
        title: 'Pistas graduais',
        science:
          'Às vezes a informação está lá, mas falta a pista para recuperá-la. Dicas parciais puxam a memória com esforço.',
        app: [
          'Antes de revelar a resposta, o botão "Dica gradual" mostra o começo dela em 3 níveis.',
        ],
      },
      {
        icon: Shuffle,
        title: 'Efeito de posição serial',
        science:
          'Lembramos melhor o início e o fim de uma lista; o meio é o mais frágil.',
        app: [
          'A ordem dos flashcards é embaralhada a cada revisão, para nenhum card ficar sempre no meio.',
        ],
      },
      {
        icon: Layers,
        title: 'Blocos curtos (memória de trabalho)',
        science:
          'A memória de trabalho segura poucos itens por vez (cerca de 7). Blocos grandes demais sobrecarregam.',
        app: [
          'O conteúdo é quebrado em blocos curtos e um foco por tela, evitando excesso de itens novos de uma vez.',
        ],
      },
      {
        icon: BookMarked,
        title: 'Memória é reconstrução',
        science:
          'Lembramos o essencial e reconstruímos o resto; a versão errada pode se consolidar, e erramos a fonte do que lembramos.',
        app: [
          'Feedback correto imediato após cada erro, para a versão errada não se fixar.',
          'Cada flashcard gerado registra de qual material veio.',
        ],
      },
    ],
  },
  {
    title: 'Técnicas de foco e estudo',
    subtitle: 'Métodos de produtividade e aprendizagem ativa',
    methods: [
      {
        icon: Timer,
        title: 'Pomodoro',
        science:
          'Trabalhar em blocos focados de tempo com pausas curtas sustenta a concentração e evita a fadiga, que derruba o rendimento.',
        app: [
          'Timer de Pomodoro no painel: ciclos de foco seguidos de pausa curta.',
          'Mantém sessões consistentes sem esgotar a atenção ao longo do dia.',
        ],
      },
      {
        icon: GraduationCap,
        title: 'Técnica Feynman',
        science:
          'Explicar um conceito com palavras simples, como se ensinasse a alguém, revela o que você realmente entendeu e o que ainda está confuso.',
        app: [
          'O prompt de elaboração pede que você explique a resposta com suas próprias palavras.',
          'Se não consegue explicar de forma simples, é sinal claro de que aquele ponto precisa de mais revisão.',
        ],
      },
      {
        icon: Zap,
        title: 'Check-in de energia',
        science:
          'O rendimento varia com seu nível de energia ao longo do dia. Saber como você está ajuda a dosar o esforço.',
        app: [
          'Um check-in rápido registra sua energia do dia.',
          'Use conteúdo novo (mais exigente) nos picos e revisão leve quando estiver mais cansado.',
        ],
      },
      {
        icon: FileCheck,
        title: 'Modo prova (simulado)',
        science:
          'Estudar em condições parecidas com a prova (tempo, formato, sem consulta) faz a memória recuperar melhor na hora que importa.',
        app: [
          'O Modo Simulado replica a prova: você responde tudo e só vê o gabarito no final, com cronômetro.',
          'Treina gestão de tempo e recuperação sob pressão real.',
        ],
      },
    ],
  },
  {
    title: 'Como mantemos você estudando',
    subtitle: 'Hábito e motivação',
    methods: [
      {
        icon: CheckCircle2,
        title: 'Metas progressivas',
        science:
          'Hábitos se constroem reforçando passos cada vez mais próximos do alvo — começando pequeno e crescendo.',
        app: [
          'Meta diária ajustável e dificuldade das questões em degraus (reconhecer → recordar → aplicar).',
        ],
      },
      {
        icon: Trophy,
        title: 'Recompensar domínio, não presença',
        science:
          'Recompensar apenas "aparecer" pode reduzir a motivação. O que funciona é recompensar progresso real.',
        app: [
          'Os pontos vêm de desempenho: questão certa, sessão concluída, revisão feita, streak — não de só abrir o app.',
          'O progresso de conhecimento tem destaque, acima da pontuação.',
        ],
      },
      {
        icon: Gauge,
        title: 'Pressão na medida certa',
        science:
          'O desempenho melhora com a pressão até um ponto; ansiedade demais piora. O ideal é uma pressão moderada.',
        app: [
          'Cronômetro opcional; Modo Estudo mais calmo e Modo Simulado para treinar pressão de prova.',
          'Sem contagens agressivas ou rankings públicos por padrão.',
        ],
      },
      {
        icon: Bell,
        title: 'Gatilho do hábito',
        science:
          'Um sinal fixo (horário, aviso) indica quando estudar e ajuda o hábito a se formar.',
        app: [
          'Notificações avisam quando há flashcards e tarefas do dia pendentes.',
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
            Os métodos de estudo por trás de cada recurso da plataforma, com exemplos práticos.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
        Cada ferramenta aqui é baseada em métodos consagrados de memória, foco e aprendizagem. Abaixo, o
        que cada técnica propõe e como você a usa na prática dentro da plataforma.
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
    </div>
  );
}

function MethodCard({ method }: { method: Method }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg bg-primary-50 p-1.5 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
          <method.icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{method.title}</h3>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{method.science}</p>
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
