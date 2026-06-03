import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Mail, Phone, Calendar, IndianRupee, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SegmentBadge } from '@/features/clients/components/segment-badge';
import { SegmentEditor } from '@/features/clients/components/segment-editor';
import { Badge } from '@/components/ui/badge';
import { IconTile } from '@/components/shared/IconTile';
import { formatCurrency, formatDate } from '@/lib/format';
import { SEGMENT_TONES, STATUS_BADGE_VARIANT } from '@/lib/badges';
import { cn } from '@/lib/utils';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) notFound();

  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) notFound();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('business_id', userData.business_id)
    .single();

  if (!client) notFound();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .eq('business_id', userData.business_id)
    .order('due_date', { ascending: false });

  const segment = client.segment || 'D';
  const initial = (client.name || '?').charAt(0).toUpperCase();

  return (
    <div className="px-6 pb-12">
      <div className="mb-6 animate-fade-up">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to clients
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <IconTile
            icon={() => <span className="text-lg font-bold">{initial}</span>}
            size="xl"
            tone="default"
            aria-label={client.name}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{client.name}</h1>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <Badge className={cn('ring-1 ring-inset', SEGMENT_TONES[segment as keyof typeof SEGMENT_TONES] || SEGMENT_TONES.D)}>
                Segment {segment}
              </Badge>
              {client.company && (
                <span className="text-sm text-muted-foreground">· {client.company}</span>
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-6 space-y-5 animate-fade-up stagger-1">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Details
              </h2>
              <div className="space-y-2.5">
                <SegmentEditor clientId={client.id} currentSegment={client.segment || 'D'} />
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {client.phone}
                  </a>
                )}
                {client.notes && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                    {client.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5 pt-2">
                  <Calendar className="h-3 w-3" />
                  Added {formatDate(client.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card overflow-hidden animate-fade-up stagger-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Invoices <span className="text-foreground/60 normal-case font-medium tracking-normal">({invoices?.length || 0})</span>
              </h2>
            </div>

            {!invoices || invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/60 mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Once you add an invoice for {client.name}, it will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-accent/20">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Invoice
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Due
                      </th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => {
                      const isOverdue = inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.due_date) < new Date());
                      const displayStatus = isOverdue && inv.status === 'pending' ? 'overdue' : inv.status;
                      return (
                        <tr
                          key={inv.id}
                          className={cn(
                            'group hover:bg-accent/30 transition-colors',
                            i < invoices.length - 1 && 'border-b border-border/40'
                          )}
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {inv.invoice_number}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-sm font-display font-semibold nums text-foreground">
                              <IndianRupee className="h-3 w-3 text-muted-foreground/60" />
                              {Number(inv.amount).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-foreground/80">
                            {new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            )}
          </div>
        </div>
    </div>
  );
}
