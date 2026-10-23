import { useState } from 'react';
import { X, Layers, FileQuestion, Map, Loader2 } from 'lucide-react';

import type { DeckDTO } from '@/features/flashcards/services/flashcard.service';
import type { QuestionSetSummary } from '@/features/questions/services/question-set.service';
import type { GameSource, GameType } from '@/features/games/services/game.service';

const QUESTION_GAMES: GameType[] = ['DUELO', 'TRILHA'];
const MIN_CARDS = 4;
const MIN_QUESTIONS = 5;

interface Props {
  game: GameType;
  title: string;
  decks: DeckDTO[];
  sets: QuestionSetSummary[];
  subjects: Array<{ id: string; name: string; prefix: string }>;
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

export function GameSetupModal({ game, title, decks, sets, subjects, starting, onStart, onTrilhaMap, onClose }: Props) {
  const isQuiz = QUESTION_GAMES.includes(game);
  const options = buildOptions(game, decks, sets);
  const [selected, setSelected] = useState('all');
  const [subjectId, setSubjectId] = useState('');

  const chosen = options.find((o) => o.key === selected);
  const source: GameSource = chosen ? chosen.source : subjectId ? { subjectId } : {};
  const needsMap = game === 'TRILHA' && selected === 'all';

  const submit = () => (needsMap ? onTrilhaMap() : onStart(source));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {isQuiz ? 'Escolha de qual simulado as questões vão sair.' : 'Escolha de qual deck os cards vão sair.'}
        </p>

        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
          <OptionRow
            active={selected === 'all'}
            icon={game === 'TRILHA' ? Map : isQuiz ? FileQuestion : Layers}
            label={game === 'TRILHA' ? 'Mapa de territórios' : isQuiz ? 'Todas as minhas questões' : 'Todos os meus flashcards'}
            detail={game === 'TRILHA' ? 'Uma disciplina por território' : 'Mistura tudo o que você tem'}
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
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {isQuiz ? 'Você ainda não tem simulados. Crie um em Questões.' : 'Você ainda não tem decks. Crie um em Flashcards.'}
            </p>
          )}
        </div>

        {selected === 'all' && game !== 'TRILHA' && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Ou filtrar por disciplina (opcional)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
          onClick={submit}
          disabled={starting}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {starting && <Loader2 className="h-4 w-4 animate-spin" />}
          {needsMap ? 'Abrir mapa' : 'Jogar'}
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
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-primary-600" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{detail}</span>
      </span>
    </button>
  );
}
