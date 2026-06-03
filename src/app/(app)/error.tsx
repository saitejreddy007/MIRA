'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { IconTile } from '@/components/shared/IconTile';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="glass-card max-w-md w-full text-center p-8">
        <div className="flex justify-center mb-4">
          <IconTile icon={AlertTriangle} size="lg" tone="danger" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          Try again
        </button>
      </div>
    </div>
  );
}
