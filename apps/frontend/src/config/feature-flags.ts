/**
 * Feature Flags da Plataforma Concurso-AI / Engrama
 * Suporta reversibilidade granular de adoção de novos componentes e design system (Astryx).
 */

export interface FeatureFlags {
  /** Flag mestre para habilitar componentes e camada de tema do Astryx */
  readonly ASTRYX_ENABLED: boolean;
  /** Habilita a rota /dev/design-lab para inspeção e testes visuais (apenas DEV) */
  readonly ASTRYX_DEV_LAB: boolean;
  /** Fase 2: Chrome ao redor do mapa mental (filtros, painel de revisão, legendas) */
  readonly ASTRYX_MAP_CHROME: boolean;
  /** Fase 3: Telas de autenticação (Login, Cadastro, Recuperação) */
  readonly ASTRYX_AUTH: boolean;
  /** Fase 3: Configurações, Aparência e Privacidade / DSAR (LGPD) */
  readonly ASTRYX_SETTINGS: boolean;
  /** Fase 3: Feedback Global & Notificações (Toast, Spinner, EmptyState) */
  readonly ASTRYX_FEEDBACK: boolean;
  /** Fase 4: Layout & Shell (DashboardLayout, SideNav, TopNav, AccountMenu) */
  readonly ASTRYX_SHELL: boolean;
  /** Fase posterior: Dashboard e estatísticas */
  readonly ASTRYX_DASHBOARD: boolean;
  /** Fase posterior: Área de questões e simulados */
  readonly ASTRYX_STUDY: boolean;
}

const isDev = typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.DEV) : process.env.NODE_ENV !== 'production';

export const FEATURE_FLAGS: FeatureFlags = {
  ASTRYX_ENABLED: isDev,
  ASTRYX_DEV_LAB: isDev,
  ASTRYX_MAP_CHROME: true,
  ASTRYX_AUTH: true,
  ASTRYX_SETTINGS: true,
  ASTRYX_FEEDBACK: true,
  ASTRYX_SHELL: true,
  ASTRYX_DASHBOARD: true,
  ASTRYX_STUDY: true,
};

/**
 * Hook ou helper utilitário para checagem rápida de flags
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
