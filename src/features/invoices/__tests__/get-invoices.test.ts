import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// getInvoices makes 6 calls to supabase.from('invoices'):
//   call 1  → paginated list  (range) → returns { data, count }
//   calls 2–6 → count HEAD queries  → returns { data: null, count: N }
// We track call order using a closure counter so each invocation gets the
// right response shape.
// ---------------------------------------------------------------------------

function makeListChain(result: { data: unknown[]; count: number }) {
  const chain: Record<string, unknown> = {};
  const terminal = () =>
    Promise.resolve({ data: result.data, count: result.count, error: null });

  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.not = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(terminal);
  chain.single = vi.fn(() =>
    Promise.resolve({ data: Array.isArray(result.data) ? result.data[0] : result.data, error: null })
  );
  return chain;
}

function makeCountChain(count: number) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve({ data: null, count, error: null });

  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.not = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.range = vi.fn(terminal);
  // HEAD count queries are awaited directly via .then()
  const resolved = Promise.resolve({ data: null, count, error: null });
  (chain as unknown as Promise<unknown>).then = resolved.then.bind(resolved);
  return chain;
}

function makeClient(opts: {
  listData: unknown[];
  listCount: number;
  counts?: [number, number, number, number, number];
}) {
  const [c0 = 0, c1 = 0, c2 = 0, c3 = 0, c4 = 0] = opts.counts ?? [
    opts.listCount,
    0,
    0,
    0,
    0,
  ];
  const countValues = [c0, c1, c2, c3, c4];
  let callIndex = 0;

  return {
    from: (_table: string) => {
      const idx = callIndex++;
      if (idx === 0) {
        // First call → list query (paginated)
        return makeListChain({ data: opts.listData, count: opts.listCount });
      }
      // Subsequent calls → count HEAD queries
      return makeCountChain(countValues[idx - 1] ?? 0);
    },
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })
      ),
    },
  };
}

const sampleInvoices = [
  {
    id: 1,
    invoice_number: 'INV-001',
    amount: '1000',
    currency: 'INR',
    due_date: '2025-12-01',
    status: 'pending',
    description: null,
    created_at: '2025-11-01',
    clients: { name: 'Acme', segment: 'A' },
    client_id: 1,
    segment_override: null,
    owner_override: null,
    next_follow_up_at: null,
    pre_due_reminder_sent: false,
  },
  {
    id: 2,
    invoice_number: 'INV-002',
    amount: '2000',
    currency: 'INR',
    due_date: '2025-11-15',
    status: 'overdue',
    description: null,
    created_at: '2025-10-15',
    clients: { name: 'Beta', segment: 'B' },
    client_id: 2,
    segment_override: null,
    owner_override: null,
    next_follow_up_at: null,
    pre_due_reminder_sent: false,
  },
];

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { getInvoices } from '../actions/get-invoices';
import * as serverModule from '@/lib/supabase/server';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getInvoices', () => {
  it('returns first page with hasMore=true when more pages exist', async () => {
    const manyRows = Array.from({ length: 50 }, (_, i) => ({
      ...sampleInvoices[0],
      id: 100 + i,
    }));
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: manyRows, listCount: 100 }) as never
    );

    const page = await getInvoices('biz-1');

    expect(page.rows).toEqual(manyRows);
    expect(page.total).toBe(100);
    expect(page.hasMore).toBe(true);
    expect(page.nextOffset).toBe(50);
  });

  it('returns hasMore=false on last page', async () => {
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: sampleInvoices, listCount: 2 }) as never
    );

    const page = await getInvoices('biz-1', { offset: 0, limit: 50 });

    expect(page.hasMore).toBe(false);
    expect(page.nextOffset).toBe(null);
    expect(page.total).toBe(2);
  });

  it('respects custom offset and computes nextOffset from rows.length', async () => {
    const manyRows = Array.from({ length: 50 }, (_, i) => ({
      ...sampleInvoices[0],
      id: 100 + i,
    }));
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: manyRows, listCount: 100 }) as never
    );

    const page = await getInvoices('biz-1', { offset: 0, limit: 50 });

    expect(page.rows.length).toBe(50);
    expect(page.nextOffset).toBe(50);
    expect(page.hasMore).toBe(true);
  });

  it('clamps limit to MAX_PAGE_SIZE (200)', async () => {
    const twoHundred = Array.from({ length: 200 }, (_, i) => ({
      ...sampleInvoices[0],
      id: 100 + i,
    }));
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: twoHundred, listCount: 1000 }) as never
    );

    const page = await getInvoices('biz-1', { limit: 999999 });

    expect(page.rows.length).toBeLessThanOrEqual(200);
  });

  it('clamps limit to at least 1', async () => {
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: [], listCount: 0 }) as never
    );

    const page = await getInvoices('biz-1', { limit: -5 });

    expect(page.rows).toEqual([]);
  });

  it('clamps negative offset to 0', async () => {
    const manyRows = Array.from({ length: 50 }, (_, i) => ({
      ...sampleInvoices[0],
      id: 100 + i,
    }));
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: manyRows, listCount: 100 }) as never
    );

    const page = await getInvoices('biz-1', { offset: -100 });

    expect(page.nextOffset).toBe(50);
  });

  it('handles empty result set', async () => {
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: [], listCount: 0 }) as never
    );

    const page = await getInvoices('biz-1');

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.hasMore).toBe(false);
    expect(page.nextOffset).toBe(null);
  });

  it('handles null data gracefully', async () => {
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: [], listCount: 0 }) as never
    );

    const page = await getInvoices('biz-1');

    expect(page.rows).toEqual([]);
  });

  it('returns correct total from paginated count', async () => {
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(
      makeClient({ listData: sampleInvoices, listCount: 100 }) as never
    );

    const page = await getInvoices('biz-1');

    expect(page.total).toBe(100);
  });
});
