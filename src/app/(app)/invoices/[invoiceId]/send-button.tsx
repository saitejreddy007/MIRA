'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { sendFollowUp } from '@/features/invoices/actions/send-follow-up';

export function SendFollowUpButton({ invoiceId }: { invoiceId: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await sendFollowUp(String(invoiceId));
    setResult(res.error ? { ok: false, msg: res.error } : { ok: true, msg: 'Message sent' });
    setLoading(false);
    if (res.success) router.refresh();
    setTimeout(() => setResult(null), 4000);
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Send Follow-up</h2>
      <p className="text-xs text-muted-foreground">Generate and send a message to this client now.</p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
        ) : (
          <><Send className="w-4 h-4" /> Send Now</>
        )}
      </button>
      {result && (
        <div className={`rounded-lg px-3 py-2 text-xs flex items-start gap-1.5 ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
