import { useLocation, Link } from 'react-router';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';

interface RouteMeta {
  readonly section: string;
  readonly label: string;
}

const ROUTE_MAP: Record<string, RouteMeta> = {
  '/dashboard': { section: 'Geral', label: 'Visão Geral' },
  '/mapa': { section: 'Planejamento', label: 'Mapa de Revisão' },
  '/contests': { section: 'Planejamento', label: 'Meus Editais' },
  '/calendar': { section: 'Planejamento', label: 'Calendário' },
  '/cronograma': { section: 'Planejamento', label: 'Cronograma' },
  '/study-plan': { section: 'Planejamento', label: 'Cronograma' },
  '/generate': { section: 'Estudos', label: 'Questões' },
  '/exam-slicer': { section: 'Estudos', label: 'Provas Comentadas' },
  '/error-notebook': { section: 'Estudos', label: 'Caderno de Erros' },
  '/flashcards': { section: 'Estudos', label: 'Flashcards' },
  '/games': { section: 'Estudos', label: 'Jogos' },
  '/documents': { section: 'Estudos', label: 'Documentos' },
  '/stats': { section: 'Progresso', label: 'Estatísticas' },
  '/memory-simulator': { section: 'Progresso', label: 'Simulador de Memória' },
  '/achievements': { section: 'Progresso', label: 'Conquistas' },
  '/rankings': { section: 'Progresso', label: 'Ranking Global' },
  '/groups': { section: 'Progresso', label: 'Competição' },
  '/friends': { section: 'Progresso', label: 'Amigos' },
  '/settings': { section: 'Ajustes', label: 'Configurações' },
  '/profile': { section: 'Ajustes', label: 'Meu Perfil' },
  '/admin': { section: 'Administração', label: 'Painel Geral' },
  '/admin/contatos': { section: 'Administração', label: 'Possíveis Clientes' },
  '/help': { section: 'Suporte', label: 'Ajuda' },
};

/**
 * Trilha de navegação contextual (Breadcrumbs) integrada ao Shell.
 * Utiliza @astryxdesign/core Breadcrumbs sob a flag ASTRYX_SHELL.
 */
export function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const isAstryxActive = isFeatureEnabled('ASTRYX_SHELL');

  const meta = ROUTE_MAP[pathname];

  if (!meta) {
    return null;
  }

  const isHome = pathname === '/dashboard';

  if (isAstryxActive) {
    return (
      <Breadcrumbs label="Trilha de navegação" variant="supporting">
        <BreadcrumbItem href="/dashboard">Início</BreadcrumbItem>
        {!isHome && <BreadcrumbItem href="#">{meta.section}</BreadcrumbItem>}
        {!isHome && <BreadcrumbItem isCurrent={true}>{meta.label}</BreadcrumbItem>}
      </Breadcrumbs>
    );
  }

  return (
    <nav aria-label="Trilha de navegação" className="flex items-center text-xs text-gray-500 dark:text-gray-400">
      <ol className="flex items-center gap-1.5 list-none m-0 p-0">
        <li>
          <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Início
          </Link>
        </li>
        {!isHome && (
          <>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li>{meta.section}</li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li aria-current="page" className="font-semibold text-gray-900 dark:text-white">
              {meta.label}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
