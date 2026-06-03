'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isValidSegment } from '@/lib/segments';

export async function updateClientSegment(clientId: number, segment: string) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: 'Not authenticated' };

  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) return { error: 'Business not found' };

  if (!isValidSegment(segment)) {
    return { error: 'Invalid segment' };
  }

  const { error } = await supabase
    .from('clients')
    .update({ segment })
    .eq('id', clientId)
    .eq('business_id', userData.business_id);

  if (error) return { error: error.message };
  return { success: true };
}
