import { useState } from 'react';
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
const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white';
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
  return { format, statement: '', alts: ['', '', '', '', ''], correct: format === 'TRUE_FALSE' ? 'C' : 'A', difficulty: 'MEDIUM', explanation: '' };
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
      alternatives: [{ letter: 'C', text: 'Certo' }, { letter: 'E', text: 'Errado' }],
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

export function CreateManualModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [kind, setKind] = useState<DeckKind>('MULTIPLE');
  const [altCount, setAltCount] = useState<4 | 5>(5);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState('');

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

  const patch = (i: number, p: Partial<Draft>) => setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...p } : d)));
  const patchAlt = (i: number, a: number, text: string) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, alts: d.alts.map((v, j) => (j === a ? text : v)) } : d)));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-auto rounded-2xl bg-white p-5 dark:bg-gray-900 ${step === 1 ? 'max-w-sm' : 'max-w-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {step === 1 ? 'Criar Deck Manual' : name}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className={label}>Nome do Deck</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Direito Constitucional - Cap. 1" className={field} />
            </div>
            <div>
              <label className={label}>Matéria</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
                <option value="">Selecione (opcional)</option>
                {flatten(subjects).map((s) => (
                  <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Tipo de Questão</label>
              <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    onClick={() => setKind(k.value)}
                    className={`px-1 py-2.5 text-xs ${kind === k.value ? 'bg-primary-600 font-medium text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
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
                      onClick={() => setAltCount(n)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${altCount === n ? 'border-primary-500 bg-primary-600/10 text-primary-600' : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300'}`}
                    >
                      {n} alternativas
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={goNext} className="w-full rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
              Próximo: Adicionar Questões
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {drafts.map((d, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Questão {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {kind === 'MIXED' && (
                        <select value={d.format} onChange={(e) => patch(i, { format: e.target.value as Format, correct: e.target.value === 'TRUE_FALSE' ? 'C' : 'A' })} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                          <option value="MULTIPLE">Múltipla escolha</option>
                          <option value="TRUE_FALSE">Certo/Errado</option>
                          <option value="ESSAY">Subjetiva</option>
                        </select>
                      )}
                      {drafts.length > 1 && (
                        <button onClick={() => setDrafts((ds) => ds.filter((_, idx) => idx !== i))} className="rounded p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea value={d.statement} onChange={(e) => patch(i, { statement: e.target.value })} rows={2} placeholder="Enunciado" className={`${field} mb-2`} />

                  {d.format === 'MULTIPLE' &&
                    d.alts.slice(0, altCount).map((v, a) => (
                      <div key={a} className="mb-1.5 flex items-center gap-2">
                        <button
                          onClick={() => patch(i, { correct: LETTERS[a] })}
                          title="Marcar como correta"
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${d.correct === LETTERS[a] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600 dark:text-gray-300'}`}
                        >
                          {LETTERS[a]}
                        </button>
                        <input value={v} onChange={(e) => patchAlt(i, a, e.target.value)} placeholder={`Alternativa ${LETTERS[a]}`} className={field} />
                      </div>
                    ))}

                  {d.format === 'TRUE_FALSE' && (
                    <div className="mb-2 flex gap-2">
                      {[{ v: 'C', t: 'Certo' }, { v: 'E', t: 'Errado' }].map((o) => (
                        <button key={o.v} onClick={() => patch(i, { correct: o.v })} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${d.correct === o.v ? 'border-green-500 bg-green-500/10 font-medium text-green-600' : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300'}`}>
                          {o.t}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select value={d.difficulty} onChange={(e) => patch(i, { difficulty: e.target.value as Difficulty })} className={field}>
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HARD">Difícil</option>
                    </select>
                    <input
                      value={d.explanation}
                      onChange={(e) => patch(i, { explanation: e.target.value })}
                      placeholder={d.format === 'ESSAY' ? 'Resposta esperada' : 'Explicação (opcional)'}
                      className={`${field} sm:col-span-2`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDrafts((ds) => [...ds, emptyDraft(firstFormat)])}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:text-gray-300"
            >
              <Plus className="h-4 w-4" /> Adicionar questão
            </button>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              onClick={save}
              disabled={mutation.isPending}
              className="mt-4 w-full rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar deck'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
