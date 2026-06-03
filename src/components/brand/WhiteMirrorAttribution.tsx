import React from 'react';
import { cn } from '@/lib/utils';

export function WhiteMirrorAttribution({ className }: { className?: string }) {
  return (
    <div className={cn('attribution', className)}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-foreground">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      A WhiteMirror Product
    </div>
  );
}
