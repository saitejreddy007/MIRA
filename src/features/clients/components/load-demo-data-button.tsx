'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { loadDemoData } from '../actions/load-demo-data';

export function LoadDemoDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ clients: number; invoices: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const ok = window.confirm(
      'Load 6 demo clients with sample invoices? Use this to explore MIRA without entering real data. You can delete them anytime.'
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    const res = await loadDemoData();
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setResult({ clients: res.clients_created, invoices: res.invoices_created });
    setLoading(false);
    setTimeout(() => {
      router.refresh();
      setResult(null);
    }, 4000);
  }

  if (result) {
    return (
      <div className="card flex items-center gap-3 border-green-200 bg-green-50">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Demo data loaded</p>
          <p className="text-xs text-green-700">{result.clients} clients, {result.invoices} invoices</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">Try with sample data</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Instantly load 6 demo clients with a mix of overdue, current, and upcoming invoices so you can see MIRA in action.
          </p>
          <button
            onClick={handleClick}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-500 ease-spring disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Loading...' : 'Load demo data'}
          </button>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
