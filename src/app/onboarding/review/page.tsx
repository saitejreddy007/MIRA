'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ConstitutionPreview } from '@/features/voice/components/ConstitutionPreview';
import { generateConstitution, lockConstitution } from '@/features/voice/actions/lock-constitution';
import type { VoiceConstitution } from '@/features/voice/types';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function OnboardingReviewPage() {
  const router = useRouter();
  const [constitution, setConstitution] = useState<VoiceConstitution | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | undefined>();
  const [confidenceFlag, setConfidenceFlag] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateConstitution()
      .then((result) => {
        if (result?.constitution) {
          setConstitution(result.constitution);
          setConfidenceScore(result.confidence?.score);
          setConfidenceFlag(result.confidence?.flag);
        } else if (result?.error) {
          setError(result.error);
        } else {
          setError('Could not generate your constitution. Please go back and try again.');
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLock = async () => {
    if (!constitution) return;
    setIsLocking(true);
    setError(null);
    try {
      const result = await lockConstitution(constitution, {
        score: confidenceScore ?? 0,
        flag: confidenceFlag ?? 'unknown',
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Generating your voice constitution...</p>
        </div>
      </div>
    );
  }

  if (error && !constitution) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-6 max-w-md text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary h-10 text-sm"
            >
              Try again
            </button>
            <button
              onClick={() => router.push('/onboarding/questions')}
              className="btn-ghost h-10 text-sm"
            >
              Back to questions
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full animate-fade-up">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-2">
            Step 5 of 5
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Your Voice Constitution
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This is MIRA&apos;s rulebook for writing in your voice. Review and lock it in.
          </p>
        </div>

        <Card className="p-6 sm:p-8 animate-fade-up stagger-1">
          {constitution && (
            <ConstitutionPreview
              constitution={constitution}
              onLock={handleLock}
              loading={isLocking}
              confidenceScore={confidenceScore}
              confidenceFlag={confidenceFlag}
            />
          )}
        </Card>

        {error && (
          <p className="text-xs text-destructive mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
