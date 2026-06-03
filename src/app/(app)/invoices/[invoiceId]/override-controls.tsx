'use client';

import { useState } from 'react';
import { Shield, ShieldOff, Play, Loader2 } from 'lucide-react';
import { setInvoiceOverride } from '@/features/invoices/actions/set-invoice-override';

export function InvoiceOverrideControls({
  invoiceId,
  currentOverride,
  sequenceStopped,
}: {
  invoiceId: number;
  currentOverride: string | null;
  sequenceStopped: boolean;
}) {
  const [override, setOverride] = useState(currentOverride);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applyOverride(value: 'pause' | 'stop' | null) {
    if (value === 'stop' && !override) {
      const ok = window.confirm(
        'Stop follow-ups for this invoice? This will permanently prevent any AI messages from going out. You can resume later, but the client may already expect a reminder.'
      );
      if (!ok) return;
    }

    setLoading(value ?? 'resume');
    setError(null);
    const result = await setInvoiceOverride({ invoiceId, override: value });
    if (result.error) {
      setError(result.error);
    } else {
      setOverride(value);
    }
    setLoading(null);
  }

  if (sequenceStopped) {
    return (
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sequence Control</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldOff className="w-4 h-4" />
          Invoice cancelled — no follow-ups
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sequence Control</h2>

      {!override ? (
        <div className="flex gap-2">
          <button
            onClick={() => applyOverride('pause')}
            disabled={loading === 'pause'}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-yellow-300 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 transition-colors disabled:opacity-50"
          >
            {loading === 'pause' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Pause
          </button>
          <button
            onClick={() => applyOverride('stop')}
            disabled={loading === 'stop'}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
            Stop
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 text-sm mb-3">
            {override === 'pause' ? (
              <><Shield className="w-4 h-4 text-yellow-500" /><span className="text-yellow-700 font-medium">Paused</span></>
            ) : (
              <><ShieldOff className="w-4 h-4 text-red-500" /><span className="text-red-700 font-medium">Stopped</span></>
            )}
          </div>
          <button
            onClick={() => applyOverride(null)}
            disabled={loading === 'resume'}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {loading === 'resume' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Resume sequence
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-xs text-muted-foreground">
        {override === 'pause'
          ? 'Paused invoices will be skipped by the daily pipeline.'
          : override === 'stop'
          ? 'Stopped invoices will never receive follow-ups.'
          : 'Control follow-up behavior for this invoice only.'}
      </p>
    </div>
  );
}
