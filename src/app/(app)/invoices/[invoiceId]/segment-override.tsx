'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { setInvoiceSegmentOverride } from '@/features/invoices/actions/set-invoice-segment-override';

const labels: Record<string, string> = {
  A: 'A — VIP / Long-standing',
  B: 'B — Regular / Reliable',
  C: 'C — Occasional / Slow',
  D: 'D — New / Unknown',
  E: 'E — High-risk / Difficult',
};

export function InvoiceSegmentOverride({
  invoiceId,
  currentOverride,
  clientSegment,
}: {
  invoiceId: number;
  currentOverride: string | null;
  clientSegment: string;
}) {
  const [segment, setSegment] = useState(currentOverride || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setSaving(true);
    setError(null);
    const newVal = (value === '' ? null : value) as 'A' | 'B' | 'C' | 'D' | 'E' | null;
    const result = await setInvoiceSegmentOverride({ invoiceId, segment: newVal });
    if (result.error) {
      setError(result.error);
    } else {
      setSegment(value);
    }
    setSaving(false);
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Segment Override</h2>

      <select
        value={segment}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="input-field text-sm"
      >
        <option value="">Use client default ({labels[clientSegment] || 'D — New / Unknown'})</option>
        {Object.entries(labels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Override segment for this invoice only. Does not change the client&apos;s permanent segment.
      </p>
    </div>
  );
}
