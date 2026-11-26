import { useState } from 'react';
import { Settings, User, Moon, Sun, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NotificationsCard } from '@/features/notifications/NotificationsCard';
import { PrivacySettingsCard } from '@/features/auth/components/PrivacySettingsCard';
import { isFeatureEnabled } from '@/config/feature-flags';

export function SettingsPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  const isAstryxSettings = isFeatureEnabled('ASTRYX_SETTINGS');

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  return (
    <div
      data-astryx-theme={isAstryxSettings ? 'engrama' : undefined}
      className={isAstryxSettings ? 'text-[var(--color-text-primary)] space-y-6' : ''}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Configurações
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Gerencie sua conta, preferências visuais e privacidade
        </p>
      </div>

      <div className="space-y-4">
        {/* Card Perfil */}
        <div
          className={
            isAstryxSettings
              ? 'rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-5 text-[var(--color-text-primary)] shadow-xs transition-colors'
              : 'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900'
          }
        >
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--color-brand,#2E8C82)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Perfil</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Nome</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Membro desde</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Aparência */}
        <div
          className={
            isAstryxSettings
              ? 'rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-5 text-[var(--color-text-primary)] shadow-xs transition-colors'
              : 'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900'
          }
        >
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-[var(--color-brand,#2E8C82)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Aparência</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Modo escuro</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Alterna entre tema claro e escuro (profundidade em OKLCH)
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              role="switch"
              aria-checked={darkMode}
              aria-label="Alternar modo escuro"
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-brand,#2E8C82)] ${
                darkMode ? 'bg-[var(--color-brand,#2E8C82)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform shadow-xs ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {darkMode ? (
                  <Moon className="h-3 w-3 text-[var(--color-brand,#2E8C82)]" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>

        <NotificationsCard />

        <PrivacySettingsCard />

        {/* Card Sobre */}
        <div
          className={
            isAstryxSettings
              ? 'rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-5 text-[var(--color-text-primary)] shadow-xs transition-colors'
              : 'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900'
          }
        >
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-[var(--color-brand,#2E8C82)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Sobre</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Versão</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">IA</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">OpenAI (ChatGPT)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
