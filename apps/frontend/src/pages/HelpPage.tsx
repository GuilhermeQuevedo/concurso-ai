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
          { icon: BookOpen, text: 'Vá em "Disciplinas" no menu e cadastre as matérias do seu edital, curso ou objetivo' },
          { icon: Sparkles, text: 'Vá em "Gerar Questões", escolha disciplina, banca e quantidade' },
          { icon: CheckCircle2, text: 'Clique em "Modo Estudo" ou "Modo Simulado" e comece!' },
        ],
        tip: 'Cadastre também as Bancas para a IA gerar questões no estilo certo.',
        link: { label: 'Ir para Disciplinas', path: '/subjects' },
      },
      {
        question: 'Preciso pagar algo?',
        steps: [
          { icon: CheckCircle2, text: 'A plataforma está em fase de testes e desenvolvimento contínuo' },
          { icon: Star, text: 'O uso é 100% gratuito, sem cobranças nem planos pagos' },
        ],
      },
      {
        question: 'Como funciona a geração de questões?',
        steps: [
          { icon: MousePointerClick, text: 'No menu, clique em "Gerar Questões"' },
          { icon: ListChecks, text: 'Escolha a disciplina, banca, nível de dificuldade e quantidade' },
          { icon: Sparkles, text: 'Clique em "Gerar" — a IA cria questões inéditas no estilo da banca' },
          { icon: Eye, text: '"Modo Estudo" = gabarito e resolução na hora. "Modo Simulado" = gabarito consolidado no final' },
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
        question: 'Como cadastro uma banca examinadora?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Bancas" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Nova Banca"' },
          { icon: PenLine, text: 'Digite o nome da banca (ex: Cebraspe, FCC, FGV) e salve' },
        ],
        tip: 'Bancas são as organizadoras das provas. Cadastre para a IA calibrar tom e pegadinhas no estilo fiel.',
        link: { label: 'Ir para Bancas', path: '/exam-boards' },
      },
      {
        question: 'Posso organizar disciplinas em tópicos e sub-tópicos?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Disciplinas" e encontre a disciplina-mãe' },
          { icon: MousePointerClick, text: 'Clique no botão "+" ao lado dela' },
          { icon: PenLine, text: 'Digite o nome do sub-tópico e salve' },
        ],
        tip: 'Exemplo: Direito Constitucional → Direitos Fundamentais → Remédios Constitucionais',
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
          { icon: Sparkles, text: 'Clique em "Gerar" e aguarde a IA formular as questões' },
          { icon: MousePointerClick, text: 'Escolha "Modo Estudo" (gabarito na hora) ou "Modo Simulado" (gabarito no final)' },
          { icon: CheckCircle2, text: 'Responda as questões e veja seu resultado ao terminar' },
        ],
        link: { label: 'Ir para Gerar Questões', path: '/generate' },
      },
      {
        question: 'Qual a diferença entre Modo Estudo e Modo Simulado?',
        steps: [
          { icon: Eye, text: 'Modo Estudo: ao responder cada questão, você vê na hora se acertou ou errou, com fundamentação legal e explicação detalhada' },
          { icon: ListChecks, text: 'Modo Simulado: você responde todas as questões sob pressão de tempo e só no final vê o relatório consolidado' },
        ],
        tip: 'Use o Modo Estudo para absorver conceitos novos e o Modo Simulado para treinar gestão de tempo e resistência.',
      },
      {
        question: 'Como funciona o timer?',
        steps: [
          { icon: CheckCircle2, text: 'O cronômetro inicia automaticamente ao carregar a sessão de estudo' },
          { icon: BarChart3, text: 'Ele registra o tempo total da sessão e a média em segundos por questão' },
        ],
        tip: 'No simulado, use o timer integrado para aferir seu ritmo real de prova.',
      },
    ],
  },
  {
    title: 'Flashcards & Repetição Espaçada',
    icon: Layers,
    items: [
      {
        question: 'Como crio um flashcard?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Flashcards" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Novo"' },
          { icon: PenLine, text: 'Escolha a disciplina e escreva o gatilho (frente) e a resposta (verso)' },
          { icon: CheckCircle2, text: 'Clique em "Criar Flashcard" para registrar no seu baralho' },
        ],
        link: { label: 'Ir para Flashcards', path: '/flashcards' },
      },
      {
        question: 'Como funciona a repetição espaçada (SM-2)?',
        steps: [
          { icon: CheckCircle2, text: 'Ao revisar cada card, você avalia seu domínio: Errei, Difícil, Bom ou Fácil' },
          { icon: Layers, text: 'O algoritmo calcula o intervalo ótimo para a próxima revisão com base na sua resposta' },
          { icon: Sparkles, text: 'Cards difíceis voltam rapidamente; cards dominados reaparecem em semanas ou meses' },
        ],
        tip: 'Estudar 15 minutos de flashcards todos os dias fixa muito mais a longo prazo que 4 horas em véspera de prova.',
      },
    ],
  },
  {
    title: 'Grupos e Colaboração',
    icon: Users,
    items: [
      {
        question: 'Como crio um grupo de estudos?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Grupos" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique em "Novo Grupo"' },
          { icon: PenLine, text: 'Escolha um nome e defina a meta semanal' },
          { icon: Send, text: 'Compartilhe o código de convite de 6 dígitos com seus colegas' },
        ],
        link: { label: 'Ir para Grupos', path: '/groups' },
      },
      {
        question: 'Como entro no grupo de um amigo?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Grupos" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique no botão "Entrar"' },
          { icon: PenLine, text: 'Digite o código de 6 dígitos que seu colega compartilhou' },
          { icon: Send, text: 'Clique em "Entrar no Grupo" e comece a pontuar!' },
        ],
        link: { label: 'Ir para Grupos', path: '/groups' },
      },
      {
        question: 'Como funciona a pontuação e o ranking?',
        steps: [
          { icon: CheckCircle2, text: 'Você ganha XP automaticamente ao realizar atividades na plataforma' },
          { icon: Star, text: 'Questões certas, revisões de flashcards, streaks diários e jogos somam pontos' },
          { icon: Trophy, text: 'O placar semanal destaca a constância e estimula o aprendizado coletivo' },
        ],
        tip: 'Toda segunda-feira o placar semanal renova, mas seu XP acumulado e histórico de conquistas continuam intactos.',
      },
    ],
  },
  {
    title: 'Documentos e PDFs',
    icon: FileText,
    items: [
      {
        question: 'Como importo materiais e editais?',
        steps: [
          { icon: MousePointerClick, text: 'Vá em "Documentos" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique em "Upload" ou arraste o arquivo PDF/TXT para a área indicada' },
          { icon: PenLine, text: 'Associe o documento à disciplina correspondente' },
          { icon: CheckCircle2, text: 'O conteúdo é indexado de forma segura para contextualizar a IA' },
        ],
        tip: 'Formatos aceitos: PDF, TXT e Markdown (até 10MB por arquivo).',
        link: { label: 'Ir para Documentos', path: '/documents' },
      },
      {
        question: 'Qual a vantagem de subir meus próprios documentos?',
        steps: [
          { icon: FileText, text: 'Você pode subir a lei seca comentada, a apostila do seu cursinho ou seus resumos pessoais' },
          { icon: Sparkles, text: 'A IA utiliza passagens do seu próprio material para formular assertivas e justificativas' },
        ],
        tip: 'Quanto mais alinhado aos seus resumos for o conteúdo, mais rápido você identifica seus pontos cegos.',
      },
    ],
  },
  {
    title: 'Plano de Estudos e Constância',
    icon: CalendarDays,
    items: [
      {
        question: 'Como monto meu cronograma de estudos?',
        steps: [
          { icon: MousePointerClick, text: 'Clique em "Cronograma" no menu lateral' },
          { icon: MousePointerClick, text: 'Clique em "Novo Plano"' },
          { icon: PenLine, text: 'Defina o nome do ciclo, período de execução e carga horária diária' },
          { icon: ListChecks, text: 'Distribua as disciplinas por dia da semana com a duração estimada' },
        ],
        link: { label: 'Ir para Cronograma', path: '/study-plan' },
      },
      {
        question: 'O que são as "disciplinas que precisam de atenção"?',
        steps: [
          { icon: BarChart3, text: 'O sistema calcula periodicamente sua taxa de retenção por disciplina' },
          { icon: Eye, text: 'Matérias com menor taxa de acerto ou revisões atrasadas são destacadas prioritariamente' },
        ],
      },
    ],
  },
  {
    title: 'Conquistas, Streaks e Rankings',
    icon: Trophy,
    items: [
      {
        question: 'Como desbloqueio conquistas?',
        steps: [
          { icon: CheckCircle2, text: 'Conquistas são liberadas automaticamente conforme você estuda' },
          { icon: Star, text: 'Marcos de constância (3, 7, 30 dias), primeiras questões resolvidas e vitórias em jogos' },
          { icon: Trophy, text: 'Acesse "Conquistas" no menu para visualizar seus troféus e próximos desafios' },
        ],
        link: { label: 'Ir para Conquistas', path: '/achievements' },
      },
      {
        question: 'O que é Streak e como preservá-lo?',
        steps: [
          { icon: Flame, text: 'Streak é sua sequência ininterrupta de dias estudando na plataforma' },
          { icon: CheckCircle2, text: 'Resolver pelo menos 1 questão ou revisar cards no dia garante a chama acesa' },
          { icon: HelpCircle, text: 'Caso você passe um dia sem estudar, a sequência reinicia a partir do zero' },
        ],
        tip: 'O segredo da aprovação é a constância diária: 20 minutos todo dia superam maratonas irregulares.',
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
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20">
              <HelpCircle className="h-6 w-6 text-[#2E8C82]" />
            </span>
            Central de Ajuda
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tutoriais passo a passo e respostas práticas para todas as funcionalidades da plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigate('/dashboard');
            startTour();
          }}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast touch-manipulation"
        >
          <Compass className="h-4 w-4" />
          Fazer tour guiado
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar dúvidas... Ex: como crio um grupo ou flashcard?"
          className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-24 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
        {search && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {`${totalResults} resultado${totalResults !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {`Nenhum resultado para "${search}"`}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tente buscar com palavras-chave diferentes como &quot;banca&quot;, &quot;simulado&quot; ou &quot;flashcard&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <div
              key={section.title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <section.icon className="h-4 w-4 text-[#2E8C82] dark:text-[#38b2a6]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <span className="ml-auto rounded-full bg-slate-200/60 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {section.items.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${idx}`;
                  const isOpen = openItems.has(key);
                  const contentId = `help-content-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        aria-expanded={isOpen}
                        aria-controls={contentId}
                        className="min-h-[48px] flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors duration-fast hover:bg-slate-50 dark:hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E8C82]"
                      >
                        <span className="pr-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-fast ${
                            isOpen ? 'rotate-180 text-[#2E8C82]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div id={contentId} role="region" className="px-5 pb-5 pt-1 space-y-3.5">
                          <ol className="space-y-3">
                            {item.steps.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-xs font-bold text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                                  {sIdx + 1}
                                </span>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <step.icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {step.text}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ol>

                          {item.tip && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 dark:border-amber-500/20 dark:bg-amber-950/30">
                              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                                <strong className="font-bold text-amber-950 dark:text-amber-100">Dica:</strong> {item.tip}
                              </p>
                            </div>
                          )}

                          {item.link && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => item.link && navigate(item.link.path)}
                                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast touch-manipulation"
                              >
                                {item.link.label}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
