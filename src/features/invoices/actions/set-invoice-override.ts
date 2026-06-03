'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const SetOverrideSchema = z.object({
  invoiceId: z.number().int().positive(),
  override: z.enum(['pause', 'stop']).nullable(),
});

export async function setInvoiceOverride(input: { invoiceId: number; override: 'pause' | 'stop' | null }) {
  const parsed = SetOverrideSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input' };
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
    .select('id, business_id, status, owner_override, invoice_number, amount, currency')
    .eq('id', parsed.data.invoiceId)
    .eq('business_id', user.business_id)
    .single();

  if (invError || !invoice) {
    return { error: 'Invoice not found' };
  }

  const { error } = await supabase
    .from('invoices')
    .update({ owner_override: parsed.data.override })
    .eq('id', parsed.data.invoiceId);

  if (error) {
    logger.error({ invoiceId: parsed.data.invoiceId, err: error.message }, 'setInvoiceOverride failed');
    return { error: 'Failed to update invoice' };
  }

  logger.info({
    invoiceId: parsed.data.invoiceId,
    invoiceNumber: invoice.invoice_number,
    businessId: user.business_id,
    actorUserId: auth.user.id,
    previousOverride: invoice.owner_override,
    newOverride: parsed.data.override,
    action: 'set_invoice_override',
  }, 'invoice override changed');

  return { success: true };
}
