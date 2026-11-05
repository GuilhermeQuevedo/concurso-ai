import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';

import type { StudySchedule } from '../types';
import { scheduleDailyHours, scheduleExamDate } from '../utils/schedule-dates';

interface SavedSchedulesModalProps {
  schedules: StudySchedule[];
  onSelect: (schedule: StudySchedule) => void;
  onRename: (schedule: StudySchedule, name: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const titleOf = (s: StudySchedule) =>
  s.schedule?.title || `Prova: ${new Date(`${scheduleExamDate(s)}T12:00:00Z`).toLocaleDateString('pt-BR')}`;

const ICON_BUTTON = 'relative z-10 p-1.5 rounded-md bg-secondary/60 hover:bg-secondary';

export function SavedSchedulesModal({ schedules, onSelect, onRename, onDelete, onClose }: SavedSchedulesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (s: StudySchedule) => {
    setEditingId(s.id ?? null);
    setEditName(titleOf(s));
  };

  const confirmRename = async (s: StudySchedule) => {
    if (await onRename(s, editName)) setEditingId(null);
  };

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

        <ul className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {schedules.map((s) => (
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
          ))}
        </ul>
      </div>
    </div>
  );
}
