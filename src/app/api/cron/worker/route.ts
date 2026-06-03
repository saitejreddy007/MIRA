import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { processQueue } from '@/features/follow-ups/actions/process-queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('worker: unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const supabase = createServiceRoleClient();
    const result = await processQueue(supabase, { maxDurationMs: 8000, maxJobs: 1 });
    const duration = Date.now() - start;
    logger.info({ jobsHandled: result.jobsHandled, duration_ms: duration }, 'worker: completed');

    return NextResponse.json({
      processed: result.processed,
      jobsHandled: result.jobsHandled,
      duration_ms: duration,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, 'worker: failed');
    return NextResponse.json(
      { error: msg, duration_ms: Date.now() - start },
      { status: 500 }
    );
  }
}
