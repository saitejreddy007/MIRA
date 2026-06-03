import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface StatusDotProps {
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  brand: 'bg-primary',
};

const sizeStyles = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export function StatusDot({
  variant = 'neutral',
  size = 'md',
  pulse = true,
  className,
}: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-block rounded-full',
          variantStyles[variant],
          sizeStyles[size]
        )}
      />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-60',
            variantStyles[variant]
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

export function StatusBadge({
  variant = 'neutral',
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const variantBg = {
    success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
    warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-amber-500/20',
    danger: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-rose-500/20',
    info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-sky-500/20',
    neutral: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 ring-slate-500/20',
    brand: 'bg-primary/12 text-primary ring-primary/20',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 squircle-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        variantBg,
        className
      )}
      {...props}
    >
      <StatusDot variant={variant} size="sm" pulse={false} />
      {children}
    </div>
  );
}
