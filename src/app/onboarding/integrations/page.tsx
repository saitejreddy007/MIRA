import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConnectionsSettingsClient } from '@/app/(app)/settings/connections/connections-client';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function IntegrationsOnboardingPage() {
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

  const gmailConnected = !!(business?.gmail_refresh_token);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Step 3 of 5
            </p>
            <p className="text-xs font-semibold text-primary">Connect Integrations</p>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700 w-3/5" />
          </div>
        </div>

        <div className="mb-8 animate-fade-up stagger-1">
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
            Connect your inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Allow MIRA to send follow-up emails on your behalf. This is optional but highly recommended.
          </p>
        </div>

        <ConnectionsSettingsClient
          gmailConnected={!!(business?.gmail_refresh_token)}
          gmailEmail={business?.owner_email || ''}
          source="onboarding"
        />

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/40 animate-fade-up stagger-2">
          <Link
            href="/onboarding/voice-match"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-500 ease-spring"
          >
            Skip for now
          </Link>
          <Link
            href="/onboarding/voice-match"
            className="btn-primary group"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
