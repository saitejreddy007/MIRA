import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatch } from './dispatch';
import { processInvoice } from './process-invoice';

export type PipelineResult = {
  total: number;
  sent: number;
  skipped: number;
  escalated: number;
  errors: string[];
};

export async function runPipeline(supabaseOverride?: SupabaseClient): Promise<PipelineResult> {
  const result: PipelineResult = { total: 0, sent: 0, skipped: 0, escalated: 0, errors: [] };
  const supabase = supabaseOverride || (await import('@/lib/supabase/server')).createServiceRoleClient();

  const dispatchResult = await dispatch(supabase);
  result.errors.push(...dispatchResult.errors);
  result.total = dispatchResult.invoicesEnqueued;

  return result;
}

export async function processInvoiceManually(
  supabase: SupabaseClient,
  invoiceId: number,
  businessId: string
) {
  return processInvoice(supabase, { invoiceId, businessId });
}
