import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-white/60 dark:bg-white/5 px-3.5 py-2 text-sm transition-all duration-500 ease-spring placeholder:text-muted-foreground/60 hover:border-border/80 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-white/90 dark:focus-visible:bg-white/10 focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
