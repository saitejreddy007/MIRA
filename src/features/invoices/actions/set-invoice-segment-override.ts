'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const VALID_SEGMENTS = ['A', 'B', 'C', 'D', 'E'] as const;

const SetSegmentSchema = z.object({
  invoiceId: z.number().int().positive(),
  segment: z.enum(VALID_SEGMENTS).nullable(),
});

export async function setInvoiceSegmentOverride(input: { invoiceId: number; segment: 'A' | 'B' | 'C' | 'D' | 'E' | null }) {
  const parsed = SetSegmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid segment value' };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Not authenticated' };

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();
  if (!user?.business_id) return { error: 'Business not found' };

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('id, business_id, segment_override, invoice_number')
    .eq('id', parsed.data.invoiceId)
    .eq('business_id', user.business_id)
    .single();

  if (invError || !invoice) {
    return { error: 'Invoice not found' };
  }

  const { error } = await supabase
    .from('invoices')
    .update({ segment_override: parsed.data.segment })
    .eq('id', parsed.data.invoiceId);

  if (error) {
    logger.error({ invoiceId: parsed.data.invoiceId, err: error.message }, 'setInvoiceSegmentOverride failed');
    return { error: 'Failed to update segment' };
  }

  logger.info({
    invoiceId: parsed.data.invoiceId,
    invoiceNumber: invoice.invoice_number,
    businessId: user.business_id,
    actorUserId: auth.user.id,
    previousSegment: invoice.segment_override,
    newSegment: parsed.data.segment,
    action: 'set_segment_override',
  }, 'invoice segment override changed');

  return { success: true };
}
