import type { PresetCatalog } from '../services/preset-edital.service';

interface PresetCargoListProps {
  groups: PresetCatalog['groups'];
  selectedId: string | null;
  onSelect: (cargoId: string) => void;
  showTitles: boolean;
}

/**
 * Lista de opções de cargos disponíveis com alvos de toque ergonômicos e estado ativo Verde-Revisão.
 */
export function PresetCargoList({ groups, selectedId, onSelect, showTitles }: PresetCargoListProps) {
  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
        Nenhum cargo encontrado para a busca informada.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.name}>
          {showTitles && (
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {group.name}
            </h3>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {group.cargos.map((cargo) => {
              const active = cargo.id === selectedId;
              return (
                <button
                  key={cargo.id}
                  type="button"
                  onClick={() => onSelect(cargo.id)}
                  aria-pressed={active}
                  className={`min-h-[44px] rounded-xl border p-3.5 text-left text-sm transition-all duration-fast touch-manipulation cursor-pointer active:scale-[0.99] ${
                    active
                      ? 'border-[#2E8C82] bg-[#2E8C82]/10 text-[#1b5e56] ring-1 ring-[#2E8C82] dark:border-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="block font-bold leading-snug">{cargo.name}</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    {cargo.topicCount} tópicos programáticos
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
