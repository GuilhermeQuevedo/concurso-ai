import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ActiveStudyProvider } from '@/features/active-study/ActiveStudyProvider';
import { ActiveStudySelector } from '@/features/active-study/ActiveStudySelector';
import { AccountMenu } from './AccountMenu';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { SidebarReminders } from '@/features/reminders/components/SidebarReminders';
import { PomodoroMini } from '@/features/pomodoro/PomodoroMini';
import {
  ChevronDown,
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import {
  DashboardIcon,
  TargetIcon,
  CronogramaIcon,
  LayersIcon,
  AwardIcon,
  MedalIcon,
  ShieldIcon,
  SimuladosIcon,
  ProvasComentadasIcon,
  ClockIcon,
  FlashcardsIcon,
  FlameIcon,
  BookOpenIcon,
  UserIcon,
  SettingsIcon,
  HelpCircleIcon,
  BeakerIcon,
  ContactIcon,
  GamepadIcon,
} from '@/components/icons/EngramaIcons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTour } from '@/features/tour/useTour';
import { useReviewNotifications } from '@/features/notifications/useReviewNotifications';
import { EngramaWordmark } from '@/components/EngramaWordmark';
import { StripeBillingModal } from '@/features/subscription/components/StripeBillingModal';
import { isFeatureEnabled } from '@/config/feature-flags';
import { AppHeader } from './AppHeader';

type IconComponent = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | LucideIcon;

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconComponent;
}

interface NavGroup {
  readonly key: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly items: NavItem[];
}

const topItems: readonly NavItem[] = [
  { path: '/dashboard', label: 'Visão Geral', icon: DashboardIcon },
];

const navGroups: readonly NavGroup[] = [
  {
    key: 'planning',
    label: 'Planejamento',
    icon: TargetIcon,
    items: [
      { path: '/contests', label: 'Meus Editais', icon: TargetIcon },
      { path: '/mapa', label: 'Mapa de Revisão', icon: LayersIcon },
      { path: '/calendar', label: 'Calendário', icon: ClockIcon },
      { path: '/cronograma', label: 'Cronograma', icon: CronogramaIcon },
    ],
  },
  {
    key: 'study',
    label: 'Estudos',
    icon: ProvasComentadasIcon,
    items: [
      { path: '/generate', label: 'Questões', icon: SimuladosIcon },
      { path: '/exam-slicer', label: 'Provas Comentadas', icon: ProvasComentadasIcon },
      { path: '/error-notebook', label: 'Caderno de Erros', icon: BookOpenIcon },
      { path: '/flashcards', label: 'Flashcards', icon: FlashcardsIcon },
      { path: '/games', label: 'Jogos', icon: GamepadIcon },
      { path: '/documents', label: 'Documentos', icon: LayersIcon },
    ],
  },
  {
    key: 'progress',
    label: 'Progresso',
    icon: AwardIcon,
    items: [
      { path: '/stats', label: 'Estatísticas', icon: DashboardIcon },
      { path: '/memory-simulator', label: 'Simulador de Memória', icon: ClockIcon },
      { path: '/achievements', label: 'Conquistas', icon: AwardIcon },
      { path: '/rankings', label: 'Ranking Global', icon: MedalIcon },
      { path: '/groups', label: 'Competição', icon: FlameIcon },
      { path: '/friends', label: 'Amigos', icon: ContactIcon },
    ],
  },
];

const bottomItems: readonly NavItem[] = [
  { path: '/profile', label: 'Perfil', icon: UserIcon },
  { path: '/settings', label: 'Configurações', icon: SettingsIcon },
  { path: '/help', label: 'Ajuda', icon: HelpCircleIcon },
  { path: '/metodologia', label: 'Metodologia', icon: BeakerIcon },
];

const STORAGE_KEY = 'nav-expanded-groups';

function loadExpanded(pathname: string): string[] {
  const active = navGroups.find((g) => g.items.some((i) => i.path === pathname));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
    return active && !saved.includes(active.key) ? [...saved, active.key] : saved;
  } catch {
    return active ? [active.key] : [];
  }
}

export function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ActiveStudyProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ActiveStudyProvider>
  );
}

function DashboardLayoutContent({ children }: { readonly children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { active: tourActive } = useTour();
  useReviewNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(() => loadExpanded(location.pathname));
  const [billingModalOpen, setBillingModalOpen] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('subscribe') : false,
  );

  useEffect(() => {
    if (new URLSearchParams(location.search).has('subscribe')) {
      setBillingModalOpen(true);
    }
  }, [location.search]);

  // Abre automaticamente o grupo ativo quando a rota mudar
  useEffect(() => {
    const activeGroup = navGroups.find((g) =>
      g.items.some(
        (i) => i.path === location.pathname || (i.path === '/cronograma' && location.pathname === '/study-plan'),
      ),
    );
    if (activeGroup && !expanded.includes(activeGroup.key)) {
      setExpanded((prev) => {
        const next = [...prev, activeGroup.key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname]);

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderItem = (item: NavItem, indent = false) => {
    const isActive =
      location.pathname === item.path ||
      (item.path === '/cronograma' && location.pathname === '/study-plan');
    const IconComp = item.icon;
    const isAstryxActive = isFeatureEnabled('ASTRYX_SHELL');

    const activeBgClass = isAstryxActive
      ? 'bg-[var(--color-brand-primary,#2E8C82)]/15 text-white font-semibold'
      : 'bg-teal-600/20 text-white font-semibold';
    const activeTextClass = isAstryxActive
      ? 'text-[var(--color-brand-primary,#2E8C82)]'
      : 'text-teal-400';
    const activeBarClass = isAstryxActive
      ? 'bg-[var(--color-brand-primary,#2E8C82)] shadow-[0_0_8px_rgba(46,140,130,0.7)]'
      : 'bg-teal-400 shadow-[0_0_8px_rgba(46,140,130,0.7)]';

    return (
      <Link
        key={item.path}
        to={item.path}
        data-tour={item.path}
        onClick={() => setSidebarOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex w-full max-w-full box-border items-center gap-2.5 rounded-xl py-2 min-h-[40px] text-sm font-medium transition-colors duration-fast ease-standard overflow-hidden select-none touch-manipulation active:scale-[0.99] motion-reduce:active:scale-100 ${
          indent ? 'pl-7 pr-2.5' : 'px-3'
        } ${isActive ? activeBgClass : 'text-white/70 hover:bg-white/8 hover:text-white'}`}
      >
        {/* Barra Ativa Lateral Verde Engrama com Staging Refinado */}
        {isActive && (
          <span className={`absolute left-0.5 top-2 bottom-2 w-1 rounded-r-full ${activeBarClass}`} />
        )}
        <span
          className={`shrink-0 transition-colors duration-fast ease-standard ${
            isActive ? activeTextClass : 'text-white/50 group-hover:text-white/90'
          }`}
        >
          <IconComp size={18} strokeWidth={isActive ? 2 : 1.75} />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  const isAstryxActive = isFeatureEnabled('ASTRYX_SHELL');
  const containerClass = isAstryxActive
    ? 'astryx-theme bg-[var(--color-canvas)] text-[var(--color-text-primary)]'
    : 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100';

  return (
    <div className={`flex min-h-screen font-body overflow-x-clip ${containerClass}`}>
      {/* Skip Link para Acessibilidade Teclado / Leitores de Tela */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-brand-primary,#2E8C82)] focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      {/* Mobile Backdrop com Staging suave (fade-in) */}
      {sidebarOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-fast ease-standard lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar com estilo Flashcards-Inteligentes (Deep Ink + Verde Engrama) */}
      <aside
        aria-label="Navegação principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r ${
          isAstryxActive ? 'border-[var(--color-border-subtle)]' : 'border-white/8'
        } bg-[#121A33] text-white overflow-x-hidden transition-transform duration-base ease-standard lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen || tourActive ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Topo / Logo */}
        <div
          className={`relative flex h-16 shrink-0 items-center justify-between border-b ${
            isAstryxActive ? 'border-[var(--color-border-subtle)]' : 'border-white/8'
          } px-5`}
        >
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
            <EngramaWordmark logoClass="h-7 w-7" textClass="text-xl font-display font-extrabold text-white" />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-lg p-1 text-white/60 hover:text-white active:scale-95 touch-manipulation lg:hidden"
                aria-label="Fechar menu lateral"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <ActiveStudySelector />

        {/* Navegação com Mecanismo de Sub-Abas Expansíveis e Scroll Limpo */}
        <nav
          className={`sidebar-nav flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 ${
            isAstryxActive ? 'scroll-mask-y' : ''
          }`}
        >
          {topItems.map((item) => renderItem(item))}

          {/* Área Administrativa */}
          {user?.role === 'ADMIN' && (
            <div
              className={`mt-2 border-b ${
                isAstryxActive ? 'border-[var(--color-border-subtle)]' : 'border-white/8'
              } pb-2`}
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                Administração
              </div>
              {renderItem({ path: '/admin', label: 'Painel Geral', icon: ShieldIcon })}
              {renderItem({ path: '/admin/contatos', label: 'Possíveis Clientes', icon: ContactIcon })}
            </div>
          )}

          {/* Grupos Expansíveis */}
          {navGroups.map((group) => {
            const isOpen = expanded.includes(group.key) || tourActive;
            const hasActive = group.items.some(
              (i) => i.path === location.pathname || (i.path === '/cronograma' && location.pathname === '/study-plan'),
            );
            const GroupIcon = group.icon;

            return (
              <div key={group.key} className="pt-2 w-full max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                  className="flex w-full max-w-full box-border min-h-[38px] items-center justify-between rounded-lg px-3 py-1.5 text-white/60 transition-colors duration-fast ease-standard hover:bg-white/6 hover:text-white/95 overflow-hidden active:scale-[0.99] touch-manipulation"
                >
                  <span className="flex min-w-0 items-center gap-2.5 truncate">
                    <span className="shrink-0 text-white/45">
                      <GroupIcon size={16} />
                    </span>
                    <span className="truncate text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {group.label}
                    </span>
                    {hasActive && !isOpen && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-primary,#2E8C82)] shadow-[0_0_6px_rgba(46,140,130,0.8)]" />
                    )}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-fast ease-standard ${
                      isOpen ? 'rotate-180 text-white/80' : ''
                    }`}
                  />
                </button>

                {/* Sub-Abas com Guia Vertical e Indentação */}
                {isOpen && (
                  <div
                    className={`mt-1 space-y-0.5 border-l ${
                      isAstryxActive ? 'border-[var(--color-border-subtle)]' : 'border-white/10'
                    } pl-1 w-full max-w-full overflow-hidden animate-in fade-in duration-fast ease-standard`}
                  >
                    {group.items.map((item) => renderItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}

          <SidebarReminders />
        </nav>

        <div className="shrink-0 px-2.5 pb-2">
          <AccountMenu items={bottomItems} onNavigate={() => setSidebarOpen(false)} onOpenBilling={() => setBillingModalOpen(true)} />
        </div>

        {/* Rodapé da Barra Lateral com Perfil */}
        <div
          className={`shrink-0 border-t ${
            isAstryxActive ? 'border-[var(--color-border-subtle)]' : 'border-white/8'
          } bg-black/15 p-3 overflow-hidden`}
        >
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="mb-2 flex w-full max-w-full items-center gap-3 rounded-xl px-2 py-2 min-h-[44px] transition-colors duration-fast ease-standard hover:bg-white/6 overflow-hidden active:scale-[0.99] touch-manipulation"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-primary,#2E8C82)] to-[oklch(0.38_0.075_188)] text-sm font-bold text-white shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
                {user?.role === 'ADMIN' && (
                  <span className="shrink-0 rounded-xs bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-400">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-white/50">{user?.email}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 min-h-[38px] text-xs font-medium text-white/55 transition-colors duration-fast ease-standard hover:bg-red-500/15 hover:text-red-300 overflow-hidden active:scale-[0.99] touch-manipulation"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="truncate">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        {/* Barra Superior Unificada (Desktop Breadcrumbs + Mobile Drawer) */}
        <AppHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Conteúdo da Tela */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 outline-none">
          {children}
        </main>

        <PomodoroMini />

        {/* Botão Flutuante de Ajuda (Fitts & Squash and Stretch) */}
        {location.pathname !== '/help' && location.pathname !== '/study' && (
          <Link
            to="/help"
            data-tour="help"
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform duration-fast ease-standard hover:scale-105 active:scale-95 hover:bg-teal-700 touch-manipulation motion-reduce:active:scale-100"
            title="Ajuda & Metodologia"
            aria-label="Ajuda e metodologia"
          >
            <HelpCircleIcon size={22} />
          </Link>
        )}

        {/* Modal de Assinatura */}
        {billingModalOpen && (
          <StripeBillingModal onClose={() => setBillingModalOpen(false)} />
        )}
      </div>
    </div>
  );
}
