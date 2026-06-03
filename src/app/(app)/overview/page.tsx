import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/format';
import Link from 'next/link';
import {
  FileWarning,
  Clock,
  Users,
  IndianRupee,
  ArrowRight,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Activity as ActivityIcon,
  CalendarClock,
} from 'lucide-react';
import { OverviewRealtimeSync } from './overview-realtime-sync';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusDot } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

type InvoiceRow = {
  id: number;
  invoice_number: string;
  amount: string | number;
  currency: string;
  status: string;
  due_date: string;
  client_id: number;
  human_escalation_required: boolean;
  clients: { name: string; email: string | null; segment: string } | null;
};

type FollowUpRow = {
  id: number;
  invoice_id: number;
  message_text: string;
  message_position: number;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
  invoice_number?: string;
  client_name?: string;
};

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return null;

  const { data: user } = await supabase
    .from('users')
    .select('business_id, name')
    .eq('id', authData.user.id)
    .single();
  if (!user?.business_id) return null;

  const businessId = user.business_id;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  const [
    { count: overdueCount },
    { count: pendingCount },
    { count: clientsCount },
    { data: collectedRows },
    { data: overdueInvoices },
    { count: attentionCount },
    { data: recentFollowUps },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .lt('due_date', today)
      .not('status', 'in', '("paid","cancelled")'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .not('owner_override', 'eq', 'stop'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('invoices')
      .select('amount, currency, paid_at')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
      .not('paid_at', 'is', null),
    supabase
      .from('invoices')
      .select('id, invoice_number, amount, currency, due_date, clients!inner(name, email, segment)')
      .eq('business_id', businessId)
      .lt('due_date', today)
      .not('status', 'in', '("paid","cancelled")')
      .or('owner_override.is.null,owner_override.neq.stop')
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .lt('due_date', today)
      .not('status', 'in', '("paid","cancelled")')
      .or('owner_override.is.null,owner_override.neq.stop')
      .not('human_escalation_required', 'is', null),
    supabase
      .from('follow_ups')
      .select('id, invoice_id, message_text, message_position, sent_at, opened_at, created_at, invoices!inner(invoice_number, clients!inner(name))')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const collectedByCurrency: Record<string, number> = {};
  for (const r of collectedRows || []) {
    const amt = Number(r.amount) || 0;
    collectedByCurrency[r.currency] = (collectedByCurrency[r.currency] || 0) + amt;
  }
  const collectedDisplay = Object.entries(collectedByCurrency).slice(0, 2);
  const totalCollected = Object.values(collectedByCurrency).reduce((a, b) => a + b, 0);

  const firstName = (user.name || '').split(' ')[0] || 'there';
  const greeting = getGreeting();

  return (
    <>
      <OverviewRealtimeSync businessId={businessId} />

      <div className="px-4 sm:px-6 pb-12">
        {/* Hero greeting */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground mb-3">
              <Sparkles className="h-3 w-3" />
              {greeting}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {formatDate(today)} — here&apos;s how MIRA is working for you today.
            </p>
          </div>
          <Link href="/invoices" className="btn-primary">
            <FileWarning className="h-4 w-4" strokeWidth={2.5} />
            Review overdue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="animate-fade-up stagger-1">
            <MetricCard
              label="Overdue invoices"
              value={overdueCount || 0}
              icon={FileWarning}
              variant={(overdueCount || 0) > 0 ? 'danger' : 'default'}
              description={(overdueCount || 0) > 0 ? 'Need your attention' : 'All caught up'}
            />
          </div>
          <div className="animate-fade-up stagger-2">
            <MetricCard
              label="In MIRA's queue"
              value={pendingCount || 0}
              icon={Clock}
              variant="brand"
              description="Follow-ups scheduled"
            />
          </div>
          <div className="animate-fade-up stagger-3">
            <MetricCard
              label="Total clients"
              value={clientsCount || 0}
              icon={Users}
              variant="default"
              description="Active relationships"
            />
          </div>
          <div className="animate-fade-up stagger-4">
            <MetricCard
              label="Recovered this month"
              value={collectedDisplay.length > 0 ? formatCurrency(collectedDisplay[0][1], collectedDisplay[0][0]) : '—'}
              icon={IndianRupee}
              variant="success"
              description={collectedDisplay.length > 1 ? `+${collectedDisplay.length - 1} other currency` : 'Across all clients'}
              trend={totalCollected > 0 ? { value: 12, label: 'vs last month' } : undefined}
            />
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Overdue invoices */}
          <div className="lg:col-span-2 glass-card p-6 animate-fade-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold">Top overdue invoices</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Sorted by oldest due date</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors duration-500 ease-spring inline-flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {overdueInvoices && overdueInvoices.length > 0 ? (
              <div className="divide-y divide-border/60 -mx-2">
                {overdueInvoices.map((inv: any) => {
                  const daysOverdue = Math.floor(
                    (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="group flex items-center justify-between px-2 py-3 -mx-2 rounded-xl hover:bg-accent transition-colors duration-500 ease-spring"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <CalendarClock className="h-4 w-4 text-rose-600 dark:text-rose-400" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {inv.clients?.name || 'Unknown'} · {inv.invoice_number}
                          </p>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            {daysOverdue} days overdue
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-display font-bold nums text-foreground">
                          {formatCurrency(Number(inv.amount), inv.currency)}
                        </p>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-spring" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} />
                </div>
                <p className="text-sm font-semibold text-foreground">No overdue invoices</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  You&apos;re all caught up. MIRA will let you know the moment a payment is late.
                </p>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="glass-card p-6 animate-fade-up stagger-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-foreground" strokeWidth={2.25} />
                <h2 className="font-display text-base font-semibold">Live activity</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <StatusDot variant="success" size="sm" />
                Live
              </span>
            </div>

            {recentFollowUps && recentFollowUps.length > 0 ? (
              <ol className="space-y-1 -mx-2 max-h-[420px] overflow-y-auto pr-1">
                {recentFollowUps.map((f: any, idx: number) => {
                  const opened = !!f.opened_at;
                  return (
                    <li
                      key={f.id}
                      className="group relative flex items-start gap-3 rounded-xl p-2.5 hover:bg-accent transition-colors duration-500 ease-spring"
                    >
                      {idx < recentFollowUps.length - 1 && (
                        <div className="absolute left-[1.6rem] top-10 bottom-0 w-px bg-border/60" aria-hidden="true" />
                      )}
                      <div className={cn(
                        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                        opened
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400'
                          : 'bg-secondary border-border text-foreground'
                      )}>
                        {opened ? <Mail className="h-3.5 w-3.5" strokeWidth={2.25} /> : <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.25} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {f.invoices?.clients?.name || 'Client'} · #{f.invoice_number || f.invoice_id}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {f.message_text}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <StatusBadge variant={opened ? 'info' : 'success'}>
                            {opened ? 'Opened' : 'Sent'}
                          </StatusBadge>
                          <span className="text-[10px] text-muted-foreground">msg #{f.message_position}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once MIRA sends follow-ups, they&apos;ll appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attention banner */}
        {(attentionCount ?? 0) > 0 && (
          <div className="glass-card p-5 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {attentionCount} invoice{attentionCount === 1 ? '' : 's'} need your attention
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    MIRA flagged these for human review. Take a quick look before next outreach.
                  </p>
                </div>
              </div>
              <Link href="/invoices" className="btn-secondary">
                Review now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Working late';
}
