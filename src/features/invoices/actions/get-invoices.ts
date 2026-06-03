'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type InvoiceWithClient = {
  id: number;
  invoice_number: string;
  amount: string;
  currency: string;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  description: string | null;
  created_at: string;
  clients: { name: string; segment: string } | null;
  client_id: number;
  segment_override: string | null;
  owner_override: string | null;
  next_follow_up_at: string | null;
  pre_due_reminder_sent: boolean;
};

export type InvoicesPage = {
  rows: InvoiceWithClient[];
  total: number;
  counts: {
    all: number;
    pending: number;
    overdue: number;
    paid: number;
    cancelled: number;
  };
  hasMore: boolean;
  nextOffset: number | null;
};

export type InvoiceStatusFilter = 'all' | 'pending' | 'overdue' | 'paid' | 'cancelled';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const ACTIVE_STATUSES_NOT_IN = '(paid,cancelled)';

export async function getInvoices(
  businessId: string,
  options: { offset?: number; limit?: number; status?: InvoiceStatusFilter } = {}
): Promise<InvoicesPage> {
  const supabase = await createServerSupabaseClient();
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  const offset = Math.max(0, options.offset ?? 0);
  const end = offset + limit - 1;
  const status = options.status ?? 'all';
  const today = new Date().toISOString().split('T')[0];

  const listQuery = supabase
    .from('invoices')
    .select('*, clients(name, segment)', { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  const filteredList = applyStatusFilter(listQuery, status, today);

  const countQueries = await Promise.all([
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .not('status', 'in', ACTIVE_STATUSES_NOT_IN),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .lt('due_date', today)
      .not('status', 'in', ACTIVE_STATUSES_NOT_IN),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'paid'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'cancelled'),
  ]);

  const { data, count } = await filteredList.range(offset, end);

  const rows = (data as unknown as InvoiceWithClient[]) || [];
  const total = count ?? 0;
  const nextOffset = offset + rows.length < total ? offset + rows.length : null;

  const counts = {
    all: countQueries[0].count ?? 0,
    pending: countQueries[1].count ?? 0,
    overdue: countQueries[2].count ?? 0,
    paid: countQueries[3].count ?? 0,
    cancelled: countQueries[4].count ?? 0,
  };

  return { rows, total, counts, hasMore: nextOffset !== null, nextOffset };
}

function applyStatusFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  status: InvoiceStatusFilter,
  today: string
) {
  switch (status) {
    case 'pending':
      return query
        .eq('status', 'pending')
        .gte('due_date', today);
    case 'overdue':
      return query
        .eq('status', 'pending')
        .lt('due_date', today);
    case 'paid':
      return query.eq('status', 'paid');
    case 'cancelled':
      return query.eq('status', 'cancelled');
    case 'all':
    default:
      return query;
  }
}
