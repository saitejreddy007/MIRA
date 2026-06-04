import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WhiteMirrorAttribution } from '@/components/brand/WhiteMirrorAttribution';

export const maxDuration = 60;

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
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
  } catch (err: any) {
    // Next.js redirect throws a special redirect error that should not be caught and rendered as a normal error
    if (err && err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
        <div className="max-w-md w-full border border-destructive/20 rounded-2xl p-6 bg-destructive/5 space-y-4">
          <h2 className="text-lg font-bold text-destructive">Onboarding Layout Crash</h2>
          <p className="text-sm font-semibold">{err?.message || String(err)}</p>
          <pre className="text-left text-xs bg-muted p-4 rounded overflow-auto max-h-60 text-muted-foreground whitespace-pre-wrap">
            {err?.stack || 'No stack trace available'}
          </pre>
        </div>
      </div>
    );
  }
}
