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
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
    ],
  },
  {
    key: 'study',
    label: 'Estudos',
    icon: GraduationCap,
    items: [
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
      { path: '/achievements', label: 'Conquistas', icon: Trophy },
      { path: '/groups', label: 'Competição', icon: Users },
    ],
  },
];

const bottomItems: NavItem[] = [
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/help', label: 'Ajuda', icon: HelpCircle },
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
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors ${
          indent ? 'pl-9 pr-3' : 'px-3'
        } ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
      >
        <item.icon className="h-4 w-4" />
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-800">
          <Brain className="h-7 w-7 text-primary-600" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">Concurso AI</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {topItems.map((item) => renderItem(item))}

          {navGroups.map((group) => {
            const isOpen = expanded.includes(group.key);
            const hasActive = group.items.some((i) => i.path === location.pathname);
            return (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    hasActive && !isOpen
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-5 w-5" />
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => renderItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
            {bottomItems.map((item) => renderItem(item))}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-400">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Brain className="h-6 w-6 text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-white">Concurso AI</span>
        </header>

        <main className="flex-1 p-6">{children}</main>

        {location.pathname !== '/help' && (
          <Link
            to="/help"
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
