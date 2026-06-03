'use client';

import { useState } from 'react';
import { Calendar, Pencil, Check, X, Loader2 } from 'lucide-react';
import { updateInvoice } from '@/features/invoices/actions/update-invoice';

export function InvoiceDueDateEditor({ invoiceId, dueDate, isOverdue }: { invoiceId: number; dueDate: string; isOverdue: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(dueDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!value) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set('invoice_id', String(invoiceId));
    formData.set('due_date', value);
    const result = await updateInvoice(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setEditing(false);
    setLoading(false);
  }

  function handleCancel() {
    setValue(dueDate);
    setEditing(false);
    setError(null);
  }

  const formatted = new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">Due Date</p>
      {editing ? (
        <div className="space-y-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field text-sm"
            suppressHydrationWarning
          />
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={loading} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button onClick={handleCancel} disabled={loading} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
            <Calendar className="w-4 h-4" />
            {formatted}
            {isOverdue && <span className="text-xs text-red-500 font-semibold">(Overdue)</span>}
          </p>
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
