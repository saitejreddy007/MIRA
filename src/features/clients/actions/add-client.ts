'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeSegment } from '@/lib/segments';

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id as string | null;
}

export async function addClient(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: 'Not authenticated' };

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) return { error: 'Business not found' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Client name is required' };

  const segment = normalizeSegment((formData.get('segment') as string)?.trim());

  const rawEmail = (formData.get('email') as string)?.trim();
  const email = rawEmail ? rawEmail.toLowerCase() : null;

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      business_id: businessId,
      name,
      email,
      phone: (formData.get('phone') as string)?.trim() || null,
      company: (formData.get('company') as string)?.trim() || null,
      notes: (formData.get('notes') as string)?.trim() || null,
      segment,
    })
    .select('id')
    .single();

  if (clientError) return { error: clientError.message };

  const invoiceNumber = (formData.get('invoice_number') as string)?.trim();
  const amount = (formData.get('amount') as string)?.trim();

  if (invoiceNumber && amount) {
    const { error: invoiceError } = await supabase.from('invoices').insert({
      business_id: businessId,
      client_id: client.id,
      invoice_number: invoiceNumber,
      amount: parseFloat(amount),
      due_date: (formData.get('due_date') as string) || new Date().toISOString().split('T')[0],
      description: (formData.get('description') as string)?.trim() || null,
      status: 'pending',
    });

    if (invoiceError) {
      await supabase.from('clients').delete().eq('id', client.id);
      return { error: `Invoice error: ${invoiceError.message}` };
    }
  }

  return { success: true, clientId: client.id };
}
