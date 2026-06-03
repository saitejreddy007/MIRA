'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateInvoice(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Not authenticated' };

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();
  if (!user?.business_id) return { error: 'Business not found' };

  const invoiceId = formData.get('invoice_id') as string;
  if (!invoiceId) return { error: 'Invoice ID required' };

  const updates: Record<string, string | number | null> = {};

  const dueDate = formData.get('due_date') as string;
  const amount = formData.get('amount') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string;

  if (dueDate) updates.due_date = dueDate;
  if (amount) updates.amount = amount;
  if (description !== null) updates.description = description || null;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) return { error: 'No fields to update' };

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .eq('business_id', user.business_id);

  if (error) return { error: error.message };
  return { success: true };
}
