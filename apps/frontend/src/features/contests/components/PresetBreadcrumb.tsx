import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export interface PresetBreadcrumbProps {
  crumbs: Crumb[];
}

/**
 * Breadcrumb de navegação do assistente de editais com tokens Astryx.
 */
export function PresetBreadcrumb({ crumbs }: PresetBreadcrumbProps) {
  return (
    <nav aria-label="Navegação estrutural do edital" className="flex flex-wrap items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            {isLast || !crumb.onClick ? (
              <span className="font-bold text-slate-900 dark:text-white" aria-current={isLast ? 'page' : undefined}>
                {crumb.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={crumb.onClick}
                className="font-medium text-[#2E8C82] transition-colors hover:underline dark:text-[#52b3a8] cursor-pointer"
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
