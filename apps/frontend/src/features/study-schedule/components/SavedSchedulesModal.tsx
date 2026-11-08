import { useMemo, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';

import type { StudySchedule } from '../types';
import { scheduleDailyHours, scheduleExamDate } from '../utils/schedule-dates';

interface SavedSchedulesModalProps {
  schedules: StudySchedule[];
  // Abre já filtrado pelos cronogramas de um edital (atalho vindo de Meus Editais).
  initialContestId?: string;
  onSelect: (schedule: StudySchedule) => void;
  onRename: (schedule: StudySchedule, name: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const NO_CONTEST = '__none__';
const ALL = '__all__';

const titleOf = (s: StudySchedule) =>
  s.schedule?.title || `Prova: ${new Date(`${scheduleExamDate(s)}T12:00:00Z`).toLocaleDateString('pt-BR')}`;

const groupKey = (s: StudySchedule) => s.contestId ?? NO_CONTEST;
const groupLabel = (s: StudySchedule) => s.contest?.name ?? 'Sem edital';

const ICON_BUTTON = 'relative z-10 p-1.5 rounded-md bg-secondary/60 hover:bg-secondary';

interface Group {
  key: string;
  label: string;
  items: StudySchedule[];
}

function buildGroups(schedules: StudySchedule[]): Group[] {
  const map = new Map<string, Group>();
  for (const s of schedules) {
    const key = groupKey(s);
    const group = map.get(key) ?? { key, label: groupLabel(s), items: [] };
    group.items.push(s);
    map.set(key, group);
  }
  // Editais primeiro (em ordem alfabética); "Sem edital" por último.
  return [...map.values()].sort((a, b) => (a.key === NO_CONTEST ? 1 : b.key === NO_CONTEST ? -1 : a.label.localeCompare(b.label, 'pt-BR')));
}

export function SavedSchedulesModal({ schedules, initialContestId, onSelect, onRename, onDelete, onClose }: SavedSchedulesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState(initialContestId ?? ALL);

  const groups = useMemo(() => buildGroups(schedules), [schedules]);
  const visibleGroups = filter === ALL ? groups : groups.filter((g) => g.key === filter);

  const startEditing = (s: StudySchedule) => {
    setEditingId(s.id ?? null);
    setEditName(titleOf(s));
  };

  const confirmRename = async (s: StudySchedule) => {
    if (await onRename(s, editName)) setEditingId(null);
  };

  const renderItem = (s: StudySchedule) => (
    <li key={s.id} className="relative p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-all group focus-within:ring-2 focus-within:ring-primary/40">
      {editingId === s.id ? (
        <div className="flex items-center gap-2 mb-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void confirmRename(s)}
            aria-label="Nome do cronograma"
            className="flex-1 h-8 px-2.5 text-sm border rounded-md text-foreground bg-card focus:ring-1 focus:ring-primary outline-none"
            placeholder="Nome customizado..."
            autoFocus
          />
          <button type="button" onClick={() => void confirmRename(s)} aria-label="Salvar nome" className={`${ICON_BUTTON} text-primary`}>
            <Check className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar" className={`${ICON_BUTTON} text-muted-foreground`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <button
            type="button"
            onClick={() => {
              onSelect(s);
              onClose();
            }}
            className="text-left font-semibold text-foreground text-sm pr-16 outline-none after:absolute after:inset-0 after:content-['']"
          >
            {titleOf(s)}
          </button>
          <div className="absolute top-3.5 right-3.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button type="button" onClick={() => startEditing(s)} title="Renomear" aria-label="Renomear" className={`${ICON_BUTTON} text-muted-foreground hover:text-primary`}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => s.id && onDelete(s.id)} title="Excluir" aria-label="Excluir" className={`${ICON_BUTTON} text-muted-foreground hover:text-destructive`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>{s.subjects?.length || 0} matérias</span>
        <span>{scheduleDailyHours(s)}h / dia</span>
      </div>
    </li>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-schedules-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <h3 id="saved-schedules-title" className="text-lg font-bold text-foreground">
            Cronogramas Salvos
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {groups.length > 1 && (
          <div role="tablist" aria-label="Filtrar por edital" className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {[{ key: ALL, label: 'Todos', count: schedules.length }, ...groups.map((g) => ({ key: g.key, label: g.label, count: g.items.length }))].map((chip) => (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={filter === chip.key}
                onClick={() => setFilter(chip.key)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                  filter === chip.key ? 'border-primary bg-primary text-primary-foreground font-medium' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {chip.label} <span className="opacity-70">{chip.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {visibleGroups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              {(groups.length > 1 || group.key !== NO_CONTEST) && (
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h4>
              )}
              <ul className="space-y-3">{group.items.map(renderItem)}</ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
