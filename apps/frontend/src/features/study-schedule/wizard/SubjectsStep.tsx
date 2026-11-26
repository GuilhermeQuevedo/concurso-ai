import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import type { WizardSubject } from './schedule-wizard.model';

export interface SubjectsStepProps {
  subjects: WizardSubject[];
  onChange: (subjects: WizardSubject[]) => void;
}

export interface LevelPickerProps {
  label: string;
  value: number;
  onPick: (n: number) => void;
}

const LEVELS = [1, 2, 3, 4, 5];

function LevelPicker({ label, value, onPick }: LevelPickerProps) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex gap-1.5">
        {LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            aria-label={`${label} ${n}`}
            className={`flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95 ${
              n === value
                ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-500/20'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SubjectsStep({ subjects, onChange }: SubjectsStepProps) {
  const [draft, setDraft] = useState('');

  const update = (index: number, patch: Partial<WizardSubject>) =>
    onChange(subjects.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const add = () => {
    const name = draft.trim();
    if (!name || subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...subjects, { name, importance: 3, difficulty: 3 }]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {subjects.map((subject, index) => (
        <div key={subject.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-colors">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{subject.name}</p>
            <button
              type="button"
              onClick={() => onChange(subjects.filter((_, i) => i !== index))}
              aria-label={`Remover ${subject.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-colors touch-manipulation dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <LevelPicker label="Importância na Prova" value={subject.importance} onPick={(n) => update(index, { importance: n })} />
            <LevelPicker label="Minha Dificuldade" value={subject.difficulty} onPick={(n) => update(index, { difficulty: n })} />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nome de outra matéria do edital..."
          aria-label="Nova matéria"
          className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={add}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 active:scale-[0.98] touch-manipulation dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
