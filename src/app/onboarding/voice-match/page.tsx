'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CalibrationRound } from '@/features/voice/components/CalibrationRound';
import { VoiceMatchProgress } from '@/features/voice/components/VoiceMatchProgress';
import { getCalibrationRounds, saveCalibrationResults } from '@/features/voice/actions/submit-voice-match';
import type { CalibrationRoundData } from '@/features/voice/types';
import { Loader2, AlertTriangle } from 'lucide-react';

const TOTAL_ROUNDS = 5;

export default function OnboardingVoiceMatchPage() {
  const router = useRouter();
  const [currentRound, setCurrentRound] = useState(0);
  const [selections, setSelections] = useState<Map<number, 'A' | 'B'>>(new Map());
  const [rounds, setRounds] = useState<CalibrationRoundData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCalibrationRounds()
      .then((result) => {
        if (result?.rounds) {
          setRounds(result.rounds);
        } else if (result?.error) {
          setError(result.error);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load rounds'))
      .finally(() => setIsLoading(false));
  }, []);

  const currentData = rounds[currentRound];
  const allComplete = selections.size === TOTAL_ROUNDS;

  const handleSelect = useCallback(
    (roundIndex: number, choice: 'A' | 'B') => {
      setSelections((prev) => {
        const next = new Map(prev);
        next.set(roundIndex, choice);
        return next;
      });

      if (roundIndex === currentRound && currentRound < TOTAL_ROUNDS - 1) {
        setTimeout(() => setCurrentRound((s) => s + 1), 300);
      }
    },
    [currentRound],
  );

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await saveCalibrationResults(rounds);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push('/onboarding/review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preparing calibration rounds...</p>
        </div>
      </div>
    );
  }

  if (error && rounds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-6 max-w-md text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary h-10 text-sm"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full animate-fade-up">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Step 4 of 5
            </p>
            <p className="text-xs text-muted-foreground">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </p>
          </div>
          <VoiceMatchProgress
            current={currentRound + 1}
            total={TOTAL_ROUNDS}
            isComplete={allComplete}
          />
        </div>

        {currentData && (
          <CalibrationRound
            round={currentData}
            roundIndex={currentRound}
            selected={selections.get(currentRound) ?? null}
            onSelect={handleSelect}
          />
        )}

        <div className="flex justify-center mt-6 animate-fade-up stagger-2">
          {allComplete && (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="btn-primary h-10 px-6 text-sm gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to review'
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
