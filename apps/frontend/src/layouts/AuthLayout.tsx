import React from 'react';
import { Link } from 'react-router';
import { EngramaWordmark } from '@/components/EngramaWordmark';
import { isFeatureEnabled } from '@/config/feature-flags';

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  readonly children?: React.ReactNode;
  readonly title: string;
  readonly subtitle: string;
}) {
  const isAstryxAuth = isFeatureEnabled('ASTRYX_AUTH');

  return (
    <div
      data-astryx-theme={isAstryxAuth ? 'engrama' : undefined}
      className={
        isAstryxAuth
          ? 'flex min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)] transition-colors'
          : 'flex min-h-screen'
      }
    >
      {/* Coluna Esquerda: Marca e Identidade Cósmica (Desktop) */}
      <div
        className={
          isAstryxAuth
            ? 'hidden w-1/2 items-center justify-center bg-gradient-brand-oklch lg:flex p-12'
            : 'hidden w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 lg:flex'
        }
      >
        <div className="max-w-md text-center text-white space-y-4">
          <EngramaWordmark logoClass="h-14 w-14" textClass="text-5xl" className="mb-4 inline-flex" />
          <p className="text-xl font-semibold tracking-tight text-white/95">
            O que você estuda, fica.
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Engrama é a marca que uma experiência grava no cérebro. Aqui, a ciência da memória — repetição espaçada, recordação ativa e elaboração — transforma seu estudo em aprovação.
          </p>
        </div>
      </div>

      {/* Coluna Direita: Formulário */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <EngramaWordmark logoClass="h-8 w-8" textClass="text-xl text-[var(--color-text-primary)]" />
          </div>

          <h2 className="mb-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="mb-8 text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>

          {children}

          <div className="mt-8 pt-6 border-t border-hairline text-center text-xs text-[var(--color-text-tertiary)]">
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/termos-de-uso" className="hover:text-[var(--color-brand)] underline transition-colors">
                Termos de Uso
              </Link>
              <span>•</span>
              <Link to="/politica-de-privacidade" className="hover:text-[var(--color-brand)] underline transition-colors">
                Privacidade
              </Link>
              <span>•</span>
              <Link to="/politica-de-cookies" className="hover:text-[var(--color-brand)] underline transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
