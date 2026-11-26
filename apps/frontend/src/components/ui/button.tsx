import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-semibold transition-all duration-instant ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none touch-manipulation',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 hover:-translate-y-0.5 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-slate-950',
        primary:
          'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 hover:-translate-y-0.5 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-slate-950',
        secondary:
          'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950',
        outline:
          'border border-primary-600/40 text-primary-600 hover:bg-primary-50 hover:border-primary-600 active:bg-primary-100 focus-visible:ring-primary-500 dark:border-primary-500/40 dark:text-primary-400 dark:hover:bg-primary-950/40 dark:focus-visible:ring-offset-slate-950',
        accent:
          'bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 active:bg-amber-700 shadow-xs hover:-translate-y-0.5 focus-visible:ring-amber-500 dark:focus-visible:ring-offset-slate-950',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-950',
        destructive:
          'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 dark:focus-visible:ring-offset-slate-950',
        link:
          'text-primary-600 underline-offset-4 hover:underline active:scale-100 p-0 h-auto font-medium focus-visible:ring-primary-500',
      },
      size: {
        default: 'h-10 min-h-[44px] sm:min-h-[40px] px-4 py-2',
        sm: 'h-8 min-h-[36px] px-3 text-xs',
        lg: 'h-11 min-h-[48px] px-6 text-base',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly isLoading?: boolean;
  readonly loadingText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading ? 'true' : undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
