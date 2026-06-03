import { describe, it, expect, vi, beforeEach } from 'vitest';

const SUPABASE = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' as string } }, error: null })),
  },
};

function makeClient(tableHandlers: Record<string, any>) {
  return {
    auth: SUPABASE.auth,
    from: (table: string) => {
      const handler = tableHandlers[table];
      if (!handler) throw new Error(`Unexpected from(${table}) call`);
      return handler;
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { loadDemoData } from '../actions/load-demo-data';
import * as serverModule from '@/lib/supabase/server';

beforeEach(() => {
  vi.clearAllMocks();
  SUPABASE.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

function userHandler(data: any): any {
  return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data, error: null }) }) }) };
}
function businessHandler(data: any): any {
  return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data, error: null }) }) }) };
}
function clientsListEmpty() {
  return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
}

describe('loadDemoData', () => {
  it('returns error when not authenticated', async () => {
    SUPABASE.auth.getUser.mockResolvedValueOnce({ data: { user: null as any }, error: null });
    const client = makeClient({});
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBe('Not authenticated');
    expect(result.clients_created).toBe(0);
    expect(result.invoices_created).toBe(0);
  });

  it('returns error when user has no business', async () => {
    const client = makeClient({
      users: userHandler(null),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBe('Business not found');
  });

  it('returns error when onboarding is incomplete', async () => {
    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: businessHandler({ onboarding_complete: false }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBe('Complete voice setup first to load demo data');
  });

  it('returns error when businesses table read fails', async () => {
    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'db error' } }) }) }) },
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBeDefined();
  });

  it('skips clients with existing emails (idempotency)', async () => {
    const existingEmails = [
      { id: 1, email: 'priya@studio.com' },
      { id: 2, email: 'rohan@mehta.io' },
      { id: 3, email: 'anita@iyer.in' },
      { id: 4, email: 'karthik@rao.dev' },
      { id: 5, email: 'neha@kapoor.co' },
      { id: 6, email: 'vikram@singh.com' },
    ];
    const insertSpy = vi.fn();
    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: businessHandler({ onboarding_complete: true }),
      clients: {
        select: () => ({ eq: () => Promise.resolve({ data: existingEmails, error: null }) }),
        insert: () => {
          insertSpy();
          return { select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'should not be called' } }) }) };
        },
      },
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBeUndefined();
    expect(result.clients_created).toBe(0);
    expect(result.invoices_created).toBe(0);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('creates new clients with 3 invoices each (6 clients * 3 = 18 invoices)', async () => {
    let clientsInserted = 0;
    let invoicesInserted = 0;
    let clientInsertShouldSucceed = true;

    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: businessHandler({ onboarding_complete: true }),
      clients: {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => {
          if (!clientInsertShouldSucceed) {
            return { select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'fail' } }) }) };
          }
          clientsInserted++;
          return { select: () => ({ single: () => Promise.resolve({ data: { id: 100 + clientsInserted }, error: null }) }) };
        },
      },
      invoices: {
        insert: () => {
          invoicesInserted++;
          return Promise.resolve({ data: null, error: null });
        },
      },
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();

    expect(result.error).toBeUndefined();
    expect(clientsInserted).toBe(6);
    expect(invoicesInserted).toBe(18);
    expect(result.clients_created).toBe(6);
    expect(result.invoices_created).toBe(18);
  });

  it('handles invoice insert failures without crashing', async () => {
    let invoicesInserted = 0;

    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: businessHandler({ onboarding_complete: true }),
      clients: {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => ({
          select: () => ({ single: () => Promise.resolve({ data: { id: 1 }, error: null }) }),
        }),
      },
      invoices: {
        insert: () => {
          invoicesInserted++;
          return Promise.resolve({ data: null, error: { message: 'invoice fail' } });
        },
      },
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(invoicesInserted).toBeGreaterThan(0);
    expect(result.invoices_created).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it('handles client insert failures gracefully', async () => {
    const client = makeClient({
      users: userHandler({ business_id: 'biz-1' }),
      businesses: businessHandler({ onboarding_complete: true }),
      clients: {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => ({
          select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'client fail' } }) }),
        }),
      },
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await loadDemoData();
    expect(result.error).toBeUndefined();
    expect(result.clients_created).toBe(0);
  });
});
