import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  ChevronDown,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import {
  DashboardIcon,
  TargetIcon,
  CronogramaIcon,
  LayersIcon,
  MapaEditalIcon,
  AwardIcon,
  MedalIcon,
  ShieldIcon,
  SimuladosIcon,
  ProvasComentadasIcon,
  CheckCircleIcon,
  ClockIcon,
  FlashcardsIcon,
  FlameIcon,
  BookOpenIcon,
  BuildingIcon,
  UserIcon,
  SettingsIcon,
  HelpCircleIcon,
  BeakerIcon,
  CreditCardIcon,
  ContactIcon,
  GamepadIcon,
} from '@/components/icons/EngramaIcons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTour } from '@/features/tour/useTour';
import { useReviewNotifications } from '@/features/notifications/useReviewNotifications';
import { EngramaWordmark } from '@/components/EngramaWordmark';
import { StripeBillingModal } from '@/features/subscription/components/StripeBillingModal';

type IconComponent = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | LucideIcon;

interface NavItem {
  path: string;
  label: string;
  icon: IconComponent;
}

interface NavGroup {
  key: string;
  label: string;
  icon: IconComponent;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { path: '/dashboard', label: 'Visão Geral', icon: DashboardIcon },
];

const navGroups: NavGroup[] = [
  {
    key: 'planning',
    label: 'Planejamento',
    icon: TargetIcon,
    items: [
      { path: '/contests', label: 'Meus Objetivos', icon: TargetIcon },
      { path: '/calendar', label: 'Calendário', icon: ClockIcon },
      { path: '/study-plan', label: 'Plano de Estudos', icon: CronogramaIcon },
      { path: '/board', label: 'Quadro (Kanban)', icon: MapaEditalIcon },
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
      { path: '/essays', label: 'Redações', icon: CheckCircleIcon },
      { path: '/flashcards', label: 'Flashcards', icon: FlashcardsIcon },
      { path: '/games', label: 'Jogos', icon: GamepadIcon },
      { path: '/documents', label: 'Documentos', icon: LayersIcon },
    ],
  },
  {
    key: 'library',
    label: 'Biblioteca',
    icon: LayersIcon,
    items: [
      { path: '/subjects', label: 'Disciplinas', icon: BookOpenIcon },
      { path: '/exam-boards', label: 'Bancas', icon: BuildingIcon },
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
    ],
  },
];

const bottomItems: NavItem[] = [
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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { active: tourActive } = useTour();
  useReviewNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(() => loadExpanded(location.pathname));
  const [billingModalOpen, setBillingModalOpen] = useState(() =>
    new URLSearchParams(window.location.search).has('subscribe'),
  );

  useEffect(() => {
    if (new URLSearchParams(location.search).has('subscribe')) {
      setBillingModalOpen(true);
    }
  }, [location.search]);

  // Abre automaticamente o grupo ativo quando a rota mudar
  useEffect(() => {
    const activeGroup = navGroups.find((g) => g.items.some((i) => i.path === location.pathname));
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
    const isActive = location.pathname === item.path;
    const IconComp = item.icon;

    return (
      <Link
        key={item.path}
        to={item.path}
        data-tour={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`group relative flex w-full max-w-full box-border items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-all overflow-hidden ${
          indent ? 'pl-7 pr-2.5' : 'px-3'
        } ${
          isActive
            ? 'bg-teal-600/15 text-white font-semibold'
            : 'text-white/65 hover:bg-white/6 hover:text-white'
        }`}
      >
        {/* Barra Ativa Lateral Verde Engrama */}
        {isActive && (
          <span className="absolute left-0.5 top-2 bottom-2 w-1 rounded-r-full bg-teal-400 shadow-[0_0_8px_rgba(46,140,130,0.6)]" />
        )}
        <span
          className={`shrink-0 transition-colors ${
            isActive ? 'text-teal-400' : 'text-white/50 group-hover:text-white/80'
          }`}
        >
          <IconComp size={18} />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-body text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-x-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar com estilo Flashcards-Inteligentes (Deep Ink + Verde Engrama) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/8 bg-[#121A33] text-white overflow-x-hidden transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen || tourActive ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Topo / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-5">
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
            <EngramaWordmark logoClass="h-7 w-7" textClass="text-xl font-display font-extrabold text-white" />
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-white/60 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navegação com Mecanismo de Sub-Abas Expansíveis e Scroll Limpo */}
        <nav className="sidebar-nav flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2.5 py-4">
          {topItems.map((item) => renderItem(item))}

          {/* Área Administrativa */}
          {user?.role === 'ADMIN' && (
            <div className="mt-2 border-b border-white/8 pb-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                Administração
              </div>
              {renderItem({ path: '/admin', label: 'Painel Geral', icon: ShieldIcon })}
              {renderItem({ path: '/admin/contatos', label: 'Possíveis Clientes', icon: ContactIcon })}
            </div>
          )}

          {/* Grupos Expansíveis (Acordeão como estava antes) */}
          {navGroups.map((group) => {
            const isOpen = expanded.includes(group.key) || tourActive;
            const hasActive = group.items.some((i) => i.path === location.pathname);
            const GroupIcon = group.icon;

            return (
              <div key={group.key} className="pt-2 w-full max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full max-w-full box-border items-center justify-between rounded-lg px-3 py-1.5 text-white/55 transition-colors hover:bg-white/5 hover:text-white/90 overflow-hidden"
                >
                  <span className="flex min-w-0 items-center gap-2.5 truncate">
                    <span className="shrink-0 text-white/40">
                      <GroupIcon size={16} />
                    </span>
                    <span className="truncate text-[11px] font-bold uppercase tracking-wider text-white/60">
                      {group.label}
                    </span>
                    {hasActive && !isOpen && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(46,140,130,0.8)]" />
                    )}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white/80' : ''
                    }`}
                  />
                </button>

                {/* Sub-Abas com Guia Vertical e Indentação */}
                {isOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-white/10 pl-1 w-full max-w-full overflow-hidden">
                    {group.items.map((item) => renderItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Links de Suporte e Conta */}
          <div className="mt-4 border-t border-white/8 pt-3">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 truncate">
              Conta & Ajustes
            </div>
            {bottomItems.map((item) => renderItem(item))}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setBillingModalOpen(true);
              }}
              className="group relative flex w-full max-w-full box-border items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition-all hover:bg-white/6 hover:text-white overflow-hidden"
            >
              <CreditCardIcon size={18} className="shrink-0 text-white/50 group-hover:text-white/80" />
              <span className="min-w-0 flex-1 truncate">Assinatura & Planos</span>
            </button>
          </div>
        </nav>

        {/* Rodapé da Barra Lateral com Perfil */}
        <div className="shrink-0 border-t border-white/8 bg-black/15 p-3 overflow-hidden">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="mb-2 flex w-full max-w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/6 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white shadow-xs">
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
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/55 transition-colors hover:bg-red-500/15 hover:text-red-300 overflow-hidden"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="truncate">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Barra Superior Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label="Abrir menu lateral"
          >
            <Menu size={22} />
          </button>
          <EngramaWordmark logoClass="h-7 w-7" textClass="text-lg text-slate-900 dark:text-white" />
          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Link>
        </header>

        {/* Conteúdo da Tela */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>

        {/* Botão Flutuante de Ajuda */}
        {location.pathname !== '/help' && location.pathname !== '/study' && (
          <Link
            to="/help"
            data-tour="help"
            className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-700"
            title="Ajuda & Metodologia"
          >
            <HelpCircleIcon size={20} />
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
