'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateBusiness(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: 'Not authenticated' };

  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) return { error: 'Business not found' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Business name is required' };

  const maxFollowUpDays = parseInt((formData.get('max_follow_up_days') as string)?.trim()) || 45;
  const autoEscalationDays = parseInt((formData.get('auto_escalation_after_days') as string)?.trim()) || 7;
  const ownerPhone = (formData.get('phone') as string)?.trim() || null;

  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      industry: (formData.get('industry') as string)?.trim() || null,
      region: (formData.get('region') as string)?.trim() || null,
      phone: ownerPhone,
      max_follow_up_days: Math.max(1, Math.min(365, maxFollowUpDays)),
      auto_escalation_after_days: Math.max(1, Math.min(90, autoEscalationDays)),
    })
    .eq('id', userData.business_id);

  if (error) return { error: error.message };
  return { success: true };
}
