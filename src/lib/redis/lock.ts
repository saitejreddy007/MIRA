import { getRedis } from './client';
import { logger } from '@/lib/logger';

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export type LockOptions = {
  ttlSeconds?: number;
  retries?: number;
  retryDelayMs?: number;
};

export type LockHandle = {
  key: string;
  token: string;
  release: () => Promise<boolean>;
};

export async function acquireLock(key: string, ttlSeconds: number = 30): Promise<LockHandle | null> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const result = await getRedis().set(key, token, { nx: true, ex: ttlSeconds });
  if (result !== 'OK') return null;
  return {
    key,
    token,
    release: async () => {
      try {
        const released = (await getRedis().eval(RELEASE_LOCK_LUA, [key], [token])) as unknown as number;
        return released === 1;
      } catch (err) {
        logger.warn({ key, err: err instanceof Error ? err.message : String(err) }, 'lock release failed');
        return false;
      }
    },
  };
}

export async function withBusinessLock<T>(
  businessId: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T | { skipped: true; reason: 'locked' }> {
  const { ttlSeconds = 30, retries = 0, retryDelayMs = 100 } = options;
  const key = `mira:lock:business:${businessId}`;

  let handle: LockHandle | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    handle = await acquireLock(key, ttlSeconds);
    if (handle) break;
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  if (!handle) {
    logger.info({ businessId, key }, 'lock: another worker holds the business lock, skipping');
    return { skipped: true, reason: 'locked' };
  }

  try {
    return await fn();
  } finally {
    await handle.release();
  }
}
