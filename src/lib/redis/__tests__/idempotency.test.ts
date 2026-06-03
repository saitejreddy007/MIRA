import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = {
  set: vi.fn(),
  del: vi.fn(),
};

vi.mock('../client', () => ({
  getRedis: () => mockRedis,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { withIdempotency, claimKey, followupKey, dailyInvoiceKey } from '../idempotency';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('claimKey', () => {
  it('returns true when key is claimed (SET NX OK)', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const claimed = await claimKey('mira:idem:foo', 60);
    expect(claimed).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('mira:idem:foo', '1', { nx: true, ex: 60 });
  });

  it('returns false when key already exists', async () => {
    mockRedis.set.mockResolvedValueOnce(null);
    const claimed = await claimKey('mira:idem:foo', 60);
    expect(claimed).toBe(false);
  });
});

describe('withIdempotency', () => {
  it('executes the function on first call', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const fn = vi.fn().mockResolvedValue('done');
    const result = await withIdempotency('mira:idem:foo', fn);
    expect(result).toEqual({ executed: true, result: 'done' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('skips execution when key already exists', async () => {
    mockRedis.set.mockResolvedValueOnce(null);
    const fn = vi.fn();
    const result = await withIdempotency('mira:idem:foo', fn);
    expect(result).toEqual({ executed: false, reason: 'duplicate' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('releases the key if the function throws (so retry can succeed)', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.del.mockResolvedValueOnce(1);
    const fn = vi.fn().mockRejectedValueOnce(new Error('transient'));
    await expect(withIdempotency('mira:idem:foo', fn)).rejects.toThrow('transient');
    expect(mockRedis.del).toHaveBeenCalledWith('mira:idem:foo');
  });

  it('does not release the key on success (so duplicates stay blocked)', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    const fn = vi.fn().mockResolvedValue('done');
    await withIdempotency('mira:idem:foo', fn);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe('followupKey / dailyInvoiceKey', () => {
  it('followupKey includes invoice, position, and bucket', () => {
    expect(followupKey(42, 2, '20260602')).toBe('mira:idem:followup:42:2:20260602');
  });

  it('dailyInvoiceKey includes invoice and bucket', () => {
    expect(dailyInvoiceKey(42, '20260602')).toBe('mira:idem:invoice:42:20260602');
  });

  it('followupKey defaults to today bucket', () => {
    const k = followupKey(42, 0);
    expect(k).toMatch(/^mira:idem:followup:42:0:\d{8}$/);
  });
});
