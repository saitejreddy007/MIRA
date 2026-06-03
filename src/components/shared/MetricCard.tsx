import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'brand' | 'warning' | 'danger' | 'success';
  description?: string;
  className?: string;
  loading?: boolean;
}

const variantStyles: Record<NonNullable<MetricCardProps['variant']>, {
  iconBg: string;
  iconColor: string;
  valueColor: string;
}> = {
  default: {
    iconBg: 'bg-secondary',
    iconColor: 'text-foreground',
    valueColor: 'text-foreground',
  },
  brand: {
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
  },
  warning: {
    iconBg: 'bg-amber-500/12',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    iconBg: 'bg-rose-500/12',
    iconColor: 'text-rose-600 dark:text-rose-400',
    valueColor: 'text-rose-700 dark:text-rose-300',
  },
  success: {
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-700 dark:text-emerald-300',
  },
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  description,
  className,
  loading = false,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-2xl glass-card p-5 transition-colors duration-500 ease-spring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded-md bg-muted animate-pulse" />
          ) : (
            <p
              className={cn(
                'mt-1.5 text-3xl font-display font-bold tracking-tight nums',
                styles.valueColor
              )}
            >
              {value}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              styles.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', styles.iconColor)} strokeWidth={2.25} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.value > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span
            className={cn(
              'font-semibold',
              trend.value > 0 && 'text-emerald-600 dark:text-emerald-400',
              trend.value < 0 && 'text-rose-600 dark:text-rose-400',
              trend.value === 0 && 'text-muted-foreground'
            )}
          >
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
