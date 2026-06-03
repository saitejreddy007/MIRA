'use client';

import { useState } from 'react';
import { updateBusiness } from '@/features/settings/actions/update-business';
import { Building2, Globe, Tag, Loader2, Check, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  businessName: string;
  industry: string;
  region: string;
  maxFollowUpDays: number;
  autoEscalationAfterDays: number;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
}

export function SettingsForm({ businessName, industry, region, maxFollowUpDays, autoEscalationAfterDays, ownerEmail, ownerPhone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateBusiness(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 block">Business name</label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              name="name"
              type="text"
              required
              suppressHydrationWarning
              defaultValue={businessName}
              className="pl-10"
              placeholder="Your business name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Industry</label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
              <Input
                name="industry"
                type="text"
                suppressHydrationWarning
                defaultValue={industry}
                className="pl-10"
                placeholder="e.g. Software"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Region</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
              <select
                name="region"
                defaultValue={region}
                suppressHydrationWarning
                className="flex h-10 w-full rounded-xl border border-border bg-white/60 dark:bg-white/5 pl-10 pr-3.5 py-2 text-sm transition-all duration-500 ease-spring hover:border-border/80 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/15 backdrop-blur-sm appearance-none"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="AE">UAE</option>
                <option value="SG">Singapore</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
                <option value="EU">Europe</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40 pt-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Owner contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Email <span className="font-normal text-muted-foreground/80">(from address)</span></label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                name="owner_email"
                type="email"
                suppressHydrationWarning
                defaultValue={ownerEmail || ''}
                className="pl-10"
                readOnly
                disabled
                title="Your account email address is used here."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Phone <span className="font-normal text-muted-foreground/80">(in signature)</span></label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                name="phone"
                type="tel"
                suppressHydrationWarning
                defaultValue={ownerPhone || ''}
                className="pl-10"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 mt-2.5 leading-relaxed">
          Emails are sent from this address via the connected Gmail account (Settings → Email). Phone appears in the footer.
        </p>
      </div>

      <div className="border-t border-border/40 pt-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Follow-up pipeline
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Max follow-up days</label>
            <Input
              name="max_follow_up_days"
              type="number"
              min="1"
              max="365"
              suppressHydrationWarning
              defaultValue={maxFollowUpDays}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Auto-escalate after days</label>
            <Input
              name="auto_escalation_after_days"
              type="number"
              min="1"
              max="90"
              suppressHydrationWarning
              defaultValue={autoEscalationAfterDays}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 mt-2.5 leading-relaxed">
          Messages stop after max days. Escalate to human if no response after this many days past due.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={loading} suppressHydrationWarning>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            'Save changes'
          )}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Business profile updated
          </span>
        )}
      </div>
    </form>
  );
}
