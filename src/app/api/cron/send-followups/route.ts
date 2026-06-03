import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { dispatch } from '@/features/follow-ups/actions/dispatch';
import { processQueue } from '@/features/follow-ups/actions/process-queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('cron: unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  logger.info('cron: send-followups started');

  try {
    const supabase = createServiceRoleClient();
    const dispatchResult = await dispatch(supabase);
    const queueResult = await processQueue(supabase, { maxDurationMs: 6000, maxJobs: 5 });
    const duration = Date.now() - start;
    logger.info(
      {
        enqueued: dispatchResult.invoicesEnqueued,
        processed: queueResult.jobsHandled,
        duration_ms: duration,
      },
      'cron: send-followups completed'
    );

    return NextResponse.json({
      enqueued: dispatchResult.invoicesEnqueued,
      processed: queueResult.jobsHandled,
      perBusiness: dispatchResult.perBusiness,
      errors: [...dispatchResult.errors, ...queueResult.errors],
      duration_ms: duration,
    });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'cron: send-followups failed');
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Pipeline error',
      duration_ms: Date.now() - start,
    }, { status: 500 });
  }
}

export const GET = POST;
