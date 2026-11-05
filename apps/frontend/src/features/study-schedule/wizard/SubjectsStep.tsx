import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import type { WizardSubject } from './schedule-wizard.model';

interface SubjectsStepProps {
  subjects: WizardSubject[];
  onChange: (subjects: WizardSubject[]) => void;
}

const LEVELS = [1, 2, 3, 4, 5];

interface LevelPickerProps {
  label: string;
  value: number;
  onPick: (level: number) => void;
}

function LevelPicker({ label, value, onPick }: LevelPickerProps) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            aria-label={`${label} ${n}`}
            className={`h-7 w-7 rounded-md border text-xs font-semibold transition-colors ${
              n === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
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
        <div key={subject.name} className="rounded-xl border border-border/70 bg-background p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{subject.name}</p>
            <button
              type="button"
              onClick={() => onChange(subjects.filter((_, i) => i !== index))}
              aria-label={`Remover ${subject.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <LevelPicker label="Importância" value={subject.importance} onPick={(n) => update(index, { importance: n })} />
            <LevelPicker label="Dificuldade" value={subject.difficulty} onPick={(n) => update(index, { difficulty: n })} />
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
          placeholder="Adicionar matéria"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary"
        >
          <Plus className="h-4 w-4" /> Criar matéria
        </button>
      </div>
    </div>
  );
}
