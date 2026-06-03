import { getCalibrationReview } from '@/features/voice/actions/get-calibration-review';
import { CalibrationReviewClient } from '@/features/voice/components/calibration-review-client';

export const dynamic = 'force-dynamic';

export default async function CalibrationPage() {
  const { data, error } = await getCalibrationReview();

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/8 animate-fade-up">
        <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
        <a
          href="/settings/voice"
          className="text-sm text-rose-700 dark:text-rose-400 underline underline-offset-4 mt-2 inline-block hover:text-rose-900 dark:hover:text-rose-200"
        >
          Go to voice setup →
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 bg-foreground/8 rounded w-1/3 mb-4" />
        <div className="h-32 bg-foreground/8 rounded" />
      </div>
    );
  }

  return <CalibrationReviewClient review={data} />;
}
