import { Link } from 'react-router';
import { Menu, Target } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveStudy } from '@/features/active-study/active-study-context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { EngramaWordmark } from '@/components/EngramaWordmark';
import { isFeatureEnabled } from '@/config/feature-flags';
import { AppBreadcrumbs } from './AppBreadcrumbs';

export interface AppHeaderProps {
  readonly onOpenSidebar: () => void;
}

/**
 * Barra superior unificada (Desktop e Mobile) com trilha contextual e atalhos rápidos.
 * Adota tokens Astryx para superfícies, hairlines e acessibilidade Fitts/WCAG AA.
 */
export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
  const { user } = useAuth();
  const { activeContest } = useActiveStudy();
  const isAstryxActive = isFeatureEnabled('ASTRYX_SHELL');

  const headerBorderClass = isAstryxActive
    ? 'border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)]'
    : 'border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white';

  const avatarBg = isAstryxActive
    ? 'bg-[var(--color-brand-primary,#2E8C82)]'
    : 'bg-teal-600';

  return (
    <header
      className={`h-16 shrink-0 flex items-center justify-between px-4 md:px-6 transition-colors duration-fast ease-standard ${headerBorderClass}`}
    >
      {/* Mobile: Botão Menu + Wordmark */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-inherit transition-transform duration-instant ease-standard hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 touch-manipulation"
          aria-label="Abrir menu lateral"
        >
          <Menu size={22} />
        </button>
        <EngramaWordmark logoClass="h-7 w-7" textClass="text-lg text-inherit font-display font-bold" />
      </div>

      {/* Desktop: Trilha de Navegação (Breadcrumbs) */}
      <div className="hidden lg:flex lg:items-center lg:gap-4">
        <AppBreadcrumbs />
      </div>

      {/* Lado Direito: Edital Ativo, Sino e Perfil */}
      <div className="flex items-center gap-3">
        {activeContest && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated-2)] text-[var(--color-text-secondary)]">
            <Target size={13} className="text-[var(--color-brand-primary,#2E8C82)]" />
            <span className="max-w-[140px] truncate">{activeContest.name}</span>
          </div>
        )}

        <NotificationBell />

        <Link
          to="/profile"
          className={`flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full ${avatarBg} text-xs font-bold text-white shadow-xs transition-transform duration-instant active:scale-95 touch-manipulation`}
          aria-label="Acessar perfil de usuário"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Link>
      </div>
    </header>
  );
}
