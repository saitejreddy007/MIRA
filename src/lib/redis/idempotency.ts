import { getRedis } from './client';
import { logger } from '@/lib/logger';
import { dayBucket } from '@/lib/dates';

const DEFAULT_TTL_SECONDS = 86400;

export type IdempotencyResult<T> =
  | { executed: true; result: T }
  | { executed: false; reason: 'duplicate' };

export async function claimKey(key: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<boolean> {
  const result = await getRedis().set(key, '1', { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<IdempotencyResult<T>> {
  const claimed = await claimKey(key, ttlSeconds);
  if (!claimed) {
    logger.info({ key }, 'idempotency: duplicate skipped');
    return { executed: false, reason: 'duplicate' };
  }
  try {
    const result = await fn();
    return { executed: true, result };
  } catch (err) {
    try {
      await getRedis().del(key);
    } catch (delErr) {
      logger.warn({ key, err: delErr instanceof Error ? delErr.message : String(delErr) }, 'idempotency: failed to release key on error');
    }
    throw err;
  }
}

export function followupKey(invoiceId: number | string, position: number, bucket: string = dayBucket()): string {
  return `mira:idem:followup:${invoiceId}:${position}:${bucket}`;
}

export function dailyInvoiceKey(invoiceId: number | string, bucket: string = dayBucket()): string {
  return `mira:idem:invoice:${invoiceId}:${bucket}`;
}
