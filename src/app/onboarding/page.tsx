import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Mic, Lock, Building2, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/shared/IconTile';

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (authData?.user) {
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
  }

  const steps = [
    {
      icon: Building2,
      title: 'Business profile',
      description: 'How MIRA represents your company',
    },
    {
      icon: MessageSquare,
      title: 'Answer 9 questions',
      description: 'About your communication style and preferences',
    },
    {
      icon: Mail,
      title: 'Connect Gmail (Optional)',
      description: 'Authorize MIRA to send follow-ups',
    },
    {
      icon: Mic,
      title: 'Voice match game',
      description: 'Rate email options so MIRA learns your exact tone',
    },
    {
      icon: Lock,
      title: 'Lock your Constitution',
      description: 'MIRA\'s rulebook for writing in your voice',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-lg w-full">
        <div className="flex justify-center mb-8 animate-fade-up">
          <Logo size={48} withWordmark />
        </div>

        <div className="text-center space-y-3 mb-8 animate-fade-up stagger-1">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Let&apos;s teach MIRA your voice
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            MIRA will follow up on overdue invoices in your voice — warm, direct, or somewhere in between. First, we need to understand how you communicate.
          </p>
        </div>

        <Card className="p-6 mb-6 animate-fade-up stagger-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            What to expect
          </h2>
          <ol className="space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <li key={idx} className="flex items-start gap-3">
                  <IconTile icon={Icon} size="md" tone="default" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {idx + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-3 animate-fade-up stagger-3">
          <Link href="/onboarding/business" className="btn-primary w-full h-12 text-base justify-center group">
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            You can pause anytime — your progress is saved automatically
          </p>
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mt-2">
            A WhiteMirror product
          </p>
        </div>
      </div>
    </div>
  );
}
