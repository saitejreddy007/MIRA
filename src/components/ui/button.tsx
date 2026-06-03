import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-500 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_-1px_0_rgba(0,0,0,0.08)_inset,0_8px_24px_-8px_rgba(34,197,94,0.5),0_1px_2px_rgba(0,0,0,0.06)] hover:-translate-y-px hover:shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_12px_32px_-8px_rgba(34,197,94,0.6)]',
        secondary:
          'bg-secondary glass border border-border/60 text-secondary-foreground hover:bg-white/90 dark:hover:bg-white/5',
        ghost: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent/40 hover:border-border/80',
        danger:
          'text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_24px_-8px_rgba(220,38,38,0.45)] hover:-translate-y-px',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
