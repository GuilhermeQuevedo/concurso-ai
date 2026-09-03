import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Loader2,
  ChevronLeft,
  Trash2,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  PenLine,
  ClipboardList,
} from 'lucide-react';
import {
  essayService,
  isCaseStudyResult,
  type EssaySummary,
  type EssayCriteria,
} from '@/features/essays/services/essay.service';
import { SubmitEssayForm } from '@/features/essays/components/SubmitEssayForm';
import { CaseStudyResultView } from '@/features/essays/components/CaseStudyResultView';

type View = 'list' | 'write' | 'detail';

export function EssayPage() {
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState('');

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  if (view === 'write') return <SubmitEssayForm onBack={() => setView('list')} onCreated={openDetail} />;
  if (view === 'detail') return <EssayDetailView essayId={selectedId} onBack={() => setView('list')} />;
  return <EssayList onWrite={() => setView('write')} onOpen={openDetail} />;
}

function TypeBadge({ type }: { type: EssaySummary['type'] }) {
  const isCase = type === 'ESTUDO_CASO';
  const Icon = isCase ? ClipboardList : PenLine;
  return (
    <span
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
        isCase
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      }`}
    >
      <Icon className="h-3 w-3" />
      {isCase ? 'Estudo de caso' : 'Dissertativa'}
    </span>
  );
}

function EssayList({ onWrite, onOpen }: { onWrite: () => void; onOpen: (id: string) => void }) {
  const { data: essays = [], isLoading } = useQuery({
    queryKey: ['essays'],
    queryFn: essayService.list,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redações</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dissertativa ou estudo de caso — a IA corrige e explica ponto a ponto
          </p>
        </div>
        <button
          onClick={onWrite}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Upload className="h-4 w-4" />
          Nova Correção
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : essays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Upload className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nenhuma correção ainda</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Envie uma redação dissertativa ou um estudo de caso para receber a correção da IA
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {essays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} onClick={() => onOpen(essay.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EssayCard({ essay, onClick }: { essay: EssaySummary; onClick: () => void }) {
  const statusConfig = {
    PENDING: { icon: Clock, label: 'Pendente', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300' },
    GRADING: { icon: Loader2, label: 'Corrigindo...', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300' },
    GRADED: { icon: CheckCircle2, label: 'Corrigida', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' },
    ERROR: { icon: AlertCircle, label: 'Erro', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300' },
  };

  const config = statusConfig[essay.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white">{essay.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{essay.theme}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <TypeBadge type={essay.type} />
          <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${config.color}`}>
            <StatusIcon className={`h-3 w-3 ${essay.status === 'GRADING' ? 'animate-spin' : ''}`} />
            {config.label}
          </span>
          <span className="text-xs text-gray-400">{new Date(essay.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      {essay.score !== null && (
        <div className="ml-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{fmt(essay.score)}</span>
          <span className="text-xs text-gray-500">/{essay.maxScore ?? 100}</span>
        </div>
      )}
    </button>
  );
}

function EssayDetailView({ essayId, onBack }: { essayId: string; onBack: () => void }) {
  const queryClient = useQueryClient();

  const { data: essay, isLoading } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: () => essayService.getById(essayId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => essayService.delete(essayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      onBack();
    },
  });

  if (isLoading || !essay) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const maxScore = essay.maxScore ?? 100;
  const caseResult = isCaseStudyResult(essay.criteria) ? essay.criteria : null;
  const competitionPoints = essay.score !== null ? Math.round((essay.score / maxScore) * 10) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Voltar
        </button>
        <button onClick={() => deleteMutation.mutate()} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{essay.title}</h1>
          <TypeBadge type={essay.type} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {essay.theme} · {new Date(essay.createdAt).toLocaleDateString('pt-BR')}
        </p>
        {(essay.role || essay.examBoard) && (
          <p className="mt-0.5 text-xs text-gray-400">
            {[essay.role, essay.examBoard].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {essay.status === 'GRADED' && essay.score !== null && (
        <>
          <ScoreCard score={essay.score} maxScore={maxScore} />

          {caseResult ? (
            <CaseStudyResultView result={caseResult} />
          ) : (
            <>
              {essay.criteria && 'cac' in essay.criteria && <CriteriaBreakdown criteria={essay.criteria} />}
              {essay.feedback && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Feedback da Correção</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{essay.feedback}</p>
                </div>
              )}
            </>
          )}

          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">Pontos na Competição:</span>
              <span>1 (envio) + {competitionPoints} (nota) = {1 + competitionPoints} pontos</span>
            </div>
          </div>
        </>
      )}

      {essay.status === 'GRADING' && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-800 dark:bg-blue-950">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Corrigindo...</p>
        </div>
      )}

      {essay.status === 'ERROR' && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Erro na correção. Tente enviar novamente.</p>
        </div>
      )}

      {essay.fileUrl && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Arquivo Enviado</h3>
          {essay.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? ''}${essay.fileUrl}`}
              alt="Resposta"
              className="max-h-[600px] w-full rounded-lg object-contain"
            />
          ) : (
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? ''}${essay.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm text-primary-600 hover:bg-gray-50 dark:border-gray-700 dark:text-primary-400 dark:hover:bg-gray-800"
            >
              <FileText className="h-5 w-5" />
              Abrir PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = pct >= 80 ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : pct >= 50 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
  const label = pct >= 80 ? 'Excelente!' : pct >= 60 ? 'Bom trabalho!' : pct >= 40 ? 'Pode melhorar' : 'Precisa de atenção';

  return (
    <div className={`mb-4 rounded-xl border p-6 text-center ${bgColor}`}>
      <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Nota Final</p>
      <p className={`text-5xl font-bold ${color}`}>
        {fmt(score)}
        <span className="text-2xl">/{maxScore}</span>
      </p>
      <p className={`mt-1 text-sm font-medium ${color}`}>{label}</p>
    </div>
  );
}

function CriteriaBreakdown({ criteria }: { criteria: EssayCriteria }) {
  const items = [
    { key: 'cac' as const, label: 'CAC — Conteúdo e Atendimento ao Comando', description: 'Compreensão do tema, pertinência dos argumentos, repertório sociocultural' },
    { key: 'ot' as const, label: 'OT — Organização Textual', description: 'Estrutura dissertativo-argumentativa, progressão temática, conectivos' },
    { key: 'dlp' as const, label: 'DLP — Domínio da Língua Portuguesa', description: 'Ortografia, concordância, regência, pontuação, vocabulário' },
  ];

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Critérios de Avaliação</h3>
      <div className="space-y-4">
        {items.map(({ key, label, description }) => {
          const criterion = criteria[key];
          const pct = (criterion.score / criterion.maxScore) * 100;
          const barColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <div key={key} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {criterion.score}/{criterion.maxScore}
                </span>
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
              <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{criterion.comments}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

export default EssayPage;
