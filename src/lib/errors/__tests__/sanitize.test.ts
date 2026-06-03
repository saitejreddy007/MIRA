import { describe, it, expect, vi } from 'vitest';
import { sanitizeError, safeUpstreamError } from '../sanitize';

describe('sanitizeError', () => {
  it('returns full message in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = sanitizeError(new Error('Detailed error with info'), 'openrouter', 500);
    expect(result.message).toContain('Detailed');
  });

  it('returns generic message in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = sanitizeError(new Error('Detailed error with info'), 'openrouter', 500);
    expect(result.message).not.toContain('Detailed');
    expect(result.upstream).toBe('openrouter');
    expect(result.status).toBe(500);
  });

  it('maps 429 to rate limit message in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = sanitizeError(new Error('x'), 'openrouter', 429);
    expect(result.message).toMatch(/rate limit/i);
  });

  it('redacts API keys from error message in dev mode', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = sanitizeError(new Error('Failed with key sk-1234567890abcdef'), 'openrouter');
    expect(result.message).not.toContain('sk-1234567890');
    expect(result.message).toContain('[REDACTED_KEY]');
  });

  it('handles non-Error input', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = sanitizeError('plain string', 'gmail');
    expect(result.message).toMatch(/gmail delivery/i);
    expect(result.upstream).toBe('gmail');
  });
});

describe('safeUpstreamError', () => {
  it('returns production-safe message in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const fakeResponse = { status: 502, statusText: 'Bad Gateway' } as Response;
    const result = safeUpstreamError(fakeResponse, 'gmail');
    expect(result.status).toBe(502);
    expect(result.upstream).toBe('gmail');
    expect(result.message).toMatch(/unavailable/i);
  });

  it('returns minimal detail in dev', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const fakeResponse = { status: 500, statusText: 'Internal Server Error' } as Response;
    const result = safeUpstreamError(fakeResponse, 'gmail');
    expect(result.message).toContain('500');
  });
});
