import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsForm } from './settings-form';
import { PageHeader } from '@/components/layout/PageHeader';
import { IconTile } from '@/components/shared/IconTile';
import { Settings as SettingsIcon, User as UserIcon, Building2 as BuildingIcon } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('name, email, business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) redirect('/onboarding');

  const { data: business } = await supabase
    .from('businesses')
    .select('name, industry, region, onboarding_complete, max_follow_up_days, auto_escalation_after_days, phone')
    .eq('id', userData.business_id)
    .single();

  return (
    <>
      <div className="glass-card p-6 mb-4 animate-fade-up stagger-1">
        <div className="flex items-center gap-3 mb-6">
          <IconTile icon={BuildingIcon} size="lg" tone="brand" />
          <div>
            <h2 className="font-display text-base font-semibold">Business profile</h2>
            <p className="text-xs text-muted-foreground">How MIRA represents you</p>
          </div>
        </div>
        <SettingsForm
          businessName={business?.name || ''}
          industry={business?.industry || ''}
          region={business?.region || 'IN'}
          maxFollowUpDays={business?.max_follow_up_days ?? 45}
          autoEscalationAfterDays={business?.auto_escalation_after_days ?? 7}
          ownerEmail={userData.email || authData.user.email}
          ownerPhone={business?.phone}
        />
      </div>

      <div className="glass-card p-6 animate-fade-up stagger-2">
        <div className="flex items-center gap-3 mb-4">
          <IconTile icon={UserIcon} size="lg" tone="muted" />
          <div>
            <h2 className="font-display text-base font-semibold">Account</h2>
            <p className="text-xs text-muted-foreground">Your sign-in details</p>
          </div>
        </div>
        <dl className="divide-y divide-border/40 -mx-2">
          <div className="flex items-center justify-between px-2 py-3">
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-sm font-semibold text-foreground">{userData.name || '—'}</dd>
          </div>
          <div className="flex items-center justify-between px-2 py-3">
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="text-sm font-semibold text-foreground">{userData.email || authData.user.email}</dd>
          </div>
        </dl>
      </div>

      <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mt-10">
        A WhiteMirror product
      </p>
    </>
  );
}
