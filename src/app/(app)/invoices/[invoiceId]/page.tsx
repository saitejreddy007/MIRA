import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { IndianRupee, User, Clock, CheckCircle, XCircle, Send, AlertCircle, ArrowLeft, ArrowRight, Calendar, Mail, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import { SegmentBadge } from '@/features/clients/components/segment-badge';
import { InvoiceOverrideControls } from './override-controls';
import { InvoiceSegmentOverride } from './segment-override';
import { InvoiceDueDateEditor } from './due-date-editor';
import { SendFollowUpButton } from './send-button';
import { Badge } from '@/components/ui/badge';
import { IconTile } from '@/components/shared/IconTile';
import { STATUS_BADGE_VARIANT } from '@/lib/badges';
import { cn } from '@/lib/utils';

const followUpVariant: Record<string, 'info' | 'success' | 'destructive' | 'muted'> = {
  sent: 'info',
  opened: 'success',
  failed: 'destructive',
  draft: 'muted',
  replied: 'muted',
};

const followUpIcon: Record<string, React.ReactNode> = {
  sent: <Send className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />,
  opened: <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
  failed: <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
  draft: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  replied: <AlertCircle className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />,
};

function fmt(dateStr: string, showTime = true) {
  const d = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  if (showTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('en-IN', opts);
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) notFound();

  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) notFound();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email, phone, segment)')
    .eq('id', invoiceId)
    .eq('business_id', userData.business_id)
    .single();

  if (!invoice) notFound();

  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('business_id', userData.business_id)
    .order('created_at', { ascending: false });

  const isOverdue = invoice.status === 'overdue' || (invoice.status === 'pending' && new Date(invoice.due_date) < new Date());
  const displayStatus = isOverdue && invoice.status === 'pending' ? 'overdue' : invoice.status;
  const effectiveSegment = invoice.segment_override || invoice.clients?.segment || 'D';

  const lastSentMessage = followUps?.find((f) => f.status === 'sent' && f.sent_at);
  const nextPos = lastSentMessage ? (lastSentMessage.message_position ?? 0) + 1 : 0;

  return (
    <div className="px-6 pb-12">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors animate-fade-up"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to invoices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 animate-fade-up stagger-1">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile icon={FileText} size="lg" tone="default" />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight font-mono">
              {invoice.invoice_number}
            </h1>
            <div className="mt-1">
              <SegmentBadge segment={effectiveSegment} />
            </div>
          </div>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[displayStatus as keyof typeof STATUS_BADGE_VARIANT] || 'warning'} className="text-sm px-3 py-1">
          {displayStatus}
        </Badge>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 space-y-5 animate-fade-up stagger-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Invoice details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-3xl font-display font-bold tracking-tight nums flex items-baseline gap-1">
                    <IndianRupee className="w-5 h-5 text-muted-foreground" />
                    {Number(invoice.amount).toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{invoice.currency}</span>
                  </p>
                </div>
                <InvoiceDueDateEditor
                  invoiceId={invoice.id}
                  dueDate={invoice.due_date}
                  isOverdue={isOverdue}
                />
              </div>
              {invoice.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{invoice.description}</p>
                </div>
              )}

              {invoice.next_follow_up_at && (
                <div className="relative overflow-hidden rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Calendar className="h-4 w-4 text-foreground" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Next follow-up</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Scheduled for <strong className="text-foreground">{fmt(invoice.next_follow_up_at, true)}</strong>
                      <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground font-bold">
                        #{nextPos}
                      </span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              )}

              <p className="text-xs text-muted-foreground/70">
                Created {fmt(invoice.created_at, false)}
              </p>
            </div>

            {lastSentMessage && (
              <div className="glass-card p-6 animate-fade-up stagger-3">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Last sent message
                  </h2>
                </div>
                <div className="relative rounded-xl bg-card border border-border p-4 space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {lastSentMessage.message_text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      Sent {fmt(lastSentMessage.sent_at!, true)}
                    </span>
                    {lastSentMessage.message_position != null && (
                      <span className="px-1.5 py-0.5 rounded font-mono bg-muted text-foreground/70 text-[10px]">
                        Position #{lastSentMessage.message_position}
                      </span>
                    )}
                    <Badge variant={followUpVariant[lastSentMessage.status] || 'muted'}>
                      {lastSentMessage.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {followUps && followUps.length > 0 && (
              <div className="glass-card p-6 animate-fade-up stagger-4">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Follow-up history <span className="text-foreground/60 normal-case font-medium tracking-normal">({followUps.length})</span>
                </h2>
                <ol className="space-y-1">
                  {followUps.map((fu, i) => (
                    <li
                      key={fu.id}
                      className={cn(
                        'group relative flex items-start gap-3 rounded-xl p-3 hover:bg-accent/30 transition-colors',
                        i < followUps.length - 1 && 'pb-3'
                      )}
                    >
                      {i < followUps.length - 1 && (
                        <div
                          className="absolute left-[1.45rem] top-10 bottom-0 w-px bg-border/60"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border">
                        {followUpIcon[fu.status] || <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className={cn(
                            'text-sm',
                            fu.id === lastSentMessage?.id
                              ? 'font-semibold text-foreground'
                              : 'text-foreground/80'
                          )}>
                            {fu.message_text}
                          </p>
                          {fu.message_position != null && (
                            <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                              #{fu.message_position}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant={followUpVariant[fu.status] || 'muted'} className="text-[10px]">
                            {fu.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground/70">
                            {fu.sent_at ? fmt(fu.sent_at, true) : fmt(fu.created_at, true)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="animate-fade-up stagger-2">
              <InvoiceOverrideControls
                invoiceId={invoice.id}
                currentOverride={invoice.owner_override}
                sequenceStopped={invoice.status === 'cancelled'}
              />
            </div>

            <div className="animate-fade-up stagger-3">
              <InvoiceSegmentOverride
                invoiceId={invoice.id}
                currentOverride={invoice.segment_override}
                clientSegment={invoice.clients?.segment || 'D'}
              />
            </div>

            <div className="animate-fade-up stagger-4">
              <SendFollowUpButton invoiceId={invoice.id} />
            </div>

            {invoice.clients && (
              <div className="glass-card p-6 space-y-3 animate-fade-up stagger-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </h2>
                <Link
                  href={`/clients/${invoice.client_id}`}
                  className="group flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground text-xs font-bold">
                    {(invoice.clients.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {invoice.clients.name}
                  </span>
                </Link>
                {invoice.clients.email && (
                  <a href={`mailto:${invoice.clients.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pl-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{invoice.clients.email}</span>
                  </a>
                )}
                {invoice.clients.phone && (
                  <a href={`tel:${invoice.clients.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pl-1">
                    <Phone className="h-3 w-3" />
                    {invoice.clients.phone}
                  </a>
                )}
              </div>
            )}

            {(!followUps || followUps.length === 0) && (
              <div className="glass-card p-6 text-center animate-fade-up stagger-5">
                <div className="inline-flex h-10 w-10 items-center justify-center squircle-sm bg-accent/60 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">No follow-ups yet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Follow-ups appear here once the auto-send pipeline runs.
                </p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
