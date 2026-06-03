'use client';

import { useState, useRef } from 'react';
import { importClients } from '../actions/import-clients';
import { Upload, X, Loader2, ChevronDown, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CsvUploadModal({ open, onClose, onSuccess }: Props) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; count: number; invoicesCreated?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const rows = parseCSVPreview(text);
      setPreview(rows);
      setError(null);
      setResult(null);
    };
    reader.readAsText(file);
  }

  function parseCSVPreview(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    }).slice(0, 5);
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await importClients(csvText);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setResult({ success: true, count: res.count! });
    setLoading(false);
    setCsvText('');
    setPreview([]);
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Import Clients from CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors duration-500 ease-spring"
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {csvText ? 'Click to choose a different file' : 'Click to select a CSV file'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Required column: <code className="bg-background px-1 rounded">name</code>. Optional columns: <code className="bg-background px-1 rounded">email</code>, <code className="bg-background px-1 rounded">phone</code>, <code className="bg-background px-1 rounded">company</code>, <code className="bg-background px-1 rounded">segment</code>. Invoice columns: <code className="bg-background px-1 rounded">invoice_number</code>, <code className="bg-background px-1 rounded">amount</code>, <code className="bg-background px-1 rounded">due_date</code>
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Preview ({preview.length} of {csvText.trim().split('\n').length - 1} rows)
              </p>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background">
                      {Object.keys(preview[0]).map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-foreground capitalize whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-foreground truncate max-w-[200px]">
                            {v || <span className="text-muted-foreground italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Imported {result.count} client{result.count !== 1 ? 's' : ''}
              {!!result.invoicesCreated && ` with ${result.invoicesCreated} invoice${result.invoicesCreated !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors duration-500 ease-spring">
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button onClick={handleImport} disabled={!csvText || loading}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-500 ease-spring disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Importing...' : `Import ${preview.length > 0 ? `(${csvText.trim().split('\n').length - 1})` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
