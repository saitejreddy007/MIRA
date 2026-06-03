import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff, isTransientNetworkError, isRetryableStatus, defaultShouldRetry } from '../retry';

describe('isTransientNetworkError', () => {
  it('detects ECONNREFUSED', () => {
    expect(isTransientNetworkError(new Error('connect ECONNREFUSED 127.0.0.1:443'))).toBe(true);
  });
  it('detects ETIMEDOUT', () => {
    expect(isTransientNetworkError(new Error('request ETIMEDOUT'))).toBe(true);
  });
  it('detects fetch failed', () => {
    expect(isTransientNetworkError(new Error('fetch failed'))).toBe(true);
  });
  it('rejects non-network errors', () => {
    expect(isTransientNetworkError(new Error('Invalid API key'))).toBe(false);
  });
  it('handles non-Error input', () => {
    expect(isTransientNetworkError('plain string')).toBe(false);
  });
});

describe('isRetryableStatus', () => {
  it('retries on 429', () => expect(isRetryableStatus(429)).toBe(true));
  it('retries on 500', () => expect(isRetryableStatus(500)).toBe(true));
  it('retries on 502', () => expect(isRetryableStatus(502)).toBe(true));
  it('retries on 503', () => expect(isRetryableStatus(503)).toBe(true));
  it('retries on 504', () => expect(isRetryableStatus(504)).toBe(true));
  it('does not retry on 400', () => expect(isRetryableStatus(400)).toBe(false));
  it('does not retry on 401', () => expect(isRetryableStatus(401)).toBe(false));
  it('does not retry on 404', () => expect(isRetryableStatus(404)).toBe(false));
});

describe('defaultShouldRetry', () => {
  it('retries on network errors', () => {
    expect(defaultShouldRetry(new Error('fetch failed'))).toBe(true);
  });
  it('retries on retryable status codes', () => {
    const err = Object.assign(new Error('x'), { status: 503 });
    expect(defaultShouldRetry(err)).toBe(true);
  });
  it('does not retry on 4xx (except 429)', () => {
    const err = Object.assign(new Error('x'), { status: 401 });
    expect(defaultShouldRetry(err)).toBe(false);
  });
  it('does not retry on plain errors', () => {
    expect(defaultShouldRetry(new Error('invalid input'))).toBe(false);
  });
});

describe('retryWithBackoff', () => {
  it('returns value on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, { initialDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('fetch failed'), { status: 503 }))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(fn, { initialDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxAttempts on persistent failure', async () => {
    const err = Object.assign(new Error('fetch failed'), { status: 500 });
    const fn = vi.fn().mockRejectedValue(err);
    await expect(retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 1 })).rejects.toThrow('fetch failed');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await expect(retryWithBackoff(fn, { initialDelayMs: 1 })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes onRetry callback between attempts', async () => {
    const err = Object.assign(new Error('x'), { status: 503 });
    const fn = vi.fn().mockRejectedValue(err);
    const onRetry = vi.fn();
    await expect(
      retryWithBackoff(fn, { maxAttempts: 2, initialDelayMs: 1, onRetry })
    ).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, err, expect.any(Number));
  });
});
