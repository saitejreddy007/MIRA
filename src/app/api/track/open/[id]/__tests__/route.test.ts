import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { GET } from '../route';
import * as serverModule from '@/lib/supabase/server';

const PARAMS_PROMISE = (id: string | number) => Promise.resolve({ id: String(id) });

function makeServiceClient(handlers: { update?: (args: any) => any; throwOnUpdate?: boolean } = {}) {
  const update = vi.fn((payload: unknown) => {
    if (handlers.throwOnUpdate) throw new Error('db down');
    return {
      eq: vi.fn(() => ({
        is: vi.fn(() => Promise.resolve(handlers.update ? handlers.update(payload) : { data: null, error: null })),
      })),
    };
  });
  return { from: () => ({ update }) };
}

function makeRequest() {
  return new NextRequest('https://example.com/api/track/open/42', { method: 'GET' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/track/open/[id]', () => {
  it('returns a 1x1 transparent GIF', async () => {
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue(makeServiceClient() as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE(42) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/gif');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    expect(res.headers.get('Pragma')).toBe('no-cache');
    expect(res.headers.get('Expires')).toBe('0');

    const buf = Buffer.from(await res.arrayBuffer());
    const expected = Buffer.from(TRANSPARENT_GIF_BASE64, 'base64');
    expect(buf.equals(expected)).toBe(true);
  });

  it('updates opened_at with the current timestamp', async () => {
    let capturedPayload: unknown = null;
    let capturedWhere: { id?: number; openedAtNull?: boolean } = {};
    const client = makeServiceClient({
      update: (payload: any) => {
        capturedPayload = payload;
        return { data: null, error: null };
      },
    });
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue(client as never);

    const before = Date.now();
    await GET(makeRequest(), { params: PARAMS_PROMISE(99) });
    const after = Date.now();

    expect(capturedPayload).toHaveProperty('opened_at');
    const ts = new Date((capturedPayload as { opened_at: string }).opened_at).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('uses .is(opened_at, null) for atomic first-open write', async () => {
    let isCalled = false;
    let isCol: unknown = null;
    let isVal: unknown = null;
    const client = {
      from: () => ({
        update: () => ({
          eq: () => ({
            is: (col: unknown, val: unknown) => {
              isCalled = true;
              isCol = col;
              isVal = val;
              return Promise.resolve({ data: null, error: null });
            },
          }),
        }),
      }),
    };
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue(client as never);

    await GET(makeRequest(), { params: PARAMS_PROMISE(42) });

    expect(isCalled).toBe(true);
    expect(isCol).toBe('opened_at');
    expect(isVal).toBeNull();
  });

  it('returns 200 even when database update fails', async () => {
    const client = makeServiceClient({ throwOnUpdate: true });
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue(client as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE(42) });
    expect(res.status).toBe(200);
  });

  it('returns 200 even when update returns an error (no leaked error to client)', async () => {
    const client = makeServiceClient({
      update: () => ({ data: null, error: { message: 'db error' } }),
    });
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue(client as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE(42) });
    expect(res.status).toBe(200);
  });

  it('ignores non-numeric IDs (no DB write)', async () => {
    const fromSpy = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: () => ({
          is: () => Promise.resolve({ data: null, error: null }),
        }),
      })),
    }));
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue({ from: fromSpy } as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE('not-a-number') });
    expect(res.status).toBe(200);
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('ignores negative IDs', async () => {
    const fromSpy = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: () => ({
          is: () => Promise.resolve({ data: null, error: null }),
        }),
      })),
    }));
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue({ from: fromSpy } as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE(-1) });
    expect(res.status).toBe(200);
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('ignores zero IDs', async () => {
    const fromSpy = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: () => ({
          is: () => Promise.resolve({ data: null, error: null }),
        }),
      })),
    }));
    vi.mocked(serverModule.createServiceRoleClient).mockReturnValue({ from: fromSpy } as never);

    const res = await GET(makeRequest(), { params: PARAMS_PROMISE(0) });
    expect(res.status).toBe(200);
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
