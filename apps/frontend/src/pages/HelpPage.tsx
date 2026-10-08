import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  ChevronDown,
  Compass,
  BookOpen,
  Sparkles,
  Users,
  Layers,
  Trophy,
  FileText,
  CalendarDays,
  HelpCircle,
  ArrowRight,
  MousePointerClick,
  PenLine,
  CheckCircle2,
  Eye,
  Share2,
  Send,
  ListChecks,
  BarChart3,
  Flame,
  Star,
} from 'lucide-react';
import { useTour } from '@/features/tour/useTour';

interface Step {
  icon: typeof BookOpen;
  text: string;
}

interface GuideItem {
  question: string;
  steps: Step[];
  tip?: string;
  link?: { label: string; path: string };
}

interface GuideSection {
  title: string;
  icon: typeof BookOpen;
  items: GuideItem[];
}

const sections: GuideSection[] = [
  {
    title: 'Primeiros passos',
    icon: HelpCircle,
    items: [
      {
        question: 'Como começo a usar a plataforma?',
        steps: [
          { icon: PenLine, text: 'Crie sua conta com nome, e-mail e telefone na tela de cadastro' },
          { icon: BookOpen, text: 'Vá em "Disciplinas" no menu e cadastre as matérias do seu concurso' },
          { icon: Sparkles, text: 'Vá em "Gerar Questões", escolha disciplina, banca e quantidade' },
          { icon: CheckCircle2, text: 'Clique em "Modo Estudo" ou "Modo Simulado" e comece!' },
        ],
        tip: 'Cadastre também as Bancas para a IA gerar questões no estilo certo.',
        link: { label: 'Ir para Disciplinas', path: '/subjects' },
      },
      {
        question: 'Preciso pagar algo?',
        steps: [
          { icon: CheckCircle2, text: 'A plataforma está em fase de testes' },
          { icon: Star, text: 'O uso é 100% gratuito, sem cobranças nem planos pagos' },
        ],
      },
      {
        question: 'Como funciona a geração de questões?',
        steps: [
          { icon: MousePointerClick, text: 'No menu, clique em "Gerar Questões"' },
          { icon: ListChecks, text: 'Escolha a disciplina, banca, nível de dificuldade e quantidade' },
          { icon: Sparkles, text: 'Clique em "Gerar" — a IA cria questões inéditas no estilo da banca' },
          { icon: Eye, text: '"Modo Estudo" = gabarito na hora. "Modo Simulado" = gabarito só no final' },
        ],
        link: { label: 'Ir para Gerar Questões', path: '/generate' },
      },
    ],
  },
  {
    title: 'Disciplinas e Bancas',
    icon: BookOpen,
    items: [
      {
        question: 'Como cadastro uma disciplina?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Disciplinas" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Nova Disciplina"' },
          { icon: PenLine, text: 'Digite o nome (ex: Direito Constitucional) e salve' },
        ],
        tip: 'Você pode criar sub-disciplinas clicando no "+" ao lado de uma disciplina existente.',
        link: { label: 'Ir para Disciplinas', path: '/subjects' },
      },
      {
        question: 'Como cadastro uma banca?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Bancas" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Nova Banca"' },
          { icon: PenLine, text: 'Digite o nome da banca (ex: CESPE, FCC, FGV) e salve' },
        ],
        tip: 'Bancas são as organizadoras dos concursos. Cadastre para a IA gerar questões no estilo certo.',
        link: { label: 'Ir para Bancas', path: '/exam-boards' },
      },
      {
        question: 'Posso organizar disciplinas em sub-tópicos?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Disciplinas" e encontre a disciplina-mãe' },
          { icon: MousePointerClick, text: 'Clique no botão "+" ao lado dela' },
          { icon: PenLine, text: 'Digite o nome do sub-tópico e salve' },
        ],
        tip: 'Exemplo: Direito Constitucional → Direitos Fundamentais → Direitos Individuais',
        link: { label: 'Ir para Disciplinas', path: '/subjects' },
      },
    ],
  },
  {
    title: 'Estudo e Simulados',
    icon: Sparkles,
    items: [
      {
        question: 'Como inicio uma sessão de estudo?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Gerar Questões" e configure suas preferências' },
          { icon: Sparkles, text: 'Clique em "Gerar" e aguarde a IA criar as questões' },
          { icon: MousePointerClick, text: 'Escolha "Modo Estudo" (gabarito na hora) ou "Modo Simulado" (gabarito no final)' },
          { icon: CheckCircle2, text: 'Responda as questões e veja seu resultado ao terminar' },
        ],
        link: { label: 'Ir para Gerar Questões', path: '/generate' },
      },
      {
        question: 'Qual a diferença entre Modo Estudo e Modo Simulado?',
        steps: [
          { icon: Eye, text: 'Modo Estudo: ao responder cada questão, você vê na hora se acertou ou errou, com a explicação' },
          { icon: ListChecks, text: 'Modo Simulado: você responde todas as questões e só no final vê o resultado, como numa prova real' },
        ],
        tip: 'Use o Modo Estudo para aprender e o Simulado para treinar tempo de prova.',
      },
      {
        question: 'Como funciona o timer?',
        steps: [
          { icon: CheckCircle2, text: 'O timer começa automaticamente ao iniciar a sessão' },
          { icon: BarChart3, text: 'Ele conta o tempo total e o tempo gasto por questão' },
        ],
        tip: 'No simulado, use o timer para treinar gestão de tempo como na prova real.',
      },
    ],
  },
  {
    title: 'Flashcards',
    icon: Layers,
    items: [
      {
        question: 'Como crio um flashcard?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Flashcards" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Novo"' },
          { icon: PenLine, text: 'Escolha a disciplina e escreva a pergunta (frente) e a resposta (verso)' },
          { icon: CheckCircle2, text: 'Clique em "Criar Flashcard" para salvar' },
        ],
        link: { label: 'Ir para Flashcards', path: '/flashcards' },
      },
      {
        question: 'Como faço a revisão dos flashcards?',
        steps: [
          { icon: MousePointerClick, text: 'Na tela de Flashcards, clique no botão verde "Revisar"' },
          { icon: Eye, text: 'Leia a pergunta e tente lembrar a resposta mentalmente' },
          { icon: MousePointerClick, text: 'Clique no card para virar e ver a resposta' },
          { icon: CheckCircle2, text: 'Avalie sua resposta: "Esqueci", "Difícil", "Bom" ou "Fácil"' },
        ],
        tip: 'O app repete mais o que você erra e menos o que já sabe. Revise todos os dias para melhor resultado!',
        link: { label: 'Ir para Flashcards', path: '/flashcards' },
      },
      {
        question: 'O que significam os botões Esqueci/Difícil/Bom/Fácil?',
        steps: [
          { icon: CheckCircle2, text: '"Esqueci" → o card volta amanhã para você revisar de novo' },
          { icon: CheckCircle2, text: '"Difícil" → volta em poucos dias' },
          { icon: CheckCircle2, text: '"Bom" → volta em mais dias' },
          { icon: CheckCircle2, text: '"Fácil" → volta só daqui a bastante tempo' },
        ],
        tip: 'Quanto melhor você souber, menos o card aparece. Quanto pior, mais ele volta.',
      },
    ],
  },
  {
    title: 'Competição (Grupos)',
    icon: Users,
    items: [
      {
        question: 'Como crio um grupo de competição?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Competição" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Criar Grupo"' },
          { icon: PenLine, text: 'Dê um nome para o grupo (ex: "Turma do Concurso") e uma descrição opcional' },
          { icon: CheckCircle2, text: 'Clique em "Criar" — um código de 6 letras será gerado automaticamente' },
          { icon: Share2, text: 'Compartilhe esse código com seus amigos para eles entrarem!' },
        ],
        link: { label: 'Ir para Competição', path: '/groups' },
      },
      {
        question: 'Como entro no grupo de um amigo?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Competição" no menu' },
          { icon: MousePointerClick, text: 'Clique no botão "Entrar"' },
          { icon: PenLine, text: 'Digite o código de 6 letras que seu amigo compartilhou' },
          { icon: Send, text: 'Clique em "Entrar no Grupo" e pronto!' },
        ],
        link: { label: 'Ir para Competição', path: '/groups' },
      },
      {
        question: 'Como funciona a pontuação e o ranking?',
        steps: [
          { icon: CheckCircle2, text: 'Você ganha pontos automaticamente ao estudar na plataforma' },
          { icon: Star, text: 'Sessão completa = 10 pts | Acertou tudo = 20 pts | Questão certa = 2 pts' },
          { icon: Layers, text: 'Revisar flashcard = 3 pts | Streak do dia = 5 pts' },
          { icon: Trophy, text: 'O ranking mostra quem estudou mais na semana' },
        ],
        tip: 'Toda semana o placar semanal zera, mas o total acumulado permanece. Quem estuda mais sobe!',
      },
      {
        question: 'Posso participar de vários grupos?',
        steps: [
          { icon: CheckCircle2, text: 'Sim! Crie ou entre em quantos grupos quiser' },
          { icon: Star, text: 'Seus pontos são registrados automaticamente em todos os seus grupos' },
        ],
      },
    ],
  },
  {
    title: 'Documentos',
    icon: FileText,
    items: [
      {
        question: 'Como importo um documento?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Documentos" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique em "Upload" ou arraste o arquivo para a área indicada' },
          { icon: PenLine, text: 'Escolha a disciplina que o documento pertence' },
          { icon: CheckCircle2, text: 'O conteúdo será processado e a IA usará ele para gerar questões melhores' },
        ],
        tip: 'Formatos aceitos: PDF, TXT, Markdown e HTML. Máximo 10MB por arquivo.',
        link: { label: 'Ir para Documentos', path: '/documents' },
      },
      {
        question: 'Para que serve importar documentos?',
        steps: [
          { icon: FileText, text: 'Importe PDFs, leis, apostilas ou resumos' },
          { icon: BookOpen, text: 'Associe o documento a uma disciplina' },
          { icon: Sparkles, text: 'Ao gerar questões, a IA usa esse conteúdo como base para criar questões mais precisas' },
        ],
        tip: 'Quanto mais material você importar, mais contextualizadas ficam as questões da IA.',
      },
    ],
  },
  {
    title: 'Plano de Estudos',
    icon: CalendarDays,
    items: [
      {
        question: 'Como crio um plano de estudos?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Plano de Estudos" no menu' },
          { icon: MousePointerClick, text: 'Clique em "Novo Plano"' },
          { icon: PenLine, text: 'Dê um nome, defina a data de início e fim' },
          { icon: ListChecks, text: 'Adicione itens: escolha a disciplina, o dia da semana e a duração em minutos' },
          { icon: CheckCircle2, text: 'Ao estudar, marque os itens como concluídos para acompanhar seu progresso' },
        ],
        link: { label: 'Ir para Plano de Estudos', path: '/study-plan' },
      },
      {
        question: 'O que são as "disciplinas que precisam de atenção"?',
        steps: [
          { icon: BarChart3, text: 'O sistema analisa automaticamente seu desempenho em cada disciplina' },
          { icon: Eye, text: 'As disciplinas onde você tem menor taxa de acerto aparecem como sugestão' },
          { icon: CalendarDays, text: 'Use essa informação para dar mais tempo no plano para essas matérias' },
        ],
      },
    ],
  },
  {
    title: 'Conquistas e Estatísticas',
    icon: Trophy,
    items: [
      {
        question: 'Como ganho conquistas?',
        steps: [
          { icon: CheckCircle2, text: 'As conquistas são desbloqueadas automaticamente ao usar a plataforma' },
          { icon: Star, text: 'Exemplos: responder a 1ª questão, acertar 10/50/100, manter streak de 3/7/30 dias' },
          { icon: Trophy, text: 'Vá em "Conquistas" no menu para ver todas e acompanhar seu progresso' },
        ],
        link: { label: 'Ir para Conquistas', path: '/achievements' },
      },
      {
        question: 'O que é streak?',
        steps: [
          { icon: Flame, text: 'Streak = sequência de dias consecutivos que você estudou' },
          { icon: CheckCircle2, text: 'Cada dia que você estuda, o streak aumenta em 1' },
          { icon: HelpCircle, text: 'Se pular um dia, o streak zera e você recomeça do zero' },
        ],
        tip: 'O app mostra seu streak atual e o maior já alcançado. Tente bater seu recorde!',
      },
      {
        question: 'Onde vejo meu desempenho geral?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Estatísticas" no menu lateral' },
          { icon: BarChart3, text: 'Veja: total de questões, taxa de acerto, tempo estudado e sessões completadas' },
          { icon: ListChecks, text: 'Role para baixo para ver detalhamento por disciplina e histórico de sessões' },
        ],
        link: { label: 'Ir para Estatísticas', path: '/stats' },
      },
    ],
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const { start: startTour } = useTour();
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const normalizeText = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const query = normalizeText(search);

  const stepsMatchQuery = (steps: Step[]) =>
    steps.some((s) => normalizeText(s.text).includes(query));

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !query ||
          normalizeText(item.question).includes(query) ||
          stepsMatchQuery(item.steps) ||
          (item.tip && normalizeText(item.tip).includes(query)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const toggleItem = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setOpenItems(next);
  };

  const totalResults = filteredSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Ajuda</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tutoriais passo a passo de todas as funcionalidades
          </p>
        </div>
        <button
          onClick={() => {
            navigate('/dashboard');
            startTour();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Compass className="h-4 w-4" />
          Fazer tour guiado
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar... Ex: como crio um grupo?"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500">Nenhum resultado para &quot;{search}&quot;</p>
          <p className="mt-1 text-xs text-gray-400">Tente palavras diferentes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                <section.icon className="h-4 w-4 text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <span className="ml-auto text-xs text-gray-400">{section.items.length}</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleItem(key)}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="pr-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <ol className="space-y-2.5">
                            {item.steps.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                                  <step.icon className="h-3.5 w-3.5 text-primary-700 dark:text-primary-300" />
                                </span>
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs font-bold text-primary-600">{sIdx + 1}.</span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{step.text}</span>
                                </div>
                              </li>
                            ))}
                          </ol>

                          {item.tip && (
                            <div className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
                              <p className="text-xs text-amber-800 dark:text-amber-300">
                                <strong>Dica:</strong> {item.tip}
                              </p>
                            </div>
                          )}

                          {item.link && (
                            <button
                              onClick={() => item.link && navigate(item.link.path)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                            >
                              {item.link.label}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
