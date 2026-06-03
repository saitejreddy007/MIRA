'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBusiness } from '@/features/settings/actions/update-business';
import { Building2, Globe, Tag, Loader2, Mail, Phone, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BusinessOnboardingClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateBusiness(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push('/onboarding/questions');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-xl w-full">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Step 1 of 5
            </p>
            <p className="text-xs font-semibold text-primary">Business Profile</p>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700 w-1/5" />
          </div>
        </div>

        <Card className="p-6 md:p-8 animate-fade-up stagger-1">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
              Tell us about your business
            </h1>
            <p className="text-sm text-muted-foreground">
              MIRA uses this to properly represent you when sending out follow-up emails and messages.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Business name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                  <Input name="name" type="text" required className="pl-10" placeholder="Your business name" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Industry</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
                    <Input name="industry" type="text" className="pl-10" placeholder="e.g. Software, Agency" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Region</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
                    <select
                      name="region"
                      defaultValue="US"
                      className="flex h-10 w-full rounded-xl border border-border bg-white/60 dark:bg-white/5 pl-10 pr-3.5 py-2 text-sm transition-all duration-500 ease-spring hover:border-border/80 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/15 backdrop-blur-sm appearance-none"
                    >
                      <option value="US">United States</option>
                      <option value="IN">India</option>
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
                Owner contact (For email signatures)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                    <Input value={userEmail} readOnly disabled type="email" className="pl-10" title="Your account email address is used here." />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                    <Input name="phone" type="tel" className="pl-10" placeholder="+1 234 567 890" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} variant="primary" className="group">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue
                {!loading && <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
