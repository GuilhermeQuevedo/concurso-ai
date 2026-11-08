import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { contentService } from '@/features/content/services/content.service';
import { flattenSubjects } from '@/features/documents/utils/flatten-subjects';
import { getErrorMessage } from '@/utils/error-message';

import { roomService, type NewRoomInput, type RoomMode } from '../services/room.service';

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const COUNTS = [5, 10, 15, 20];
const SECONDS = [15, 20, 30, 45, 60];

const MODES: { value: RoomMode; title: string; text: string }[] = [
  { value: 'LIVE', title: 'Ao vivo', text: 'Todos respondem juntos, com tempo por pergunta e placar em tempo real.' },
  { value: 'OWN_PACE', title: 'No próprio ritmo', text: 'A sala fica aberta por 24 horas. Cada um responde quando puder.' },
];

export interface CreateRoomDialogProps {
  groupId: string;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

export function CreateRoomDialog({ groupId, onClose, onCreated }: CreateRoomDialogProps) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<RoomMode>('LIVE');
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(30);
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const { data: tree = [] } = useQuery({ queryKey: ['subjects'], queryFn: contentService.getSubjects });
  const subjects = flattenSubjects(tree);

  const create = useMutation({
    mutationFn: () => {
      const input: NewRoomInput = {
        title: title.trim(),
        mode,
        count,
        secondsPerQuestion: seconds,
        subjectId: subjectId || undefined,
        difficulty: (difficulty || undefined) as NewRoomInput['difficulty'],
      };
      return roomService.create(groupId, input);
    },
    onSuccess: (room) => onCreated(room.id),
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível criar a sala.')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Nova sala de questões"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length >= 2) create.mutate();
        }}
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Nova sala de questões</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da sala (ex.: Revisão de Direito)" aria-label="Nome da sala" className={FIELD} />

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Como vão jogar?</legend>
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-lg border p-3 text-sm ${mode === m.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
              <span className="block font-medium text-gray-900 dark:text-white">{m.title}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{m.text}</span>
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Questões
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className={`${FIELD} mt-1`}>
              {COUNTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {mode === 'LIVE' && (
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Tempo por pergunta
              <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className={`${FIELD} mt-1`}>
                {SECONDS.map((s) => (
                  <option key={s} value={s}>
                    {s}s
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Disciplina" className={FIELD}>
          <option value="">Todas as disciplinas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.prefix}
              {s.name}
            </option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Dificuldade" className={FIELD}>
          <option value="">Qualquer dificuldade</option>
          <option value="EASY">Fácil</option>
          <option value="MEDIUM">Média</option>
          <option value="HARD">Difícil</option>
        </select>

        <button
          type="submit"
          disabled={title.trim().length < 2 || create.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar sala
        </button>
      </form>
    </div>
  );
}
