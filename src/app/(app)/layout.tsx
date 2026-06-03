import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeaderToolbar } from '@/components/layout/HeaderToolbar';
import { Toaster } from '@/components/ui/toast';
import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette';
import { GlobalNotifications } from '@/components/layout/GlobalNotifications';

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, business_id')
    .eq('id', authData.user.id)
    .single();

  let companyName = 'MIRA';
  let userName = '';
  let userEmail = authData.user.email || '';
  let onboarded = false;

  if (profile) {
    userName = profile.name || '';
    const { data: business } = await supabase
      .from('businesses')
      .select('name, onboarding_complete')
      .eq('id', profile.business_id)
      .single();

    if (business) {
      companyName = business.name || 'MIRA';
      onboarded = business.onboarding_complete ?? false;
    }
  }

  if (!onboarded) redirect('/onboarding');

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          companyName={companyName}
          userName={userName}
          userEmail={userEmail}
        />
        <div className="flex flex-1 min-w-0 min-h-0 flex-col">
          <HeaderToolbar
            userName={userName}
            userEmail={userEmail}
            companyName={companyName}
          />
          <main className="flex-1 min-h-0 overflow-y-auto pt-4 sm:pt-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
      <GlobalCommandPalette />
      <GlobalNotifications />
    </>
  );
}
