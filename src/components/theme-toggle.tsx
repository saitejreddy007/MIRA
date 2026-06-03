'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'pill';
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const current = mounted ? theme ?? 'light' : 'light';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={cycle}
        aria-label={`Switch theme (current: ${current})`}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden',
          'glass-card hover:shadow-glass-lg transition-all duration-300 ease-spring',
          'hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        {current === 'dark' && (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
        )}
        {current === 'light' && (
          <Moon className="h-4 w-4 text-foreground transition-transform duration-300" />
        )}
        {current === 'system' && (
          <Monitor className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl p-1 glass-card',
        className
      )}
    >
      {(['light', 'system', 'dark'] as const).map((t) => {
        const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
        const active = current === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            aria-label={`${t} theme`}
            aria-pressed={active}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-500 ease-spring cursor-pointer',
              active
                ? 'bg-white shadow-sm text-foreground dark:bg-white/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
