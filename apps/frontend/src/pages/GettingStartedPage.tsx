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
    description: 'Adicione as matérias do seu concurso. Você pode criar sub-tópicos para organizar melhor.',
    why: 'A IA precisa saber quais matérias você estuda para gerar questões adequadas.',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    path: '/subjects',
    buttonLabel: 'Cadastrar Disciplinas',
    check: (d) => d.subjects > 0,
  },
  {
    id: 'boards',
    number: 2,
    title: 'Cadastre as bancas',
    description: 'Adicione as bancas organizadoras do seu concurso (ex: CESPE, FCC, FGV).',
    why: 'Cada banca tem um estilo diferente de questão. A IA reproduz o estilo certo.',
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
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
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
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
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
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
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900',
    path: '/flashcards',
    buttonLabel: 'Criar Flashcards',
    check: (d) => d.flashcards > 0,
  },
  {
    id: 'groups',
    number: 6,
    title: 'Entre em um grupo de competição (opcional)',
    description: 'Crie ou entre em um grupo com amigos. Ganhe pontos ao estudar e dispute o ranking semanal.',
    why: 'Competir com amigos aumenta a motivação e mantém a constância nos estudos.',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
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
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900',
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Como alimentar a plataforma
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Siga os passos abaixo para configurar tudo e começar a estudar.
          Os 3 primeiros são essenciais — os demais são opcionais.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Seu progresso
          </span>
          <span className="text-sm font-bold text-primary-600">
            {completedCount} de {steps.length} concluídos
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        {allRequiredDone && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/30">
            <Trophy className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Parabéns! Você completou os passos essenciais. A plataforma está pronta para uso!
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
              className={`rounded-xl border bg-white transition-all dark:bg-gray-900 ${
                done
                  ? 'border-green-200 dark:border-green-900'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex gap-4 p-5">
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    done ? 'bg-green-100 dark:bg-green-900' : step.bgColor
                  }`}>
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    )}
                  </div>
                  {step.number < steps.length && (
                    <div className={`mt-2 h-full w-0.5 ${
                      done ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`text-xs font-bold ${done ? 'text-green-600' : 'text-gray-400'}`}>
                      PASSO {step.number}
                    </span>
                    {isRequired && !done && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900 dark:text-red-400">
                        ESSENCIAL
                      </span>
                    )}
                    {!isRequired && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                        OPCIONAL
                      </span>
                    )}
                    {done && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900 dark:text-green-400">
                        FEITO
                      </span>
                    )}
                  </div>

                  <h3 className={`mb-1 text-base font-semibold ${
                    done ? 'text-green-700 line-through dark:text-green-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                  <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong className="text-gray-700 dark:text-gray-300">Por que?</strong>{' '}
                      {step.why}
                    </p>
                  </div>

                  {!done && (
                    <button
                      onClick={() => navigate(step.path)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                        isRequired
                          ? 'bg-primary-600 hover:bg-primary-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {step.buttonLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {done && (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Concluído
                      {step.id === 'subjects' && <span className="text-gray-400">({stepData.subjects} disciplina{stepData.subjects !== 1 ? 's' : ''})</span>}
                      {step.id === 'boards' && <span className="text-gray-400">({stepData.boards} banca{stepData.boards !== 1 ? 's' : ''})</span>}
                      {step.id === 'generate' && <span className="text-gray-400">({stepData.sessions} sessão{stepData.sessions !== 1 ? 'ões' : ''})</span>}
                      {step.id === 'documents' && <span className="text-gray-400">({stepData.documents} documento{stepData.documents !== 1 ? 's' : ''})</span>}
                      {step.id === 'flashcards' && <span className="text-gray-400">({stepData.flashcards} card{stepData.flashcards !== 1 ? 's' : ''})</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Dúvidas? Acesse a{' '}
          <button onClick={() => navigate('/help')} className="text-primary-600 underline hover:text-primary-700">
            Central de Ajuda
          </button>{' '}
          para tutoriais detalhados de cada funcionalidade.
        </p>
      </div>
    </div>
  );
}
