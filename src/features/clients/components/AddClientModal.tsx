'use client';

import { useState } from 'react';
import { addClient } from '../actions/add-client';
import { User, Wallet, FileText, Calendar, IndianRupee, X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInvoice, setHasInvoice] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await addClient(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Add Client</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Details</p>

          <div>
            <label htmlFor="name" className="label">Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input id="name" name="name" type="text" required
                className="input-field pl-10" placeholder="Client name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email"
                className="input-field" placeholder="Email" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" type="tel"
                className="input-field" placeholder="Phone" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="notes" className="label">Notes</label>
              <textarea id="notes" name="notes" rows={1}
                className="input-field resize-none" placeholder="Optional notes" />
            </div>
            <div>
              <label htmlFor="segment" className="label">Segment</label>
              <select id="segment" name="segment" defaultValue="D"
                className="input-field">
                <option value="A">A — VIP / Long-standing</option>
                <option value="B">B — Regular / Reliable</option>
                <option value="C">C — Occasional / Slow</option>
                <option value="D">D — New / Unknown</option>
                <option value="E">E — High-risk / Difficult</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</p>
              <button type="button" onClick={() => setHasInvoice(!hasInvoice)}
                className="text-sm text-primary font-medium hover:text-primary/80">
                {hasInvoice ? 'Remove invoice' : '+ Add invoice'}
              </button>
            </div>

            {hasInvoice && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="invoice_number" className="label">Invoice # *</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="invoice_number" name="invoice_number" type="text" required
                        className="input-field pl-10" placeholder="INV-001" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="amount" className="label">Amount *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="amount" name="amount" type="number" step="0.01" min="0" required
                        className="input-field pl-10" placeholder="25000" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="due_date" className="label">Due date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="due_date" name="due_date" type="date" required
                        className="input-field pl-10" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="label">Description</label>
                    <input id="description" name="description" type="text"
                      className="input-field" placeholder="Website redesign" />
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors duration-500 ease-spring">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-500 ease-spring disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
