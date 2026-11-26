import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  questionSetService,
  type QuestionType,
  type Difficulty,
  type ManualQuestionInput,
} from '../services/question-set.service';

type Format = 'MULTIPLE' | 'TRUE_FALSE' | 'ESSAY';
type DeckKind = 'MULTIPLE' | 'TRUE_FALSE' | 'ESSAY' | 'MIXED';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400';
const label = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

const KIND_OPTIONS: Array<{ value: DeckKind; label: string }> = [
  { value: 'MULTIPLE', label: 'Múltipla Escolha' },
  { value: 'TRUE_FALSE', label: 'Certo/Errado' },
  { value: 'ESSAY', label: 'Subjetiva' },
  { value: 'MIXED', label: 'Variadas' },
];

interface Draft {
  format: Format;
  statement: string;
  alts: string[];
  correct: string;
  difficulty: Difficulty;
  explanation: string;
}

function emptyDraft(format: Format): Draft {
  return {
    format,
    statement: '',
    alts: ['', '', '', '', ''],
    correct: format === 'TRUE_FALSE' ? 'C' : 'A',
    difficulty: 'MEDIUM',
    explanation: '',
  };
}

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

function toInput(draft: Draft, altCount: number): ManualQuestionInput | string {
  const base = { statement: draft.statement.trim(), difficulty: draft.difficulty };
  if (base.statement.length < 3) return 'escreva o enunciado.';

  if (draft.format === 'ESSAY') {
    return { ...base, alternatives: [], explanation: draft.explanation.trim() || undefined };
  }
  if (draft.format === 'TRUE_FALSE') {
    return {
      ...base,
      alternatives: [
        { letter: 'C', text: 'Certo' },
        { letter: 'E', text: 'Errado' },
      ],
      correctAnswer: draft.correct,
      explanation: draft.explanation.trim() || undefined,
    };
  }
  const alternatives = draft.alts
    .slice(0, altCount)
    .map((text, i) => ({ letter: LETTERS[i], text: text.trim() }))
    .filter((a) => a.text.length > 0);
  if (alternatives.length < 2) return 'preencha ao menos 2 alternativas.';
  if (!alternatives.some((a) => a.letter === draft.correct)) return `a alternativa correta (${draft.correct}) está vazia.`;
  return { ...base, alternatives, correctAnswer: draft.correct, explanation: draft.explanation.trim() || undefined };
}

interface CreateManualModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateManualModal({ onClose, onCreated }: CreateManualModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [kind, setKind] = useState<DeckKind>('MULTIPLE');
  const [altCount, setAltCount] = useState<4 | 5>(5);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });

  const firstFormat: Format = kind === 'MIXED' ? 'MULTIPLE' : kind;
  const questionType: QuestionType =
    kind === 'MULTIPLE' ? (altCount === 4 ? 'MULTIPLE_4' : 'MULTIPLE_5') : kind;

  const mutation = useMutation({
    mutationFn: (questions: ManualQuestionInput[]) =>
      questionSetService.createManual({ name: name.trim(), subjectId: subjectId || undefined, questionType, questions }),
    onSuccess: () => onCreated(),
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  });

  const goNext = () => {
    if (name.trim().length < 2) return setError('Dê um nome ao deck.');
    setError('');
    setDrafts([emptyDraft(firstFormat)]);
    setStep(2);
  };

  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...p } : d)));
  const patchAlt = (i: number, a: number, text: string) =>
    setDrafts((ds) =>
      ds.map((d, idx) => (idx === i ? { ...d, alts: d.alts.map((v, j) => (j === a ? text : v)) } : d)),
    );

  const save = () => {
    setError('');
    const questions: ManualQuestionInput[] = [];
    for (const [i, d] of drafts.entries()) {
      const result = toInput(d, altCount);
      if (typeof result === 'string') return setError(`Questão ${i + 1}: ${result}`);
      questions.push(result);
    }
    mutation.mutate(questions);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 motion-safe:animate-in motion-safe:fade-in duration-fast"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-auto rounded-2xl bg-white p-5 shadow-2xl transition-all duration-normal ease-standard motion-safe:animate-in motion-safe:zoom-in-95 dark:bg-gray-900 ${
          step === 1 ? 'max-w-md' : 'max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="manual-modal-title" className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                aria-label="Voltar para configurações"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:scale-95 touch-manipulation dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {step === 1 ? 'Criar Deck Manual' : name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:scale-95 touch-manipulation dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="deck-name" className={label}>Nome do Deck</label>
              <input
                id="deck-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Direito Constitucional - Cap. 1"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="deck-subject" className={label}>Matéria</label>
              <select
                id="deck-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={field}
              >
                <option value="">Selecione (opcional)</option>
                {flatten(subjects).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prefix}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Tipo de Questão</label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 rounded-lg border border-gray-200 p-1 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setKind(k.value)}
                    className={`min-h-[44px] sm:min-h-[38px] rounded-md px-2 py-2 text-xs sm:text-sm font-medium transition-all touch-manipulation active:scale-[0.98] ${
                      kind === k.value
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
            {(kind === 'MULTIPLE' || kind === 'MIXED') && (
              <div>
                <label className={label}>Alternativas por questão</label>
                <div className="flex gap-2">
                  {([4, 5] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAltCount(n)}
                      className={`min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all touch-manipulation active:scale-[0.98] ${
                        altCount === n
                          ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {n} alternativas
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400 motion-safe:animate-in motion-safe:fade-in">
                {error}
              </p>
            )}
            <button
              onClick={goNext}
              type="button"
              className="min-h-[48px] w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] touch-manipulation"
            >
              Próximo: Adicionar Questões
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {drafts.map((d, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 transition-colors dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Questão {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {kind === 'MIXED' && (
                        <select
                          value={d.format}
                          onChange={(e) =>
                            patch(i, {
                              format: e.target.value as Format,
                              correct: e.target.value === 'TRUE_FALSE' ? 'C' : 'A',
                            })
                          }
                          aria-label={`Formato da questão ${i + 1}`}
                          className="min-h-[36px] rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="MULTIPLE">Múltipla escolha</option>
                          <option value="TRUE_FALSE">Certo/Errado</option>
                          <option value="ESSAY">Subjetiva</option>
                        </select>
                      )}
                      {drafts.length > 1 && (
                        <button
                          onClick={() => setDrafts((ds) => ds.filter((_, idx) => idx !== i))}
                          aria-label={`Remover questão ${i + 1}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 touch-manipulation dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={d.statement}
                    onChange={(e) => patch(i, { statement: e.target.value })}
                    rows={2}
                    placeholder="Enunciado da questão..."
                    aria-label={`Enunciado da questão ${i + 1}`}
                    className={`${field} mb-3`}
                  />

                  {d.format === 'MULTIPLE' &&
                    d.alts.slice(0, altCount).map((v, a) => (
                      <div key={a} className="mb-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => patch(i, { correct: LETTERS[a] })}
                          title={`Marcar alternativa ${LETTERS[a]} como correta`}
                          aria-label={`Marcar alternativa ${LETTERS[a]} como correta`}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all touch-manipulation active:scale-95 ${
                            d.correct === LETTERS[a]
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                              : 'border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          {LETTERS[a]}
                        </button>
                        <input
                          value={v}
                          onChange={(e) => patchAlt(i, a, e.target.value)}
                          placeholder={`Alternativa ${LETTERS[a]}`}
                          aria-label={`Texto da alternativa ${LETTERS[a]}`}
                          className={field}
                        />
                      </div>
                    ))}

                  {d.format === 'TRUE_FALSE' && (
                    <div className="mb-3 flex gap-2">
                      {[
                        { v: 'C', t: 'Certo' },
                        { v: 'E', t: 'Errado' },
                      ].map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => patch(i, { correct: o.v })}
                          className={`min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all touch-manipulation active:scale-[0.98] ${
                            d.correct === o.v
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {o.t}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select
                      value={d.difficulty}
                      onChange={(e) => patch(i, { difficulty: e.target.value as Difficulty })}
                      aria-label={`Dificuldade da questão ${i + 1}`}
                      className={field}
                    >
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HARD">Difícil</option>
                    </select>
                    <input
                      value={d.explanation}
                      onChange={(e) => patch(i, { explanation: e.target.value })}
                      placeholder={d.format === 'ESSAY' ? 'Resposta esperada / Espelho' : 'Explicação / Comentário (opcional)'}
                      aria-label={`Explicação da questão ${i + 1}`}
                      className={`${field} sm:col-span-2`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDrafts((ds) => [...ds, emptyDraft(firstFormat)])}
              type="button"
              className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary-500 hover:text-primary-600 active:scale-[0.98] touch-manipulation dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
            >
              <Plus className="h-4 w-4" /> Adicionar outra questão
            </button>
            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 motion-safe:animate-in motion-safe:fade-in">
                {error}
              </p>
            )}
            <button
              onClick={save}
              type="button"
              disabled={mutation.isPending}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 touch-manipulation"
            >
              {mutation.isPending ? 'Salvando deck...' : 'Salvar deck de questões'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
