'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Upload, UserPlus, Mail, Phone, ExternalLink, Search } from 'lucide-react';
import AddClientModal from '@/features/clients/components/AddClientModal';
import CsvUploadModal from '@/features/clients/components/CsvUploadModal';
import { LoadDemoDataButton } from '@/features/clients/components/load-demo-data-button';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconTile } from '@/components/shared/IconTile';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { SEGMENT_TONES } from '@/lib/badges';
import { cn } from '@/lib/utils';

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string;
  created_at: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) { setLoading(false); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', authData.user.id)
      .single();

    if (!userData?.business_id) { setLoading(false); return; }

    const { data } = await supabase
      .from('clients')
      .select('id, name, email, phone, segment, created_at')
      .eq('business_id', userData.business_id)
      .order('created_at', { ascending: false });

    setClients(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-6 pb-12">
      <PageHeader
        title="Clients"
        description="The relationships MIRA protects and grows for you"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowCsv(true)}
              className="btn-secondary"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add client
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 h-9 text-sm"
          />
        </div>
      </div>

        {loading ? (
          <div className="glass-card p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 squircle-sm" />
                <Skeleton className="h-4 flex-1 max-w-[200px]" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="space-y-4">
            <LoadDemoDataButton />
            <EmptyState
              icon={UserPlus}
              title="No clients yet"
              description="Add your first client manually or import them from a CSV file. MIRA will start tracking their invoices immediately."
              action={
                <>
                  <button onClick={() => setShowCsv(true)} className="btn-secondary">
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </button>
                  <button onClick={() => setShowAdd(true)} className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Add Client
                  </button>
                </>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description={`No clients match "${search}". Try a different search term.`}
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-accent/20">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Segment</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const initial = c.name.charAt(0).toUpperCase();
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          'group transition-colors duration-500 ease-spring hover:bg-accent/30',
                          i < filtered.length - 1 && 'border-b border-border/40'
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/clients/${c.id}`}
                            className="flex items-center gap-3 group/name"
                          >
                            <IconTile
                              icon={() => <span className="text-xs font-bold">{initial}</span>}
                              size="sm"
                              tone="default"
                              aria-label={c.name}
                            />
                            <span className="text-sm font-semibold text-foreground group-hover/name:text-primary transition-colors duration-500 ease-spring truncate">
                              {c.name}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={cn('ring-1 ring-inset', SEGMENT_TONES[(c.segment as keyof typeof SEGMENT_TONES) || 'D'] || SEGMENT_TONES.D)}>
                            {c.segment || 'D'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-500 ease-spring"
                            >
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground/50 italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.phone ? (
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-500 ease-spring"
                            >
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground/50 italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-muted-foreground nums">
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      <AddClientModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchClients(); }} />
      <CsvUploadModal open={showCsv} onClose={() => setShowCsv(false)} onSuccess={() => { setShowCsv(false); fetchClients(); }} />
    </div>
  );
}
