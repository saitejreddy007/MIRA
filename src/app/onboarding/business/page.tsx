import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BusinessOnboardingClient from './business-client';

export default async function BusinessOnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/login');

  return <BusinessOnboardingClient userEmail={auth.user.email || ''} />;
}
