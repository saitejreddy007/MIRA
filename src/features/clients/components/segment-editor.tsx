'use client';

import { useState } from 'react';
import { updateClientSegment } from '../actions/update-client-segment';
import { Check, X, ChevronDown } from 'lucide-react';

const labels: Record<string, string> = {
  A: 'A — VIP / Long-standing',
  B: 'B — Regular / Reliable',
  C: 'C — Occasional / Slow',
  D: 'D — New / Unknown',
  E: 'E — High-risk / Difficult',
};

export function SegmentEditor({ clientId, currentSegment }: { clientId: number; currentSegment: string }) {
  const [editing, setEditing] = useState(false);
  const [segment, setSegment] = useState(currentSegment);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Segment</span>
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-500 ease-spring">
          {labels[segment] || 'D — New / Unknown'}
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  async function handleChange(newSegment: string) {
    setSaving(true);
    const result = await updateClientSegment(clientId, newSegment);
    if (result.success) {
      setSegment(newSegment);
      setEditing(false);
    }
    setSaving(false);
  }

  return (
    <div>
      <span className="text-xs text-muted-foreground block mb-1">Segment</span>
      <div className="flex flex-wrap gap-1">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleChange(key)}
            disabled={saving}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors duration-500 ease-spring ${
              key === segment
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
