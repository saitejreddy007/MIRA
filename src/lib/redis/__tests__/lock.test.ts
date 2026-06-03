import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  eval: vi.fn(),
};

vi.mock('../client', () => ({
  getRedis: () => mockRedis,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { acquireLock, withBusinessLock, type LockHandle } from '../lock';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('acquireLock', () => {
  it('returns a handle when SET NX succeeds', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const handle = await acquireLock('mira:lock:business:abc', 30);
    expect(handle).not.toBeNull();
    expect(handle?.key).toBe('mira:lock:business:abc');
    expect(handle?.token).toMatch(/.+/);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'mira:lock:business:abc',
      expect.stringMatching(/.+/),
      { nx: true, ex: 30 }
    );
  });

  it('returns null when SET NX fails (key already exists)', async () => {
    mockRedis.set.mockResolvedValueOnce(null);
    const handle = await acquireLock('mira:lock:business:abc', 30);
    expect(handle).toBeNull();
  });
});

describe('withBusinessLock', () => {
  it('executes the function when lock is acquired', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const fn = vi.fn().mockResolvedValue('result');
    const result = await withBusinessLock('biz-1', fn);
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns skipped: true when lock is held by another worker', async () => {
    mockRedis.set.mockResolvedValueOnce(null);
    const fn = vi.fn();
    const result = await withBusinessLock('biz-1', fn);
    expect(result).toEqual({ skipped: true, reason: 'locked' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('releases lock on success', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.eval.mockResolvedValueOnce(1);
    const result = await withBusinessLock('biz-1', async () => 'ok');
    expect(result).toBe('ok');
    expect(mockRedis.eval).toHaveBeenCalledTimes(1);
  });

  it('releases lock even when function throws', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.eval.mockResolvedValueOnce(1);
    await expect(
      withBusinessLock('biz-1', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    expect(mockRedis.eval).toHaveBeenCalledTimes(1);
  });

  it('retries up to N times before giving up', async () => {
    mockRedis.set.mockResolvedValue(null);
    const fn = vi.fn();
    const result = await withBusinessLock('biz-1', fn, { retries: 3, retryDelayMs: 1 });
    expect(result).toEqual({ skipped: true, reason: 'locked' });
    expect(mockRedis.set).toHaveBeenCalledTimes(4);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('LockHandle.release', () => {
  it('calls eval with the correct token and returns true on success', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const handle = (await acquireLock('mira:lock:business:b1', 30)) as LockHandle;
    expect(handle).not.toBeNull();
    mockRedis.eval.mockResolvedValueOnce(1);
    const released = await handle.release();
    expect(released).toBe(true);
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("get", KEYS[1])'),
      ['mira:lock:business:b1'],
      [handle.token]
    );
  });

  it('returns false if eval throws', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const handle = (await acquireLock('mira:lock:business:b1', 30)) as LockHandle;
    expect(handle).not.toBeNull();
    mockRedis.eval.mockRejectedValueOnce(new Error('redis down'));
    const released = await handle.release();
    expect(released).toBe(false);
  });
});
