import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ArrowDown, Zap, Loader2, BookOpen, Sparkles, Layers } from 'lucide-react';
import {
  errorNotebookService,
  type PendingErrorDTO,
  type RemediationCardDTO,
} from '@/features/error-notebook/services/error-notebook.service';
import { FlashcardViewer, type ViewerCard } from '@/features/flashcards/components/FlashcardViewer';

export function ErrorNotebookPage() {
  const queryClient = useQueryClient();
  const [errorQuestion, setErrorQuestion] = useState('');
  const [errorExplanation, setErrorExplanation] = useState('');
  const [generatedCards, setGeneratedCards] = useState<RemediationCardDTO[] | null>(null);

  const { data: pendingErrors = [], isLoading } = useQuery({
    queryKey: ['pending-errors'],
    queryFn: errorNotebookService.listPending,
  });

  const markLearned = useMutation({
    mutationFn: (questionId: string) => errorNotebookService.markAsLearned(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-errors'] });
    },
  });

  const generateTriad = useMutation({
    mutationFn: (payload: { questionText: string; explanation: string }) =>
      errorNotebookService.generateRemediation({
        questionText: payload.questionText,
        explanation: payload.explanation,
      }),
    onSuccess: (data) => {
      setGeneratedCards(data.flashcards);
      setErrorQuestion('');
      setErrorExplanation('');
      queryClient.invalidateQueries({ queryKey: ['pending-errors'] });
    },
  });

  const handleUseError = (err: PendingErrorDTO) => {
    setErrorQuestion(err.statement);
    setErrorExplanation(`Gabarito: ${err.correctAnswer}. ${err.explanation}`);
    const el = document.getElementById('form-remediation');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenerate = () => {
    if (!errorQuestion.trim() || !errorExplanation.trim()) return;
    generateTriad.mutate({
      questionText: errorQuestion.trim(),
      explanation: errorExplanation.trim(),
    });
  };

  if (generatedCards && generatedCards.length > 0) {
    const viewerCards: ViewerCard[] = generatedCards.map((c) => ({
      front: c.front,
      back: c.back,
      explanation: c.explanation,
    }));

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Tríade de Fixação Ativa
            </h2>
            <p className="text-sm text-gray-500">
              3 flashcards cirúrgicos (Direto, Cloze e V/F) gerados para fixar o seu erro.
            </p>
          </div>
          <button
            onClick={() => setGeneratedCards(null)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 text-sm font-semibold"
          >
            Voltar ao Caderno
          </button>
        </div>

        <FlashcardViewer
          cards={viewerCards}
          title="Tríade de Remediação"
          onFinish={() => setGeneratedCards(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-500" /> Caderno de Erros Ativo
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Seus erros em Simulados e Provas são importados automaticamente aqui e em Decks de Flashcards.
          </p>
        </div>

        <Link
          to="/flashcards"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Layers className="w-4 h-4 text-amber-600" /> Ver Decks de Erros em Flashcards
        </Link>
      </div>

      {/* Pending Errors List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="ml-2 text-sm text-gray-500">Carregando erros pendentes...</span>
        </div>
      ) : pendingErrors.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-900/50 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Erros Pendentes nos seus Simulados ({pendingErrors.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Clique em &quot;Usar no Caderno&quot; para criar tríade com IA
            </span>
          </div>

          <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
            {pendingErrors.map((err) => (
              <div
                key={err.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-gray-900 hover:border-amber-400 transition-all gap-4 shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {err.statement}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Disciplina: <span className="font-medium text-gray-700 dark:text-gray-300">{err.subjectName}</span> • Sua resposta: <span className="text-red-500 font-semibold">{err.userAnswer}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => markLearned.mutate(err.questionId)}
                    title="Marcar como aprendido"
                    className="p-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseError(err)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Usar no Caderno
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <BookOpen className="w-8 h-8 text-amber-500/70 mx-auto mb-2" />
          <p className="font-medium text-gray-800 dark:text-gray-200">Nenhum erro pendente no momento.</p>
          <p className="text-xs text-gray-500 mt-1">
            Quando você responder questões em um Simulado ou Prova Fatiada e errar, as falhas serão exportadas automaticamente para cá!
          </p>
        </div>
      )}

      {/* Manual / Remediation Form */}
      <div
        id="form-remediation"
        className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8 space-y-6 shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            Criar Tríade de Remediação com IA
          </h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
            1. Qual questão ou afirmação você errou?
          </label>
          <textarea
            value={errorQuestion}
            onChange={(e) => setErrorQuestion(e.target.value)}
            rows={3}
            placeholder="Cole aqui a questão que errou ou use o botão 'Usar no Caderno' acima..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
            2. Qual é a regra correta ou explicação do professor?
          </label>
          <textarea
            value={errorExplanation}
            onChange={(e) => setErrorExplanation(e.target.value)}
            rows={3}
            placeholder="Cole o artigo de lei, súmula ou justificativa oficial..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generateTriad.isPending || !errorQuestion.trim() || !errorExplanation.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
        >
          {generateTriad.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analisando Erro e Gerando Tríade...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Gerar 3 Flashcards de Fixação
            </>
          )}
        </button>
      </div>
    </div>
  );
}
