import React from 'react';
import { cn } from '@/lib/utils';

interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement | HTMLSpanElement | HTMLParagraphElement> {
  children: React.ReactNode;
}

export const PageTitle = ({ children, className, ...props }: TypographyProps) => (
  <h1
    className={cn(
      'font-display text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white',
      className,
    )}
    {...props}
  >
    {children}
  </h1>
);

export const SectionLabel = ({ children, className, ...props }: TypographyProps) => (
  <span
    className={cn(
      'text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500',
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

export const MetricNumber = ({ children, className, ...props }: TypographyProps) => (
  <span
    className={cn(
      'metric-value font-display text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white',
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

export const BodyText = ({ children, className, ...props }: TypographyProps) => (
  <p
    className={cn(
      'text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300',
      className,
    )}
    {...props}
  >
    {children}
  </p>
);
