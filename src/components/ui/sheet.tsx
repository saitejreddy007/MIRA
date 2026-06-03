'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('Sheet.* must be used within <Sheet>');
  return ctx;
}

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right';
  showClose?: boolean;
  ariaLabel?: string;
}

export function SheetContent({
  className,
  side = 'left',
  showClose = true,
  ariaLabel = 'Panel',
  children,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheet();
  if (!open) return null;

  const sideClass =
    side === 'left'
      ? 'left-0 top-0 h-full w-72 sm:w-80 animate-slide-in-left'
      : 'right-0 top-0 h-full w-72 sm:w-80 animate-slide-in-right';

  return (
    <div
      className="fixed inset-0 z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md dark:bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute z-10 glass-card-strong squircle-none sm:squircle-lg',
          'p-4 sm:p-5 overflow-y-auto',
          sideClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {showClose && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center squircle-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors duration-500 ease-spring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function SheetTrigger({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}
