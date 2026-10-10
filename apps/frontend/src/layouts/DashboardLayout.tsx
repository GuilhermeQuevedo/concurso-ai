import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  Building2,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Layers,
  Trophy,
  CalendarDays,
  Users,
  HelpCircle,
  PenLine,
  Target,
  CalendarClock,
  ChevronDown,
  GraduationCap,
  Library,
  TrendingUp,
  ShieldCheck,
  Contact,
  LayoutGrid,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTour } from '@/features/tour/useTour';
import { useReviewNotifications } from '@/features/notifications/useReviewNotifications';
import { EngramaLogo } from '@/components/EngramaLogo';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
];

const navGroups: NavGroup[] = [
  {
    key: 'planning',
    label: 'Planejamento',
    icon: Target,
    items: [
      { path: '/contests', label: 'Meus Concursos', icon: Target },
      { path: '/calendar', label: 'Calendário', icon: CalendarClock },
      { path: '/study-plan', label: 'Plano de Estudos', icon: CalendarDays },
      { path: '/board', label: 'Quadro (Kanban)', icon: LayoutGrid },
    ],
  },
  {
    key: 'study',
    label: 'Estudos',
    icon: GraduationCap,
    items: [
      { path: '/study-kit', label: 'Gerar com IA (PDF)', icon: Sparkles },
      { path: '/generate', label: 'Gerar Questões', icon: Sparkles },
      { path: '/essays', label: 'Redações', icon: PenLine },
      { path: '/flashcards', label: 'Flashcards', icon: Layers },
      { path: '/documents', label: 'Documentos', icon: FileText },
    ],
  },
  {
    key: 'library',
    label: 'Biblioteca',
    icon: Library,
    items: [
      { path: '/subjects', label: 'Disciplinas', icon: BookOpen },
      { path: '/exam-boards', label: 'Bancas', icon: Building2 },
    ],
  },
  {
    key: 'progress',
    label: 'Progresso',
    icon: TrendingUp,
    items: [
      { path: '/stats', label: 'Estatísticas', icon: BarChart3 },
      { path: '/memory-simulator', label: 'Simulador de Memória', icon: Brain },
      { path: '/achievements', label: 'Conquistas', icon: Trophy },
      { path: '/groups', label: 'Competição', icon: Users },
    ],
  },
];

const bottomItems: NavItem[] = [
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/help', label: 'Ajuda', icon: HelpCircle },
  { path: '/metodologia', label: 'Metodologia', icon: FlaskConical },
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
    return (
      <Link
        key={item.path}
        to={item.path}
        data-tour={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
          indent ? 'pl-7 pr-3' : 'px-3'
        } ${
          isActive
            ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-white'
        }`}
      >
        <item.icon
          className={`h-[18px] w-[18px] shrink-0 ${
            isActive
              ? 'text-white'
              : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
          }`}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen || tourActive ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5 dark:border-gray-800">
          <EngramaLogo className="h-9 w-9 shrink-0 rounded-xl shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">engrama</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {topItems.map((item) => renderItem(item))}
          {user?.role === 'ADMIN' && renderItem({ path: '/admin', label: 'Administração', icon: ShieldCheck })}
          {user?.role === 'ADMIN' && renderItem({ path: '/admin/contatos', label: 'Possíveis Clientes', icon: Contact })}

          {navGroups.map((group) => {
            const isOpen = expanded.includes(group.key) || tourActive;
            const hasActive = group.items.some((i) => i.path === location.pathname);
            return (
              <div key={group.key} className="pt-2">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{group.label}</span>
                    {hasActive && !isOpen && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-gray-100 pl-2 dark:border-gray-800/80">
                    {group.items.map((item) => renderItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
            {bottomItems.map((item) => renderItem(item))}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-400">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <EngramaLogo className="h-6 w-6 text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-white">engrama</span>
        </header>

        <main className="flex-1 p-6">{children}</main>

        {location.pathname !== '/help' && (
          <Link
            to="/help"
            data-tour="help"
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-primary-700"
            title="Ajuda"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
