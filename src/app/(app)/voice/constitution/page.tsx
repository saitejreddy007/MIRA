import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, HelpCircle, Shield, History, Mic, Sparkles } from 'lucide-react';
import { RegenerateConstitutionButton } from '@/features/voice/components/regenerate-constitution-button';
import { IconTile } from '@/components/shared/IconTile';
import { cn } from '@/lib/utils';

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground/70 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-10 text-right font-semibold">
        {score}/100
      </span>
    </div>
  );
}

function confidenceColor(score: number) {
  if (score >= 70) return { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' };
  if (score >= 40) return { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' };
  return { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' };
}

export default async function VoiceSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', authData.user.id)
    .single();

  if (!userData?.business_id) redirect('/onboarding');

  const { data: constitution } = await supabase
    .from('constitutions')
    .select('*')
    .eq('business_id', userData.business_id)
    .order('locked_at', { ascending: false })
    .limit(1)
    .single();

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('dimensions')
    .eq('business_id', userData.business_id)
    .single();

  const dims = voiceProfile?.dimensions?.final
    ?? (constitution?.content && typeof constitution.content === 'object' ? (constitution.content as Record<string, unknown>).voice_dimensions : null)
    ?? null;

  const cognitivePattern = typeof dims?.cognitive_pattern === 'string'
    ? dims.cognitive_pattern
    : 'context_first';

  const warmth = typeof dims?.warmth === 'number' ? dims.warmth : 50;
  const formality = typeof dims?.formality === 'number' ? dims.formality : 50;
  const directness = typeof dims?.directness === 'number' ? dims.directness : 50;
  const tensionTolerance = typeof dims?.tension_tolerance === 'number' ? dims.tension_tolerance : 50;

  const confidenceScore = constitution?.confidence_score != null ? Math.round(Number(constitution.confidence_score)) : null;
  const confidenceFlag = constitution?.confidence_flag || '';

  return (
    <div className="max-w-2xl">
      {!constitution ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="inline-flex mb-3">
            <IconTile icon={HelpCircle} size="xl" tone="muted" />
          </div>
          <h3 className="font-display text-base font-semibold mb-1">No constitution locked yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete the onboarding flow to generate and lock your voice constitution.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card p-6 mb-4 animate-fade-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <IconTile icon={Mic} size="sm" tone="brand" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Constitution v{constitution.version}
                </h2>
              </div>
              {confidenceFlag && (
                <div className="flex items-center gap-1.5 text-sm">
                  {confidenceFlag.includes('High') ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : confidenceFlag.includes('Moderate') ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  )}
                  <span className={cn(
                    'font-semibold',
                    confidenceFlag.includes('High') && 'text-emerald-700 dark:text-emerald-400',
                    confidenceFlag.includes('Moderate') && 'text-amber-700 dark:text-amber-400',
                    !confidenceFlag.includes('High') && !confidenceFlag.includes('Moderate') && 'text-rose-700 dark:text-rose-400'
                  )}>
                    {confidenceFlag}
                  </span>
                </div>
              )}
            </div>
            {confidenceScore !== null && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Confidence score</span>
                  <span className={cn('text-sm font-bold font-mono', confidenceColor(confidenceScore).text)}>
                    {confidenceScore}/100
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      confidenceColor(confidenceScore).dot
                    )}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground/80">
              Locked {new Date(constitution.locked_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {dims && (
            <div className="glass-card p-6 mb-4 animate-fade-up stagger-1">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
                Voice dimensions
              </h2>
              <div className="space-y-3">
                <ScoreBar label="Warmth" score={warmth} />
                <ScoreBar label="Formality" score={formality} />
                <ScoreBar label="Directness" score={directness} />
                <ScoreBar label="Tension Tolerance" score={tensionTolerance} />
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-sm text-foreground/70 w-32 shrink-0">Cognitive Pattern</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full bg-secondary text-foreground">
                    <Sparkles className="h-3 w-3" strokeWidth={2.25} />
                    {cognitivePattern.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6 animate-fade-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Voice summary
              </h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Your voice constitution is securely stored and powers all auto-generated messages.
            </p>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground/80 leading-relaxed">
              <Shield className="h-3 w-3 mt-0.5 shrink-0" />
              <p>
                Your full constitution is proprietary — stored securely and never displayed in full
                to protect your voice IP.
              </p>
            </div>

            <div className="mt-5 pt-5 border-t border-border/40 space-y-4">
              <div>
                <RegenerateConstitutionButton />
                <p className="text-xs text-muted-foreground/80 mt-2.5 leading-relaxed">
                  Re-runs AI assembly with your latest answers and calibration. Previous constitution is archived.
                </p>
              </div>
              <Link
                href="/voice/constitution/calibration"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-500 ease-spring group"
              >
                <History className="h-3.5 w-3.5" strokeWidth={2.25} />
                Review A/B calibration rounds
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
