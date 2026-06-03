'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { processInvoice } from '@/features/follow-ups/actions/process-invoice';

export async function sendFollowUp(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Not authenticated' };

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();
  if (!user?.business_id) return { error: 'Business not found' };

  const numericInvoiceId = Number(invoiceId);
  if (!Number.isFinite(numericInvoiceId) || numericInvoiceId <= 0) {
    return { error: 'Invalid invoice id' };
  }

  const { data: existing } = await supabase
    .from('invoices')
    .select('id, status, clients!inner(email)')
    .eq('id', numericInvoiceId)
    .eq('business_id', user.business_id)
    .single();

  if (!existing) return { error: 'Invoice not found' };
  if (existing.status === 'paid' || existing.status === 'cancelled') {
    return { error: `Invoice is already ${existing.status}` };
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('max_follow_up_days')
    .eq('id', user.business_id)
    .single();

  const maxMessages =
    typeof business?.max_follow_up_days === 'number' && business.max_follow_up_days > 0
      ? Math.min(business.max_follow_up_days, 10)
      : 3;

  // Only count successfully sent messages — failed attempts don't consume quota
  const { count: messagesSent } = await supabase
    .from('follow_ups')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', numericInvoiceId)
    .eq('business_id', user.business_id)
    .eq('status', 'sent');

  const position = Math.min(messagesSent ?? 0, maxMessages);
  if (position >= maxMessages) {
    return { error: `Maximum follow-up limit reached (${maxMessages} messages). Pause or edit the sequence to send more.` };
  }

  const serviceClient = createServiceRoleClient();
  const result = await processInvoice(serviceClient, {
    invoiceId: numericInvoiceId,
    businessId: user.business_id,
    forcePosition: position,
  });

  if (result.outcome === 'sent') {
    return { success: true, followUpId: result.followUpId };
  }
  if (result.outcome === 'skipped_wait') {
    return { error: `Cannot send yet: ${result.reason}` };
  }
  if (result.outcome === 'skipped_stop') {
    return { error: `Sequence stopped: ${result.reason}` };
  }
  if (result.outcome === 'escalated') {
    return { error: `Escalated to human: ${result.reason}` };
  }
  return { error: result.error };
}
