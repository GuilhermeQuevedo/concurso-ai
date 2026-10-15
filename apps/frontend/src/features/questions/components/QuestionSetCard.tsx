import { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import type { QuestionSetSummary } from '../services/question-set.service';

function ProgressRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="shrink-0">
      <circle cx="23" cy="23" r={r} fill="none" strokeWidth="4" className="stroke-gray-200 dark:stroke-gray-700" />
      <circle
        cx="23" cy="23" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
        className="stroke-primary-600" strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 23 23)"
      />
      <text x="23" y="27" textAnchor="middle" className="fill-gray-700 dark:fill-gray-200" fontSize="11" fontWeight="700">
        {pct}%
      </text>
    </svg>
  );
}

function fmt(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function QuestionSetCard({
  set,
  onStart,
  onDelete,
  starting,
}: {
  set: QuestionSetSummary;
  onStart: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  starting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pct = set.total > 0 ? Math.round((set.answered / set.total) * 100) : 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-gray-900 dark:text-white">{set.name}</p>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => { setMenuOpen(false); onDelete(set.id, set.name); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {set.subject && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
          <span className="h-2 w-2 rounded-full bg-primary-500" /> {set.subject.name}
        </p>
      )}

      <div className="mb-4 flex items-center gap-3">
        <ProgressRing pct={pct} />
        <div className="min-w-0 text-xs text-gray-500 dark:text-gray-400">
          <p className="text-gray-700 dark:text-gray-300">
            {set.total} questões · {set.mode === 'EXAM' ? 'Simulado' : 'Estudo'}
          </p>
          <p>Criado {fmt(set.createdAt)} · Último {fmt(set.lastAttemptAt)}</p>
        </div>
      </div>

      <button
        onClick={() => onStart(set.id)}
        disabled={starting}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Iniciar
      </button>
    </div>
  );
}
