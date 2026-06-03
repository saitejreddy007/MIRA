import * as React from 'react';
import { cn } from '@/lib/utils';

interface WhiteMirrorMarkProps {
  size?: number;
  className?: string;
  /** 'fill' uses the current text color (good for monochrome); 'outline' is stroked only. */
  variant?: 'fill' | 'outline';
  title?: string;
}

export function WhiteMirrorMark({
  size = 36,
  className,
  variant = 'fill',
  title = 'WhiteMirror',
}: WhiteMirrorMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn('shrink-0', className)}
    >
      {title && <title>{title}</title>}
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="34.5"
        rx="9.25"
        className={variant === 'fill' ? 'fill-current' : ''}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="6"
        y1="18"
        x2="30"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M10.5 11.5 L18 23.5 L25.5 11.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10.5 24.5 L18 12.5 L25.5 24.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}
