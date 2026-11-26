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
  study?: string;
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
    subtitle: 'Princípios de neurociência da memória',
    methods: [
      {
        icon: Repeat,
        title: 'Repetição espaçada',
        science:
          'Estudar distribuído no tempo retém substancialmente mais que estudar tudo de uma vez na véspera da prova.',
        study: 'Payne & Wenger (1996)',
        app: [
          'Os flashcards usam o algoritmo SM-2: cada card volta em intervalos crescentes (1 → 6 → 15 → 30+ dias).',
          'Acertou com facilidade? O card demora mais para voltar. Errou? Volta no dia seguinte para fixação.',
        ],
      },
      {
        icon: Clock,
        title: 'Curva do esquecimento',
        science:
          'A maior parte do esquecimento ocorre nas primeiras 24 a 48 horas; depois estabiliza. A primeira revisão precisa ocorrer cedo.',
        study: 'Hermann Ebbinghaus (1885)',
        app: [
          'A primeira revisão é agendada rapidamente antes da queda acentuada de retenção.',
          'O painel da plataforma exibe visualmente a curva de retenção e a estabilização pós-revisão.',
        ],
      },
      {
        icon: Target,
        title: 'Recordação ativa (Active Recall)',
        science:
          'Produzir a resposta a partir do esforço mental fixa o traço sináptico muito mais do que reler ou reconhecer o texto pronto.',
        study: 'Roediger & Karpicke (2006)',
        app: [
          'Na revisão de flashcards, você tenta recordar a resposta antes de virar o card.',
          'As questões exigem produção e escolha de alternativas sem cola prévia.',
        ],
      },
      {
        icon: Brain,
        title: 'Significado profundo vence decoreba',
        science:
          'Processar o significado e a semântica gera traços de memória duradouros, superiores a qualquer memorização superficial.',
        study: 'Craik & Tulving (1975)',
        app: [
          'As questões cobram compreensão crítica (causas, distinções conceituais e casos práticos).',
          'Cada questão possui fundamentação da correta e do erro de cada alternativa incorreta.',
        ],
      },
      {
        icon: MessageCircle,
        title: 'Elaboração e autorreferência',
        science:
          'Relacionar o conceito ao seu conhecimento prévio e a situações reais é o método cognitivo mais potente de retenção.',
        study: 'Craik & Tulving (1975); Rogers et al. (1977)',
        app: [
          'Após o gabarito, você é incentivado a registrar uma síntese pessoal ou exemplo prático.',
          'Sua anotação pessoal fica atrelada ao card e serve de âncora nas próximas revisões.',
        ],
      },
      {
        icon: Lightbulb,
        title: 'Pistas graduais de recuperação',
        science:
          'Muitas vezes a memória está consolidada, mas falta a pista para acessá-la. Dicas em camadas estimulam o esforço de busca.',
        study: 'Endel Tulving (1974)',
        app: [
          'No modo Na Ponta da Língua, você pode solicitar dicas parciais em até 3 níveis graduais.',
        ],
      },
      {
        icon: Shuffle,
        title: 'Efeito de posição serial',
        science:
          'Lembramos com mais facilidade o início e o fim de sequências; os itens centrais sofrem maior interferência.',
        study: 'Glanzer & Cunitz (1966)',
        app: [
          'A ordem dos flashcards é aleatorizada a cada sessão para evitar que certos tópicos fiquem sempre no meio.',
        ],
      },
      {
        icon: Layers,
        title: 'Blocos curtos (Memória de Trabalho)',
        science:
          'A memória de trabalho suporta poucos blocos simultâneos. Sobrecargas cognitivas inviabilizam a retenção sustentável.',
        study: 'George Miller (1956)',
        app: [
          'O conteúdo é fragmentado em blocos atômicos e um objetivo claro por tela.',
        ],
      },
      {
        icon: BookMarked,
        title: 'Memória como reconstrução ativa',
        science:
          'Retemos a ideia central e reconstruímos os detalhes; distorções cognitivas ocorrem sem feedback corretivo imediato.',
        study: 'Bartlett (1932); Loftus & Palmer (1974)',
        app: [
          'Correção e justificativa imediatas após cada erro evitam a consolidação de conceitos equivocados.',
          'Cada assertiva referencia com exatidão a lei seca, súmula ou material de origem.',
        ],
      },
    ],
  },
  {
    title: 'Técnicas de foco e estudo ativo',
    subtitle: 'Métodos de produtividade e atenção sustentada',
    methods: [
      {
        icon: Timer,
        title: 'Técnica Pomodoro',
        science:
          'Trabalhar em intervalos cronometrados com pausas regulares preserva o estado de fluxo e previne o esgotamento atencional.',
        study: 'Francesco Cirillo (1980s)',
        app: [
          'Timer integrado com ciclos de foco e pausas no painel e no cabeçalho.',
          'Mantém a cadência sem sobrecarregar a energia cognitiva ao longo do dia.',
        ],
      },
      {
        icon: GraduationCap,
        title: 'Técnica Feynman',
        science:
          'Explicar um conceito complexo em termos simples revela imediatamente lacunas de raciocínio e pontos de confusão.',
        study: 'Richard Feynman',
        app: [
          'O campo de elaboração estimula você a redigir o conceito com suas próprias palavras.',
          'Incapacidade de simplificar sinaliza que o tema requer nova revisão.',
        ],
      },
      {
        icon: Zap,
        title: 'Check-in de energia cognitiva',
        science:
          'O rendimento cognitivo varia de acordo com o nível de ativação e ciclo circadiano ao longo do dia.',
        study: 'Lei de Yerkes-Dodson (1908)',
        app: [
          'O check-in diário calibra o nível de energia do estudante.',
          'Conteúdos novos e exigentes nos picos de disposição; revisões leves em momentos de fadiga.',
        ],
      },
      {
        icon: FileCheck,
        title: 'Modo Simulado e Contexto Fiel',
        science:
          'Estudar sob condições similares às do dia da prova (tempo, formato, sem consultas) facilita a recuperação sob estresse real.',
        study: 'Godden & Baddeley (1975)',
        app: [
          'O Modo Simulado replica a pressão da banca: resolução sequencial com gabarito apenas ao final.',
          'Aprimora ritmo de prova, resistência mental e administração do tempo.',
        ],
      },
    ],
  },
  {
    title: 'Como sustentamos sua constância diária',
    subtitle: 'Ciência do hábito e motivação intrínseca',
    methods: [
      {
        icon: CheckCircle2,
        title: 'Metas progressivas e micro-vitórias',
        science:
          'Hábitos sólidos são construídos pelo reforço de aproximações sucessivas, iniciando em metas viáveis.',
        study: 'Modelagem Comportamental (B. F. Skinner)',
        app: [
          'Meta diária customizável e progressão em degraus cognitivos (reconhecer → recordar → aplicar).',
        ],
      },
      {
        icon: Trophy,
        title: 'Recompensar domínio real, não mera presença',
        science:
          'Recompensar apenas tempo passivo diminui a motivação intrínseca. O reforço deve premiar o progresso real de domínio.',
        study: 'Lepper, Greene & Nisbett (1973)',
        app: [
          'XP concedido por desempenho genuíno: questões resolvidas, acertos, revisões concluídas e streak.',
          'O domínio temático tem primazia visual sobre qualquer pontuação superficial.',
        ],
      },
      {
        icon: Gauge,
        title: 'Pressão ideal e foco sustentado',
        science:
          'A performance cresce com um nível moderado de desafio, mas decai drasticamente com ansiedade excessiva.',
        study: 'Yerkes & Dodson (1908)',
        app: [
          'Cronômetro flexível: modo estudo focado e calmo vs. simulado para simular o rigor de prova.',
          'Sem rankings tóxicos ou penalidades punitivas por ausência.',
        ],
      },
      {
        icon: Bell,
        title: 'Gatilhos de hábito',
        science:
          'Sinais contextuais regulares no ambiente funcionam como estímulos que ativam a execução automática da rotina de estudo.',
        study: 'Estímulo Discriminativo (Skinner)',
        app: [
          'Lembretes sutis informando o volume de cards do dia e metas em aberto.',
          'Quadro de constância e mapa de revisão mantêm os tópicos sempre no campo visual.',
        ],
      },
    ],
  },
];

export function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20">
          <FlaskConical className="h-6 w-6 text-[#2E8C82]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Metodologia</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            A neurociência e os princípios de aprendizagem ativa por trás de cada funcionalidade da plataforma.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2E8C82]/30 bg-[#2E8C82]/10 p-5 text-sm text-slate-800 dark:text-slate-100 shadow-xs">
        <p className="leading-relaxed">
          Cada recurso da plataforma foi concebido com base em evidências científicas comprovadas de retenção mnemônica, atenção concentrada e formação de hábitos. Veja abaixo os fundamentos teóricos de cada método e como eles são aplicados na prática na sua rotina de estudos.
        </p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{section.title}</h2>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{section.subtitle}</p>
            </div>
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
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-fast hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
          <method.icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{method.title}</h3>
      </div>
      <p className="mb-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{method.science}</p>
      {method.study && (
        <p className="mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
          {`📖 ${method.study}`}
        </p>
      )}
      <div className="mt-auto rounded-xl bg-slate-50 p-3.5 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/60">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Na plataforma
        </p>
        <ul className="space-y-2">
          {method.app.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
