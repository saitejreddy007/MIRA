import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WhiteMirrorAttribution } from '@/components/brand/WhiteMirrorAttribution';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (profile?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('onboarding_complete')
      .eq('id', profile.business_id)
      .single();

    if (business?.onboarding_complete) {
      redirect('/overview');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <div className="py-6 flex justify-center animate-fade-in stagger-3">
        <WhiteMirrorAttribution />
      </div>
    </div>
  );
}
