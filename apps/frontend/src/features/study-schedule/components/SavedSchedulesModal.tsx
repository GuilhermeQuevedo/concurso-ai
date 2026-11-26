import { useMemo, useState, useEffect } from 'react';
import { Check, Pencil, Trash2, X, Calendar, BookOpen, Clock } from 'lucide-react';

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

const ICON_BUTTON =
  'min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-lg bg-secondary/70 hover:bg-secondary active:scale-95 transition-all duration-fast touch-manipulation';

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
  return [...map.values()].sort((a, b) =>
    a.key === NO_CONTEST ? 1 : b.key === NO_CONTEST ? -1 : a.label.localeCompare(b.label, 'pt-BR')
  );
}

export function SavedSchedulesModal({
  schedules,
  initialContestId,
  onSelect,
  onRename,
  onDelete,
  onClose,
}: SavedSchedulesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState(initialContestId ?? ALL);

  const groups = useMemo(() => buildGroups(schedules), [schedules]);
  const visibleGroups = filter === ALL ? groups : groups.filter((g) => g.key === filter);

  // Keyboard navigation: Escape closes modal (Jakob's Law)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingId) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, onClose]);

  const startEditing = (s: StudySchedule) => {
    setEditingId(s.id ?? null);
    setEditName(titleOf(s));
  };

  const confirmRename = async (s: StudySchedule) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    if (await onRename(s, trimmed)) setEditingId(null);
  };

  const renderItem = (s: StudySchedule) => (
    <li
      key={s.id}
      className="group relative rounded-xl border border-border bg-background p-4 transition-all duration-fast ease-standard hover:border-primary/50 hover:shadow-xs focus-within:ring-2 focus-within:ring-primary/40"
    >
      {editingId === s.id ? (
        <div className="mb-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirmRename(s);
              if (e.key === 'Escape') setEditingId(null);
            }}
            aria-label="Nome do cronograma"
            className="h-9 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-all duration-fast focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Nome customizado..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => void confirmRename(s)}
            aria-label="Salvar nome"
            className={`${ICON_BUTTON} text-primary hover:text-primary-foreground hover:bg-primary`}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            aria-label="Cancelar edição"
            className={`${ICON_BUTTON} text-muted-foreground hover:text-foreground`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={() => {
              onSelect(s);
              onClose();
            }}
            className="text-left font-semibold text-foreground text-sm pr-16 outline-none transition-colors duration-fast hover:text-primary focus-visible:text-primary after:absolute after:inset-0 after:content-['']"
          >
            {titleOf(s)}
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-fast z-10">
            <button
              type="button"
              onClick={() => startEditing(s)}
              title="Renomear"
              aria-label="Renomear"
              className={`${ICON_BUTTON} text-muted-foreground hover:text-primary`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => s.id && onDelete(s.id)}
              title="Excluir"
              aria-label="Excluir"
              className={`${ICON_BUTTON} text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
          <BookOpen className="h-3 w-3 text-muted-foreground" />
          {s.subjects?.length || 0} {s.subjects?.length === 1 ? 'matéria' : 'matérias'}
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {scheduleDailyHours(s)}h / dia
        </span>
      </div>
    </li>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-schedules-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-normal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-slow ease-standard">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 id="saved-schedules-title" className="text-lg font-bold text-foreground">
              Cronogramas Salvos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-fast rounded-lg touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {groups.length > 1 && (
          <div role="tablist" aria-label="Filtrar por edital" className="mb-3.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[{ key: ALL, label: 'Todos', count: schedules.length }, ...groups.map((g) => ({ key: g.key, label: g.label, count: g.items.length }))].map((chip) => (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={filter === chip.key}
                onClick={() => setFilter(chip.key)}
                className={`min-h-[44px] sm:min-h-[32px] shrink-0 rounded-full border px-3.5 py-1 text-xs transition-all duration-fast touch-manipulation ${
                  filter === chip.key
                    ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {chip.label} <span className="ml-1 opacity-70">({chip.count})</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {visibleGroups.length === 0 || schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 stroke-[1.5] text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Nenhum cronograma encontrado</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Gere um novo cronograma para começar seus estudos.</p>
            </div>
          ) : (
            visibleGroups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                {(groups.length > 1 || group.key !== NO_CONTEST) && (
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h4>
                )}
                <ul className="space-y-3">{group.items.map(renderItem)}</ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
