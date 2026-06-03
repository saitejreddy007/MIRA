'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <Toaster>');
  return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-card border-border/60',
  success: 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60',
  error: 'bg-rose-50/95 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/60',
  warning: 'bg-amber-50/95 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60',
  info: 'bg-sky-50/95 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/60',
};

const variantIcons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantIconColors: Record<ToastVariant, string> = {
  default: 'text-foreground/70',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.duration ?? 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = variantIcons[t.variant ?? 'default'];
          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-glass-lg backdrop-blur-xl animate-fade-up',
                variantStyles[t.variant ?? 'default']
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', variantIconColors[t.variant ?? 'default'])} />
              <div className="flex-1 min-w-0">
                {t.title && <p className="font-semibold text-sm text-foreground">{t.title}</p>}
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground transition-colors duration-500 ease-spring p-1 rounded-md cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
