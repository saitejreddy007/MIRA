import type { SupabaseClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/redis/client';
import { withBusinessLock } from '@/lib/redis/lock';
import { withIdempotency, dailyInvoiceKey } from '@/lib/redis/idempotency';
import { processInvoice } from './process-invoice';
import { logger } from '@/lib/logger';

const QUEUE_KEY = 'mira:queue:any';
const DEFAULT_MAX_DURATION_MS = 8000;
const DEFAULT_POLL_INTERVAL_MS = 150;
const DEFAULT_MAX_JOBS = 50;

export type DispatchJob = {
  invoiceId: number;
  businessId: string;
  enqueuedAt: string;
};

export type ProcessQueueResult = {
  processed: Array<{ invoiceId: number; businessId: string; outcome: string; reason?: string }>;
  jobsHandled: number;
  duration_ms: number;
  errors: string[];
};

function isDispatchJob(value: unknown): value is DispatchJob {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.invoiceId === 'number' && typeof v.businessId === 'string';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processQueue(
  supabase: SupabaseClient,
  options: { maxDurationMs?: number; maxJobs?: number; pollIntervalMs?: number } = {}
): Promise<ProcessQueueResult> {
  const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
  const maxJobs = options.maxJobs ?? DEFAULT_MAX_JOBS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const start = Date.now();
  const processed: ProcessQueueResult['processed'] = [];
  const errors: string[] = [];
  let jobsHandled = 0;

  let redis;
  try {
    redis = getRedis();
  } catch (err) {
    errors.push(`redis unavailable: ${err instanceof Error ? err.message : 'unknown'}`);
    return { processed, jobsHandled, duration_ms: Date.now() - start, errors };
  }

  let idleIterations = 0;
  const MAX_IDLE_ITERATIONS = 3;

  while (Date.now() - start < maxDurationMs && jobsHandled < maxJobs) {
    const popped = (await redis.rpop(QUEUE_KEY)) as string | null;
    if (!popped) {
      idleIterations++;
      if (idleIterations >= MAX_IDLE_ITERATIONS) break;
      await sleep(pollIntervalMs);
      continue;
    }
    idleIterations = 0;

    let job: DispatchJob;
    try {
      const parsed = JSON.parse(popped);
      if (!isDispatchJob(parsed)) {
        logger.warn({ raw: popped.slice(0, 200) }, 'processQueue: invalid job payload, dropping');
        continue;
      }
      job = parsed;
    } catch (parseErr) {
      logger.warn({ raw: popped.slice(0, 200), err: parseErr instanceof Error ? parseErr.message : String(parseErr) }, 'processQueue: failed to parse job');
      continue;
    }

    const { invoiceId, businessId } = job;
    const idemKey = dailyInvoiceKey(invoiceId);

    try {
      const lockResult = await withBusinessLock(businessId, async () => {
        const idemResult = await withIdempotency(idemKey, async () => {
          return processInvoice(supabase, { invoiceId, businessId });
        });
        if (!idemResult.executed) {
          return { outcome: 'skipped_duplicate' as const };
        }
        return idemResult.result;
      });

      if ('skipped' in lockResult && lockResult.skipped) {
        processed.push({ invoiceId, businessId, outcome: 'skipped_locked' });
      } else {
        const r = lockResult as Awaited<ReturnType<typeof processInvoice>> | { outcome: 'skipped_duplicate' };
        processed.push({
          invoiceId,
          businessId,
          outcome: r.outcome,
          reason: 'reason' in r ? r.reason : undefined,
        });
      }
    } catch (jobErr) {
      const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
      errors.push(`invoice ${invoiceId} (business ${businessId}): ${msg}`);
      processed.push({ invoiceId, businessId, outcome: 'error', reason: msg });
    }

    jobsHandled++;
  }

  return { processed, jobsHandled, duration_ms: Date.now() - start, errors };
}
