import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-fast ease-standard select-none [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800',
        primary:
          'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800',
        secondary:
          'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        accent:
          'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        destructive:
          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
        success:
          'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        outline:
          'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-85 active:scale-95 transition-all duration-instant',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  readonly dot?: boolean;
}

function Badge({ className, variant, interactive, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, interactive }), className)} {...props}>
      {dot && (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
