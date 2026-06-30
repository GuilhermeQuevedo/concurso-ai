import { useState } from 'react';
import { Settings, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function SettingsPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gerencie sua conta e preferências
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Perfil</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nome</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Membro desde</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Aparência</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Modo escuro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Alterna entre tema claro e escuro
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform shadow-sm ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {darkMode ? (
                  <Moon className="h-3 w-3 text-primary-600" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Sobre</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Versão</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">IA</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Google Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
