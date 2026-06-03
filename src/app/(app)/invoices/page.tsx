'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, ExternalLink, IndianRupee, Clock, Loader2, Plus, Upload, Search, Filter, Sparkles } from 'lucide-react';
import { getInvoices, type InvoiceWithClient, type InvoiceStatusFilter } from '@/features/invoices/actions/get-invoices';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEGMENT_TONES, STATUS_BADGE_VARIANT } from '@/lib/badges';
import { cn } from '@/lib/utils';

const tabs: { label: string; value: InvoiceStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
];

const PAGE_SIZE = 50;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, pending: 0, overdue: 0, paid: 0, cancelled: 0 });
  const [activeTab, setActiveTab] = useState<InvoiceStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const supabase = createClient();

  const fetchInvoices = useCallback(
    async (offset: number, append: boolean, status: InvoiceStatusFilter) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', authData.user.id)
        .single();

      if (!userData?.business_id) {
        setLoading(false);
        return;
      }

      const page = await getInvoices(userData.business_id, { offset, limit: PAGE_SIZE, status });
      setInvoices((prev) => (append ? [...prev, ...page.rows] : page.rows));
      setTotal(page.total);
      setCounts(page.counts);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
      setLoading(false);
      setLoadingMore(false);
    },
    [supabase]
  );

  useEffect(() => {
    setLoading(true);
    setInvoices([]);
    setNextOffset(0);
    startTransition(() => {
      fetchInvoices(0, false, activeTab);
    });
  }, [activeTab, fetchInvoices]);

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.clients?.name?.toLowerCase().includes(q)
    );
  });

  function handleLoadMore() {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    fetchInvoices(nextOffset, true, activeTab);
  }

  return (
    <div className="px-4 sm:px-6 pb-12">
      <PageHeader
        title="Invoices"
        description="Track every invoice and let MIRA chase the ones that slip"
        actions={
          <Link href="/invoices/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New invoice</span>
            <span className="sm:hidden">New</span>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InvoiceStatusFilter)} className="mb-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="flex-wrap h-auto">
            {tabs.map((tab) => {
              const count = counts[tab.value] ?? 0;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="ml-1.5 text-[10px] opacity-60 nums">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by invoice number or client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 h-9 text-sm"
            aria-label="Search invoices"
          />
        </div>
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          aria-label="Filter"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            search
              ? 'No matches'
              : activeTab === 'all'
              ? 'No invoices yet'
              : `No ${activeTab} invoices`
          }
          description={
            search
              ? `Nothing matches "${search}". Try a different search.`
              : activeTab === 'all'
              ? 'Upload a CSV or add your first invoice manually to start tracking payments.'
              : `You don't have any ${activeTab} invoices.`
          }
          action={
            !search && activeTab === 'all' ? (
              <>
                <button className="btn-secondary">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </button>
                <Link href="/invoices/new" className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add invoice
                </Link>
              </>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/50 bg-accent/20">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Invoice
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Client
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Segment
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Due date
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Next follow-up
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const isOverdue =
                      inv.status === 'pending' && new Date(inv.due_date) < new Date();
                    const displayStatus = isOverdue ? 'overdue' : inv.status;
                    const segment = inv.segment_override || inv.clients?.segment || 'D';
                    return (
                      <tr
                        key={inv.id}
                        className={cn(
                          'group transition-colors duration-500 ease-spring hover:bg-accent/30',
                          i < filtered.length - 1 && 'border-b border-border/40'
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors duration-500 ease-spring"
                          >
                            {inv.invoice_number}
                            <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground/80">
                          {inv.clients?.name || <span className="text-muted-foreground italic">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={cn('ring-1 ring-inset', SEGMENT_TONES[segment as keyof typeof SEGMENT_TONES] || SEGMENT_TONES.D)}>
                            {segment}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-sm font-display font-semibold nums text-foreground">
                            <IndianRupee className="h-3 w-3 text-muted-foreground/60" />
                            {Number(inv.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'text-sm',
                              isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-foreground/80'
                            )}
                          >
                            {new Date(inv.due_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {inv.next_follow_up_at ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(inv.next_follow_up_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40 italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Badge variant={STATUS_BADGE_VARIANT[displayStatus as keyof typeof STATUS_BADGE_VARIANT] || 'warning'}>
                            {displayStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? 'Loading…' : `Load ${Math.min(PAGE_SIZE, total - invoices.length)} more`}
              </button>
            </div>
          )}

          {invoices.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4 nums">
              Showing {invoices.length} of {total} invoice{total === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
