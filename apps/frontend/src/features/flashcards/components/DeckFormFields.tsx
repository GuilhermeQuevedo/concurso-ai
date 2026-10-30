import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/features/content/services/content.service';
import { DECK_COLORS } from '../services/flashcard.service';
import { fieldClass, labelClass, type DeckForm } from './deckForm';

export interface DeckFieldsProps {
  value: DeckForm;
  onChange: (next: DeckForm) => void;
  hideSubject?: boolean;
  hideTopic?: boolean;
}

export function DeckFields({ value, onChange, hideSubject = false, hideTopic = false }: DeckFieldsProps) {
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
    enabled: !hideSubject,
  });
  const names = [...new Set(flattenNames(subjects))];
  const set = (patch: Partial<DeckForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nome do deck</label>
        <input
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ex: Direito Constitucional - Princípios"
          className={fieldClass}
        />
      </div>
      {!hideSubject && (
        <div>
          <label className={labelClass}>Matéria</label>
          <input
            list="deck-subjects"
            value={value.subjectName}
            onChange={(e) => set({ subjectName: e.target.value })}
            placeholder="Selecione ou digite uma matéria"
            className={fieldClass}
          />
          <datalist id="deck-subjects">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      )}
      {!hideTopic && (
        <div>
          <label className={labelClass}>
            Tópico <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input value={value.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Ex: Artigos 1-5" className={fieldClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>Cor do deck</label>
        <div className="flex gap-2">
          {DECK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ color: c })}
              aria-label={`Cor ${c}`}
              className={`h-6 w-6 rounded-full transition-transform ${value.color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function flattenNames(subjects: Array<{ name: string; children?: Array<{ name: string; children?: unknown[] }> }>): string[] {
  const out: string[] = [];
  for (const s of subjects) {
    out.push(s.name);
    if (s.children?.length) out.push(...flattenNames(s.children as typeof subjects));
  }
  return out;
}
