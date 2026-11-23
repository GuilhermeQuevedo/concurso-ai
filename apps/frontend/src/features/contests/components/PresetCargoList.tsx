import type { PresetCatalog } from '../services/preset-edital.service';

interface PresetCargoListProps {
  groups: PresetCatalog['groups'];
  selectedId: string | null;
  onSelect: (cargoId: string) => void;
  showTitles: boolean;
}

export function PresetCargoList({ groups, selectedId, onSelect, showTitles }: PresetCargoListProps) {
  if (groups.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum cargo encontrado para essa busca.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.name}>
          {showTitles && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group.name}</h3>}
          <div className="grid gap-2 sm:grid-cols-2">
            {group.cargos.map((cargo) => {
              const active = cargo.id === selectedId;
              return (
                <button
                  key={cargo.id}
                  type="button"
                  onClick={() => onSelect(cargo.id)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <span className="block font-medium">{cargo.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{cargo.topicCount} tópicos</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
