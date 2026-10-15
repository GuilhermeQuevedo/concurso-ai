import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Plus, Trash2, PencilLine } from 'lucide-react';
import { contentService, type SubjectDTO } from '@/features/content/services/content.service';
import {
  questionSetService,
  type SetMode,
  type Difficulty,
  type ManualQuestionInput,
} from '../services/question-set.service';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const label = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

interface Draft {
  statement: string;
  alts: string[];
  correct: string;
  difficulty: Difficulty;
  explanation: string;
}

const emptyDraft = (): Draft => ({ statement: '', alts: ['', '', '', '', ''], correct: 'A', difficulty: 'MEDIUM', explanation: '' });

function flatten(subjects: SubjectDTO[], prefix = ''): Array<SubjectDTO & { prefix: string }> {
  const out: Array<SubjectDTO & { prefix: string }> = [];
  for (const s of subjects) {
    out.push({ ...s, prefix });
    if (s.children?.length) out.push(...flatten(s.children, prefix + '— '));
  }
  return out;
}

export function CreateManualModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [mode, setMode] = useState<SetMode>('STUDY');
  const [drafts, setDrafts] = useState<Draft[]>([emptyDraft()]);
  const [error, setError] = useState('');

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const flatSubjects = flatten(subjects);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const updateAlt = (i: number, a: number, text: string) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, alts: d.alts.map((v, j) => (j === a ? text : v)) } : d)));

  const mutation = useMutation({
    mutationFn: (questions: ManualQuestionInput[]) =>
      questionSetService.createManual({ name: name.trim(), subjectId, mode, questions }),
    onSuccess: () => onCreated(),
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  });

  const submit = () => {
    setError('');
    if (name.trim().length < 2) return setError('Dê um nome ao simulado.');
    if (!subjectId) return setError('Escolha a disciplina.');
    const questions: ManualQuestionInput[] = [];
    for (const [i, d] of drafts.entries()) {
      if (d.statement.trim().length < 3) return setError(`Questão ${i + 1}: escreva o enunciado.`);
      const alternatives = d.alts
        .map((text, j) => ({ letter: LETTERS[j], text: text.trim() }))
        .filter((a) => a.text.length > 0);
      if (alternatives.length < 2) return setError(`Questão ${i + 1}: preencha ao menos 2 alternativas.`);
      if (!alternatives.some((a) => a.letter === d.correct))
        return setError(`Questão ${i + 1}: a alternativa correta (${d.correct}) está vazia.`);
      questions.push({
        statement: d.statement.trim(),
        alternatives,
        correctAnswer: d.correct,
        explanation: d.explanation.trim() || undefined,
        difficulty: d.difficulty,
      });
    }
    mutation.mutate(questions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <PencilLine className="h-5 w-5 text-primary-600" /> Criar manual
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className={label}>Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Nome do simulado" />
          </div>
          <div>
            <label className={label}>Disciplina *</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
              <option value="">Selecione...</option>
              {flatSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.prefix}{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Modo</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as SetMode)} className={field}>
              <option value="STUDY">Estudo</option>
              <option value="EXAM">Simulado</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Questão {i + 1}</span>
                {drafts.length > 1 && (
                  <button onClick={() => setDrafts((ds) => ds.filter((_, idx) => idx !== i))} className="rounded p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <textarea value={d.statement} onChange={(e) => update(i, { statement: e.target.value })} rows={2} placeholder="Enunciado" className={`${field} mb-2`} />
              {d.alts.map((v, a) => (
                <div key={a} className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium dark:border-gray-600">{LETTERS[a]}</span>
                  <input value={v} onChange={(e) => updateAlt(i, a, e.target.value)} placeholder={`Alternativa ${LETTERS[a]}`} className={field} />
                </div>
              ))}
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Correta</label>
                  <select value={d.correct} onChange={(e) => update(i, { correct: e.target.value })} className={field}>
                    {LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Dificuldade</label>
                  <select value={d.difficulty} onChange={(e) => update(i, { difficulty: e.target.value as Difficulty })} className={field}>
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500">Explicação (opcional)</label>
                  <input value={d.explanation} onChange={(e) => update(i, { explanation: e.target.value })} className={field} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setDrafts((ds) => [...ds, emptyDraft()])}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:text-gray-300"
        >
          <Plus className="h-4 w-4" /> Adicionar questão
        </button>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={mutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar simulado'}
        </button>
      </div>
    </div>
  );
}
