import type { SupabaseClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/redis/client';
import { logger } from '@/lib/logger';
import { addDaysISO, todayISO } from '@/lib/dates';

export type DispatchJob = {
  invoiceId: number;
  businessId: string;
  enqueuedAt: string;
};

export type DispatchResult = {
  businessesScanned: number;
  invoicesEnqueued: number;
  perBusiness: Record<string, number>;
  errors: string[];
};

const BUSINESS_SELECT =
  'id, name, max_follow_up_days, auto_escalation_after_days';

const HARD_LIMIT_PER_BUSINESS = 50;

export async function dispatch(supabase: SupabaseClient): Promise<DispatchResult> {
  const result: DispatchResult = {
    businessesScanned: 0,
    invoicesEnqueued: 0,
    perBusiness: {},
    errors: [],
  };

  let redis;
  try {
    redis = getRedis();
  } catch (err) {
    result.errors.push(`redis unavailable: ${err instanceof Error ? err.message : 'unknown'}`);
    return result;
  }

  const { data: businesses, error: bizErr } = await supabase
    .from('businesses')
    .select(BUSINESS_SELECT);

  if (bizErr) {
    result.errors.push(`businesses query failed: ${bizErr.message}`);
    return result;
  }

  if (!businesses || businesses.length === 0) {
    logger.info('dispatch: no businesses found');
    return result;
  }

  const today = todayISO();
  const preDueCutoff = addDaysISO(today, 3);

  for (const business of businesses) {
    result.businessesScanned++;
    const businessId = business.id;
    const queueKey = `mira:queue:any`;

    try {
      const { data: constitution } = await supabase
        .from('constitutions')
        .select('id')
        .eq('business_id', businessId)
        .order('locked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!constitution) {
        continue;
      }

      const { data: preDueInvoices, error: preErr } = await supabase
        .from('invoices')
        .select('id')
        .eq('business_id', businessId)
        .lte('due_date', preDueCutoff)
        .gt('due_date', today)
        .eq('pre_due_reminder_sent', false)
        .eq('status', 'pending');

      if (preErr) {
        result.errors.push(`business ${businessId} pre-due query: ${preErr.message}`);
      }

      const { data: overdueInvoices, error: odErr } = await supabase
        .from('invoices')
        .select('id')
        .eq('business_id', businessId)
        .lt('due_date', today)
        .not('status', 'in', '(paid,cancelled)')
        .or('owner_override.is.null,owner_override.neq.stop');

      if (odErr) {
        result.errors.push(`business ${businessId} overdue query: ${odErr.message}`);
      }

      const allInvoiceIds = [
        ...(preDueInvoices ?? []).map((i) => i.id as number),
        ...(overdueInvoices ?? []).map((i) => i.id as number),
      ];

      const limitedIds = allInvoiceIds.slice(0, HARD_LIMIT_PER_BUSINESS);

      if (limitedIds.length === 0) continue;

      const jobs: DispatchJob[] = limitedIds.map((invoiceId) => ({
        invoiceId,
        businessId,
        enqueuedAt: new Date().toISOString(),
      }));

      await redis.lpush(queueKey, ...jobs.map((j) => JSON.stringify(j)));

      result.invoicesEnqueued += jobs.length;
      result.perBusiness[businessId] = jobs.length;
      logger.info({ businessId, count: jobs.length }, 'dispatch: enqueued');
    } catch (bizErr2) {
      result.errors.push(
        `business ${businessId} dispatch: ${bizErr2 instanceof Error ? bizErr2.message : 'unknown'}`
      );
    }
  }

  return result;
}
