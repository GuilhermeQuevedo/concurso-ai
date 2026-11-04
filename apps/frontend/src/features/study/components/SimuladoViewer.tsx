import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  Check,
  X,
  RotateCcw,
  BookOpen,
  AlertCircle,
  BookmarkPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { errorNotebookService } from '@/features/error-notebook/services/error-notebook.service';
import { RichExplanationView } from './RichExplanationView';

export interface SimuladoQuestionItem {
  id?: string;
  statement: string;
  referenceText?: string | null;
  alternatives: Array<{ letter: string; text: string }>;
  correctAnswer: string;
  explanation: string;
}

export interface SimuladoViewerProps {
  questions: SimuladoQuestionItem[];
  title?: string;
  onFinish?: () => void;
  onRestart?: () => void;
}

export function SimuladoViewer({
  questions,
  title = 'Simulado Especialista',
  onFinish,
  onRestart,
}: SimuladoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanationMap, setShowExplanationMap] = useState<Record<number, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [autoExportSuccess, setAutoExportSuccess] = useState<string | null>(null);
  const autoExportedRef = useRef(false);

  const wrongIndices = Object.keys(answers)
    .map(Number)
    .filter((idx) => {
      const q = questions[idx];
      return q && q.correctAnswer.trim().toUpperCase() !== answers[idx]?.trim().toUpperCase();
    });

  useEffect(() => {
    if (!isFinished || wrongIndices.length === 0 || autoExportedRef.current) {
      return;
    }

    autoExportedRef.current = true;
    setIsAutoExporting(true);

    const errorsPayload = wrongIndices.map((idx) => {
      const q = questions[idx];
      return {
        questionId: q.id,
        statement: q.statement,
        alternatives: q.alternatives,
        userAnswer: answers[idx] ?? 'Em branco',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    errorNotebookService
      .recordSimuladoErrors({
        simuladoTitle: title,
        errors: errorsPayload,
      })
      .then((res) => {
        setAutoExportSuccess(
          `${res.recorded} erro(s) exportado(s) automaticamente para o seu Caderno de Erros!`,
        );
      })
      .catch((err) => {
        console.error('Falha ao exportar erros do simulado:', err);
      })
      .finally(() => {
        setIsAutoExporting(false);
      });
  }, [isFinished, wrongIndices, questions, answers, title]);

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center border border-red-200 dark:border-red-900/60 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-bold text-lg">Nenhuma questão disponível para este simulado.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredLetter = answers[currentIndex];
  const isCurrentRevealed = Boolean(showExplanationMap[currentIndex]);

  const handleSelectAlternative = (letter: string) => {
    if (isFinished) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
  };

  const toggleCurrentExplanation = () => {
    setShowExplanationMap((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const correctCount = Object.entries(answers).filter(([idxStr, letter]) => {
    const q = questions[Number(idxStr)];
    return q && q.correctAnswer.trim().toUpperCase() === letter.trim().toUpperCase();
  }).length;

  const percentage = Math.round((correctCount / questions.length) * 100);

  const handleManualExport = async () => {
    if (wrongIndices.length === 0) return;
    setIsExporting(true);
    try {
      const errorsPayload = wrongIndices.map((idx) => {
        const q = questions[idx];
        return {
          questionId: q.id,
          statement: q.statement,
          alternatives: q.alternatives,
          userAnswer: answers[idx] ?? 'Em branco',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        };
      });

      const res = await errorNotebookService.recordSimuladoErrors({
        simuladoTitle: title,
        errors: errorsPayload,
      });

      setExportFeedback(`${res.recorded} questão(ões) salva(s) no Caderno de Erros com sucesso!`);
    } catch {
      setExportFeedback('Ocorreu um erro ao exportar para o caderno.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isFinished) {
    let performanceLabel = 'Precisa de reforço nas regras centrais.';
    if (percentage >= 80) performanceLabel = 'Excelente aproveitamento! Domínio de alto nível.';
    else if (percentage >= 60) performanceLabel = 'Bom aproveitamento, com pontos de atenção a revisar.';

    return (
      <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Performance Card */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultado do Simulado</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{performanceLabel}</p>

          <div className="my-8 flex justify-center">
            <div
              className={`w-36 h-36 rounded-full border-[10px] flex items-center justify-center shadow-inner ${
                percentage >= 70
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : percentage >= 50
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-red-500 text-red-600 dark:text-red-400'
              }`}
            >
              <span className="text-4xl font-extrabold">{percentage}%</span>
            </div>
          </div>

          {/* Automatic Export Status Banner */}
          {isAutoExporting && (
            <div className="mb-6 flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando {wrongIndices.length} erro(s) automaticamente no seu Caderno de Erros...</span>
            </div>
          )}

          {autoExportSuccess && (
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-left">{autoExportSuccess}</span>
              </div>
              <Link
                to="/error-notebook"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" /> Ir para o Caderno de Erros
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setAnswers({});
                setCurrentIndex(0);
                setIsFinished(false);
                setExportFeedback(null);
                setAutoExportSuccess(null);
                setShowExplanationMap({});
                autoExportedRef.current = false;
                if (onRestart) onRestart();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Repetir Simulado
            </button>

            {wrongIndices.length > 0 && (
              <Link
                to="/error-notebook"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> Ir para o Caderno de Erros ({wrongIndices.length})
              </Link>
            )}

            {wrongIndices.length > 0 && !autoExportSuccess && !isAutoExporting && (
              <button
                onClick={handleManualExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                {isExporting ? 'Exportando...' : `Salvar ${wrongIndices.length} Erros no Caderno de Erros`}
              </button>
            )}

            {onFinish && (
              <button
                onClick={onFinish}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Concluir
              </button>
            )}
          </div>

          {exportFeedback && (
            <p className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {exportFeedback}
            </p>
          )}
        </div>

        {/* Gabarito Consolidado com Explicação Rica */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              Gabarito Consolidado & Resoluções Comentadas
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              {correctCount} de {questions.length} acertos
            </span>
          </div>

          {questions.map((q, idx) => {
            const userLetter = answers[idx];
            const isCorrect = userLetter?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-6 bg-white dark:bg-gray-900 space-y-5 shadow-xs ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-950/60 border-l-4 border-l-emerald-500'
                    : 'border-red-200 dark:border-red-950/60 border-l-4 border-l-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Questão {idx + 1} • {isCorrect ? 'Acertou' : 'Errou'}
                  </span>
                </div>

                {q.referenceText && (
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-600 dark:text-gray-300 italic border border-gray-200 dark:border-gray-700">
                    {q.referenceText}
                  </div>
                )}

                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-line">
                  {q.statement}
                </p>

                {/* Resumo da Resposta e Gabarito */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                      : 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
                  }`}>
                    <span className="block text-[11px] font-bold uppercase mb-0.5 text-gray-500 dark:text-gray-400">
                      Sua Resposta
                    </span>
                    <span className={`text-sm font-black ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                      {userLetter ? `Alternativa ${userLetter}` : 'Não respondida'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <span className="block text-[11px] font-bold uppercase mb-0.5 text-emerald-600 dark:text-emerald-400">
                      Gabarito Oficial
                    </span>
                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                      Alternativa {q.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Explicação Rica Estruturada */}
                {q.explanation && (
                  <RichExplanationView
                    explanation={q.explanation}
                    correctAnswer={q.correctAnswer}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header com Prevenção de Colisão de Texto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate" title={title}>
            {title}
          </h2>
          <p className="text-xs text-gray-500">
            Questão {currentIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto max-w-full py-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex
                  ? 'w-8 bg-primary-600'
                  : answers[i] !== undefined
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8 shadow-sm space-y-6">
        {currentQuestion.referenceText && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">
            {currentQuestion.referenceText}
          </div>
        )}

        <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
          {currentQuestion.statement}
        </div>

        {/* Alternatives */}
        <div className="space-y-3">
          {currentQuestion.alternatives.map((alt) => {
            const isSelected = answeredLetter === alt.letter;
            const isAnswerKey = isCurrentRevealed && alt.letter === currentQuestion.correctAnswer;
            const isWrongSelection = isCurrentRevealed && isSelected && alt.letter !== currentQuestion.correctAnswer;

            let cardTone = 'border-gray-200 dark:border-gray-800 hover:border-primary-400/50 bg-white dark:bg-gray-900';
            let circleTone = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

            if (isAnswerKey) {
              cardTone = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500';
              circleTone = 'bg-emerald-600 text-white font-bold';
            } else if (isWrongSelection) {
              cardTone = 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-1 ring-red-500';
              circleTone = 'bg-red-600 text-white font-bold';
            } else if (isSelected) {
              cardTone = 'border-primary-600 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 font-medium ring-2 ring-primary-500/80';
              circleTone = 'bg-primary-600 text-white font-bold';
            }

            return (
              <div
                key={alt.letter}
                onClick={() => handleSelectAlternative(alt.letter)}
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${cardTone}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${circleTone}`}>
                  {isAnswerKey ? <Check className="w-4 h-4 stroke-[3]" /> : isWrongSelection ? <X className="w-4 h-4 stroke-[3]" /> : alt.letter}
                </span>
                <span className="text-sm md:text-base leading-relaxed pt-0.5">{alt.text}</span>
              </div>
            );
          })}
        </div>

        {/* Botão de Conferir Gabarito e Explicação em Tempo Real */}
        {answeredLetter && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleCurrentExplanation}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isCurrentRevealed ? 'Ocultar Explicação Detalhada' : 'Conferir Gabarito e Explicação Completa'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isCurrentRevealed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Explicação Rica Exibida Durante o Estudo */}
        {isCurrentRevealed && (
          <RichExplanationView
            explanation={currentQuestion.explanation}
            correctAnswer={currentQuestion.correctAnswer}
            className="animate-in fade-in duration-200"
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          {currentIndex === questions.length - 1 ? 'Finalizar e Ver Gabarito' : 'Próxima'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
