import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  onClick?: () => void;
}

// O último item é o lugar atual; os anteriores voltam um nível.
export function PresetBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Caminho" className="flex flex-wrap items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <span key={crumb.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {last || !crumb.onClick ? (
              <span className="font-semibold text-gray-900 dark:text-white">{crumb.label}</span>
            ) : (
              <button type="button" onClick={crumb.onClick} className="text-primary-600 hover:underline dark:text-primary-400">
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
