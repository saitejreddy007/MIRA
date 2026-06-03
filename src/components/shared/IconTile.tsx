import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type IconTileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconTileTone =
  | 'default'
  | 'muted'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const sizeMap: Record<IconTileSize, { box: string; icon: string }> = {
  xs: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  lg: { box: 'h-10 w-10', icon: 'h-5 w-5' },
  xl: { box: 'h-12 w-12', icon: 'h-6 w-6' },
};

const toneMap: Record<IconTileTone, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'bg-secondary',
    text: 'text-foreground',
    border: 'border border-border',
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border border-border',
  },
  brand: {
    bg: 'bg-primary/12',
    text: 'text-primary',
    border: 'border border-primary/20',
  },
  success: {
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border border-emerald-500/20',
  },
  warning: {
    bg: 'bg-amber-500/12',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border border-amber-500/20',
  },
  danger: {
    bg: 'bg-rose-500/12',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border border-rose-500/20',
  },
  info: {
    bg: 'bg-sky-500/12',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border border-sky-500/20',
  },
};

type IconRenderer = LucideIcon | ((props: { className?: string; strokeWidth?: number }) => React.ReactNode);

interface IconTileProps {
  icon: IconRenderer;
  size?: IconTileSize;
  tone?: IconTileTone;
  /** Whether to apply the squircle clip. Defaults to true. */
  rounded?: boolean;
  className?: string;
  strokeWidth?: number;
  'aria-label'?: string;
}

export function IconTile({
  icon,
  size = 'md',
  tone = 'default',
  rounded = true,
  className,
  strokeWidth = 2.25,
  ...rest
}: IconTileProps) {
  const s = sizeMap[size];
  const t = toneMap[tone];
  return (
    <div
      className={cn(
        'shrink-0 inline-flex items-center justify-center',
        s.box,
        t.bg,
        t.text,
        t.border,
        rounded && 'squircle',
        className
      )}
      aria-label={rest['aria-label']}
    >
      {React.createElement(icon as LucideIcon, {
        className: cn(s.icon),
        strokeWidth,
      })}
    </div>
  );
}
