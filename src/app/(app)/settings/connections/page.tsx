import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConnectionsSettingsClient } from './connections-client';

export default async function ConnectionsSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/login');

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();

  if (!user?.business_id) redirect('/onboarding');

  const { data: business } = await supabase
    .from('businesses')
    .select('owner_email, gmail_refresh_token')
    .eq('id', user.business_id)
    .single();

  return (
    <ConnectionsSettingsClient
      gmailConnected={!!(business?.gmail_refresh_token)}
      gmailEmail={business?.owner_email || ''}
    />
  );
}
