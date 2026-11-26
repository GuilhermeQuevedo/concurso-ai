import { useState, useEffect } from 'react';
import { X, Layers, FileQuestion, Map, Loader2 } from 'lucide-react';

import type { DeckDTO } from '@/features/flashcards/services/flashcard.service';
import type { QuestionSetSummary } from '@/features/questions/services/question-set.service';
import type { GameSource, GameType } from '@/features/games/services/game.service';

const QUESTION_GAMES: GameType[] = ['DUELO', 'TRILHA'];
const MIN_CARDS = 4;
const MIN_QUESTIONS = 5;

export interface GameSetupModalProps {
  game: GameType;
  title: string;
  decks: DeckDTO[];
  sets: QuestionSetSummary[];
  subjects: Array<{ id: string; name: string; prefix: string }>;
  initialSubjectId?: string;
  starting: boolean;
  onStart: (source: GameSource) => void;
  onTrilhaMap: () => void;
  onClose: () => void;
}

interface Option {
  key: string;
  label: string;
  detail: string;
  disabled: boolean;
  source: GameSource;
}

function buildOptions(game: GameType, decks: DeckDTO[], sets: QuestionSetSummary[]): Option[] {
  if (QUESTION_GAMES.includes(game)) {
    return sets.map((q) => ({
      key: `set:${q.id}`,
      label: q.name,
      detail: `${q.total} questões${q.subject ? ` · ${q.subject.name}` : ''}`,
      disabled: q.total < MIN_QUESTIONS,
      source: { questionSetId: q.id },
    }));
  }
  return decks.map((d) => ({
    key: `deck:${d.id}`,
    label: d.name,
    detail: `${d.total} cards${d.due ? ` · ${d.due} para revisar` : ''}`,
    disabled: d.total < MIN_CARDS,
    source: { deckId: d.id },
  }));
}

export function GameSetupModal({
  game,
  title,
  decks,
  sets,
  subjects,
  initialSubjectId,
  starting,
  onStart,
  onTrilhaMap,
  onClose,
}: GameSetupModalProps) {
  const isQuiz = QUESTION_GAMES.includes(game);
  const options = buildOptions(game, decks, sets);
  const [selected, setSelected] = useState('all');
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? '');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !starting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [starting, onClose]);

  const chosen = options.find((o) => o.key === selected);
  const source: GameSource = chosen ? chosen.source : subjectId ? { subjectId } : {};
  const needsMap = game === 'TRILHA' && selected === 'all';

  const submit = () => (needsMap ? onTrilhaMap() : onStart(source));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs motion-safe:animate-in motion-safe:fade-in duration-fast"
      onClick={() => !starting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:zoom-in-95 duration-fast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={starting}
            aria-label="Fechar"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          {isQuiz ? 'Escolha de qual simulado as questões vão sair.' : 'Escolha de qual deck os cards vão sair.'}
        </p>

        <div className="-mx-1 flex-1 space-y-2.5 overflow-y-auto px-1">
          <OptionRow
            active={selected === 'all'}
            icon={game === 'TRILHA' ? Map : isQuiz ? FileQuestion : Layers}
            label={game === 'TRILHA' ? 'Mapa de territórios' : isQuiz ? 'Todas as minhas questões' : 'Todos os meus flashcards'}
            detail={game === 'TRILHA' ? 'Uma disciplina por território' : 'Mistura todo o conteúdo cadastrado'}
            onClick={() => setSelected('all')}
          />
          {options.map((o) => (
            <OptionRow
              key={o.key}
              active={selected === o.key}
              icon={isQuiz ? FileQuestion : Layers}
              label={o.label}
              detail={o.disabled ? `${o.detail} · poucos itens para jogar` : o.detail}
              disabled={o.disabled}
              onClick={() => setSelected(o.key)}
            />
          ))}
          {options.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {isQuiz ? 'Você ainda não tem simulados. Crie um na seção de Questões.' : 'Você ainda não tem decks. Crie um na seção de Flashcards.'}
            </p>
          )}
        </div>

        {selected === 'all' && game !== 'TRILHA' && (
          <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label
              htmlFor="subject-filter-select"
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Ou filtrar por disciplina específica (opcional):
            </label>
            <select
              id="subject-filter-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Qualquer disciplina</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prefix}
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={starting}
          className="mt-5 min-h-[44px] inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
        >
          {starting && <Loader2 className="h-4 w-4 animate-spin" />}
          {needsMap ? 'Abrir mapa de territórios' : 'Jogar Agora'}
        </button>
      </div>
    </div>
  );
}

function OptionRow({
  active,
  icon: Icon,
  label,
  detail,
  disabled,
  onClick,
}: {
  active: boolean;
  icon: typeof Layers;
  label: string;
  detail: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] ${
        active
          ? 'border-[#2E8C82] bg-[#2E8C82]/10 ring-1 ring-[#2E8C82] dark:border-[#2E8C82] dark:bg-[#2E8C82]/20'
          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-[#2E8C82] dark:text-[#38b2a6]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{label}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{detail}</span>
      </span>
    </button>
  );
}
