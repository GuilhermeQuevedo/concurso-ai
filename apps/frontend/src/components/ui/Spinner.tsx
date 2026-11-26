import React from 'react';
import { Spinner as AstryxCoreSpinner } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerShade = 'default' | 'subtle' | 'onMedia' | 'inherit';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Dimensão do indicador
   * sm (10px), md (14px), lg (18px), xl (28px)
   * @default 'md'
   */
  readonly size?: SpinnerSize;
  /**
   * Tom visual e contraste
   * default (destaque/accent), subtle (secundário), onMedia (claro sobre escuro), inherit (herda cor)
   * @default 'default'
   */
  readonly shade?: SpinnerShade;
  /**
   * Rótulo textual visível ou anúncio de acessibilidade
   */
  readonly label?: React.ReactNode;
  /**
   * Descrição de acessibilidade explícita (sobrescreve label para leitores de tela)
   */
  readonly 'aria-label'?: string;
}

const SIZE_MAP: Record<SpinnerSize, { sizeClass: string; stroke: number }> = {
  sm: { sizeClass: 'h-3.5 w-3.5', stroke: 2 },
  md: { sizeClass: 'h-4 w-4', stroke: 2.5 },
  lg: { sizeClass: 'h-5 w-5', stroke: 3 },
  xl: { sizeClass: 'h-7 w-7', stroke: 3.5 },
};

const SHADE_MAP: Record<SpinnerShade, string> = {
  default: 'text-[var(--color-brand-primary,#2E8C82)]',
  subtle: 'text-[var(--color-text-secondary,#64748b)]',
  onMedia: 'text-white',
  inherit: 'text-current',
};

/**
 * Indicador de carregamento / feedback global padronizado.
 * Adota Astryx Spinner sob a flag ASTRYX_FEEDBACK com fallback acessível.
 */
export function Spinner({
  size = 'md',
  shade = 'default',
  label,
  'aria-label': ariaLabel,
  className = '',
  ...rest
}: SpinnerProps) {
  const isAstryxActive = isFeatureEnabled('ASTRYX_FEEDBACK');

  if (isAstryxActive) {
    return (
      <AstryxCoreSpinner
        size={size}
        shade={shade}
        label={label}
        aria-label={ariaLabel}
        className={className}
        {...rest}
      />
    );
  }

  const { sizeClass, stroke } = SIZE_MAP[size] ?? SIZE_MAP.md;
  const shadeClass = SHADE_MAP[shade] ?? SHADE_MAP.default;
  const accessibleLabel = typeof label === 'string' ? label : (ariaLabel ?? 'Carregando...');

  return (
    <span
      role="progressbar"
      aria-label={accessibleLabel}
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${shadeClass} ${className}`}
      {...rest}
    >
      <svg
        className={`animate-spin ${sizeClass}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className="text-sm font-medium">{label}</span>}
    </span>
  );
}
