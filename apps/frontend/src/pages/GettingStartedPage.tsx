import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  FileText,
  Sparkles,
  Layers,
  Users,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Trophy,
} from 'lucide-react';
import { contentService } from '@/features/content/services/content.service';
import { flashcardService } from '@/features/flashcards/services/flashcard.service';
import { studyService } from '@/features/study/services/study.service';
import { documentService } from '@/features/documents/services/document.service';

interface SetupStep {
  id: string;
  number: number;
  title: string;
  description: string;
  why: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  path: string;
  buttonLabel: string;
  check: (data: StepData) => boolean;
}

interface StepData {
  subjects: number;
  boards: number;
  sessions: number;
  flashcards: number;
  documents: number;
}

const steps: SetupStep[] = [
  {
    id: 'subjects',
    number: 1,
    title: 'Cadastre suas disciplinas',
    description: 'Adicione as matérias do seu edital, curso ou objetivo. Você pode criar sub-tópicos para organizar melhor.',
    why: 'A IA precisa saber quais matérias você estuda para gerar questões adequadas.',
    icon: BookOpen,
    color: 'text-[#2E8C82] dark:text-[#38b2a6]',
    bgColor: 'bg-[#2E8C82]/10 dark:bg-[#2E8C82]/20',
    path: '/subjects',
    buttonLabel: 'Cadastrar Disciplinas',
    check: (d) => d.subjects > 0,
  },
  {
    id: 'boards',
    number: 2,
    title: 'Cadastre as bancas',
    description: 'Adicione as bancas organizadoras das provas (ex: CESPE, FCC, FGV).',
    why: 'Cada banca tem um estilo diferente de questão. A IA reproduz o estilo certo.',
    icon: Building2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    path: '/exam-boards',
    buttonLabel: 'Cadastrar Bancas',
    check: (d) => d.boards > 0,
  },
  {
    id: 'generate',
    number: 3,
    title: 'Gere questões com IA',
    description: 'Escolha disciplina, banca, dificuldade e quantidade. A IA cria questões inéditas na hora.',
    why: 'Questões personalizadas no estilo da sua banca aceleram muito sua preparação.',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    path: '/generate',
    buttonLabel: 'Gerar Questões',
    check: (d) => d.sessions > 0,
  },
  {
    id: 'documents',
    number: 4,
    title: 'Importe seus materiais (opcional)',
    description: 'Suba PDFs, leis ou apostilas. A IA usa esse conteúdo para criar questões mais precisas.',
    why: 'Com seus próprios materiais, as questões ficam muito mais contextualizadas.',
    icon: FileText,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    path: '/documents',
    buttonLabel: 'Importar Documentos',
    check: (d) => d.documents > 0,
  },
  {
    id: 'flashcards',
    number: 5,
    title: 'Crie flashcards de revisão (opcional)',
    description: 'Crie cards com pergunta e resposta. O app repete mais o que você erra e menos o que já sabe.',
    why: 'Revisão espaçada é comprovadamente eficaz para memorização de longo prazo.',
    icon: Layers,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    path: '/flashcards',
    buttonLabel: 'Criar Flashcards',
    check: (d) => d.flashcards > 0,
  },
  {
    id: 'groups',
    number: 6,
    title: 'Entre em um grupo de estudo (opcional)',
    description: 'Crie ou entre em um grupo com amigos. Ganhe pontos ao estudar e dispute o ranking semanal.',
    why: 'Estudo colaborativo e metas em grupo aumentam a motivação e mantêm a constância.',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    path: '/groups',
    buttonLabel: 'Ver Grupos',
    check: () => false,
  },
  {
    id: 'plan',
    number: 7,
    title: 'Monte seu plano de estudos (opcional)',
    description: 'Defina quais disciplinas estudar em cada dia da semana e acompanhe seu progresso.',
    why: 'Um plano organizado garante que todas as matérias recebam atenção.',
    icon: CalendarDays,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    path: '/study-plan',
    buttonLabel: 'Criar Plano',
    check: () => false,
  },
];

export function GettingStartedPage() {
  const navigate = useNavigate();

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const { data: boards = [] } = useQuery({
    queryKey: ['exam-boards'],
    queryFn: contentService.getExamBoards,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: studyService.getStats,
  });

  const { data: flashcardStats } = useQuery({
    queryKey: ['flashcard-stats'],
    queryFn: flashcardService.getStats,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.list(),
  });

  const stepData: StepData = {
    subjects: subjects.length,
    boards: boards.length,
    sessions: stats?.totalSessions ?? 0,
    flashcards: flashcardStats?.total ?? 0,
    documents: Array.isArray(documents) ? documents.length : 0,
  };

  const completedCount = steps.filter((s) => s.check(stepData)).length;
  const totalRequired = 3;
  const requiredDone = steps.slice(0, totalRequired).filter((s) => s.check(stepData)).length;
  const allRequiredDone = requiredDone >= totalRequired;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Como alimentar a plataforma
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Siga os passos abaixo para configurar tudo e começar a estudar. Os 3 primeiros passos são essenciais — os demais complementam sua rotina.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Seu progresso de configuração
          </span>
          <span className="font-bold text-[#2E8C82]">
            {`${completedCount} de ${steps.length} concluídos`}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#2E8C82] transition-all duration-normal"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        {allRequiredDone && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Trophy className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold">
              Parabéns! Você completou os passos essenciais. A plataforma está pronta para turbinar seus estudos!
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const done = step.check(stepData);
          const isRequired = step.number <= totalRequired;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-fast dark:bg-slate-900 ${
                done
                  ? 'border-emerald-500/40 dark:border-emerald-500/30'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-fast ${
                      done ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : `${step.bgColor} ${step.color}`
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  {step.number < steps.length && (
                    <div
                      className={`mt-3 h-full w-0.5 rounded-full ${
                        done ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold tracking-wider ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {`PASSO ${step.number}`}
                    </span>
                    {isRequired && !done && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                        ESSENCIAL
                      </span>
                    )}
                    {!isRequired && !done && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        OPCIONAL
                      </span>
                    )}
                    {done && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                        FEITO
                      </span>
                    )}
                  </div>

                  <h2 className={`text-base font-bold ${
                    done ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                  }`}>
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">Por que?</strong>{' '}
                      {step.why}
                    </p>
                  </div>

                  <div className="mt-4">
                    {!done ? (
                      <button
                        type="button"
                        onClick={() => navigate(step.path)}
                        className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-xs transition-all duration-fast active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 touch-manipulation ${
                          isRequired
                            ? 'bg-[#2E8C82] text-white hover:bg-[#26776f] focus-visible:ring-[#2E8C82]'
                            : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 focus-visible:ring-slate-500'
                        }`}
                      >
                        {step.buttonLabel}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Concluído</span>
                        {step.id === 'subjects' && <span className="font-normal text-slate-500 dark:text-slate-400">{`(${stepData.subjects} disciplina${stepData.subjects !== 1 ? 's' : ''})`}</span>}
                        {step.id === 'boards' && <span className="font-normal text-slate-500 dark:text-slate-400">{`(${stepData.boards} banca${stepData.boards !== 1 ? 's' : ''})`}</span>}
                        {step.id === 'generate' && <span className="font-normal text-slate-500 dark:text-slate-400">{`(${stepData.sessions} sessão${stepData.sessions !== 1 ? 'ões' : ''})`}</span>}
                        {step.id === 'documents' && <span className="font-normal text-slate-500 dark:text-slate-400">{`(${stepData.documents} documento${stepData.documents !== 1 ? 's' : ''})`}</span>}
                        {step.id === 'flashcards' && <span className="font-normal text-slate-500 dark:text-slate-400">{`(${stepData.flashcards} card${stepData.flashcards !== 1 ? 's' : ''})`}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dúvidas? Acesse a{' '}
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="font-bold text-[#2E8C82] underline hover:text-[#26776f] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E8C82]"
          >
            Central de Ajuda
          </button>{' '}
          para tutoriais detalhados de cada funcionalidade.
        </p>
      </div>
    </div>
  );
}
