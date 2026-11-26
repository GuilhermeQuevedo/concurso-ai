import React from 'react';
import { EmptyState as AstryxCoreEmptyState } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Título principal indicando a ausência de itens
   */
  readonly title: string;
  /**
   * Descrição secundária ou instrução de próximo passo
   */
  readonly description?: string;
  /**
   * Ícone ou ilustração decorativa (aria-hidden automático)
   */
  readonly icon?: React.ReactNode;
  /**
   * Botões de ação contextual (ex.: "Criar primeiro item")
   */
  readonly actions?: React.ReactNode;
  /**
   * Nível hierárquico do cabeçalho semântico (h1 a h6)
   * @default 3
   */
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Variante compacta para contêineres menores (drawers, popovers, sidebars)
   * @default false
   */
  readonly isCompact?: boolean;
}

/**
 * Componente padronizado para estados vazios (Empty States).
 * Adota Astryx EmptyState sob a flag ASTRYX_FEEDBACK com fallback semântico.
 */
export function EmptyState({
  title,
  description,
  icon,
  actions,
  headingLevel = 3,
  isCompact = false,
  className = '',
  ...rest
}: EmptyStateProps) {
  const isAstryxActive = isFeatureEnabled('ASTRYX_FEEDBACK');

  if (isAstryxActive) {
    return (
      <AstryxCoreEmptyState
        title={title}
        description={description}
        icon={icon}
        actions={actions}
        headingLevel={headingLevel}
        isCompact={isCompact}
        className={className}
        {...rest}
      />
    );
  }

  const HeadingTag = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const paddingClass = isCompact ? 'py-4 px-3 gap-2' : 'py-8 px-6 gap-3';
  const titleClass = isCompact ? 'text-sm font-semibold' : 'text-base font-semibold';
  const descClass = isCompact ? 'text-xs' : 'text-sm';

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${paddingClass} ${className}`}
      {...rest}
    >
      {icon && (
        <div className="mb-1 text-[var(--color-text-secondary,#64748b)]" aria-hidden="true">
          {icon}
        </div>
      )}
      <HeadingTag className={`${titleClass} text-[var(--color-text-primary,#0f172a)] dark:text-white`}>
        {title}
      </HeadingTag>
      {description && (
        <p className={`${descClass} max-w-sm text-[var(--color-text-secondary,#64748b)] dark:text-gray-400`}>
          {description}
        </p>
      )}
      {actions && (
        <div className={`mt-2 flex items-center gap-2 ${isCompact ? 'flex-col' : 'flex-row'}`}>
          {actions}
        </div>
      )}
    </div>
  );
}
