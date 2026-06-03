import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/features/ai/openrouter-client', () => ({
  generateJson: vi.fn(),
}));

vi.mock('@/features/channels/email/send', () => ({
  sendFollowUpEmail: vi.fn(),
}));

vi.mock('@/features/voice/algorithm/quality-gate', () => ({
  complianceCheckWithRetry: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { processInvoice } from '../process-invoice';
import { generateJson } from '@/features/ai/openrouter-client';
import { sendFollowUpEmail } from '@/features/channels/email/send';
import { complianceCheckWithRetry } from '@/features/voice/algorithm/quality-gate';

type MockSupabase = {
  from: (table: string) => any;
};

const DEFAULT_CONSTITUTION = {
  version: '1.0',
  created_at: '2025-01-01',
  business_identity: { industry: 'design', client_type: 'small_business', culture: 'casual', business_age: '5_years' },
  voice_dimensions: { warmth: 65, formality: 35, directness: 55, tension_tolerance: 45, cognitive_pattern: 'empathy_first' as const },
  surface_rules: { greeting: 'Hey' as const, signoff: 'Thanks' as const, emoji_allowed: false, contraction_preference: true, punctuation_style: 'minimal' as const },
  vocabulary: { power_words: [], forbidden_words: [], forbidden_phrases: [], industry_terms: [], filler_phrases: [], regional_markers: [], contraction_preference: true, sentence_starter_patterns: [] },
  structural_rules: { opening_pattern: 'warmth_first' as const, reasoning_style: 'show' as const, bad_news_delivery: 'soften' as const, cta_style: 'single_soft' as const, paragraph_length: 'medium' as const },
  rhythm: { avg_sentence_length: 15, variance: 8, rhythm_type: 'flowing' as const, min_sentence_length: 8, max_sentence_length: 30, short_long_ratio: 0.4 },
  tension_rules: { day1_approach: 'friendly' as const, escalation_speed: 'slow' as const, consequence_mention: 'late' as const, max_pressure_level: 3 },
};

const DEFAULT_BUSINESS = {
  id: 'biz-1',
  name: 'Acme',
  max_follow_up_days: 3,
  auto_escalation_after_days: 7,
  disclosure_level: 'PROACTIVE',
  owner_email: 'o@x.com',
  owner_phone: null,
  gmail_refresh_token: null,
};

const DEFAULT_INVOICE = {
  id: 1,
  business_id: 'biz-1',
  client_id: 11,
  invoice_number: 'INV-1',
  amount: '1000',
  currency: 'INR',
  due_date: '2026-05-01',
  status: 'pending',
  segment_override: null,
  owner_override: null,
  human_escalation_required: false,
  pre_due_reminder_sent: false,
  clients: [{ segment: 'A', name: 'John', email: 'john@x.com' }],
};

function makeClient(opts: {
  invoice?: any;
  business?: any;
  constitution?: any;
  followUps?: any[];
  constitutionError?: boolean;
  businessError?: boolean;
  invoiceError?: boolean;
}) {
  const invoiceUpdates: any[] = [];
  const followUpInserts: any[] = [];

  const businessData = opts.business === null ? null : (opts.business ?? DEFAULT_BUSINESS);
  const constitutionRowData = opts.constitution === null ? null : { content: opts.constitution ?? DEFAULT_CONSTITUTION };
  const invoiceData = opts.invoice === null ? null : (opts.invoice ?? DEFAULT_INVOICE);
  const followUpsData = opts.followUps ?? [];

  return {
    invoiceUpdates,
    followUpInserts,
    client: {
      from: (table: string) => {
        if (table === 'businesses') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: opts.businessError ? null : businessData,
                  error: opts.businessError ? { message: 'biz error' } : null,
                }),
              }),
            }),
          };
        }
        if (table === 'constitutions') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    single: () => Promise.resolve({
                      data: opts.constitutionError ? null : constitutionRowData,
                      error: opts.constitutionError ? { message: 'constitution error' } : null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'invoices') {
          const baseHandler = {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: opts.invoiceError ? null : invoiceData,
                    error: opts.invoiceError ? { message: 'invoice error' } : null,
                  }),
                }),
              }),
            }),
            update: (payload: any) => {
              invoiceUpdates.push(payload);
              return { eq: () => Promise.resolve({ data: null, error: null }) };
            },
          };
          return baseHandler;
        }
        if (table === 'follow_ups') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: followUpsData, error: null }),
                }),
              }),
            }),
            insert: (payload: any) => {
              followUpInserts.push(payload);
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 1000 + followUpInserts.length }, error: null }),
                }),
              };
            },
            update: (payload: any) => {
              const last = followUpInserts[followUpInserts.length - 1];
              if (last) followUpInserts[followUpInserts.length - 1] = { ...last, ...payload };
              return { eq: () => Promise.resolve({ data: null, error: null }) };
            },
          };
        }
        throw new Error(`Unexpected from(${table}) call`);
      },
    } as MockSupabase,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(complianceCheckWithRetry).mockImplementation(async (msg: string) => ({
    passed: true,
    violations: [],
    regenerated: false,
    attempts: 1,
    final_message: msg,
  }));
  vi.mocked(sendFollowUpEmail).mockResolvedValue({ success: true });
  vi.mocked(generateJson).mockResolvedValue({
    message_text: 'Hey John, quick reminder about INV-1. Thanks!',
    max_pressure_level: 2,
  });
});

describe('processInvoice', () => {
  it('returns sent on success', async () => {
    const { client, invoiceUpdates, followUpInserts } = makeClient({});
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('sent');
    expect(generateJson).toHaveBeenCalled();
    expect(complianceCheckWithRetry).toHaveBeenCalled();
    expect(sendFollowUpEmail).toHaveBeenCalled();
    expect(followUpInserts.length).toBe(1);
    expect(followUpInserts[0].status).toBe('sent');
    expect(invoiceUpdates.length).toBeGreaterThan(0);
  });

  it('returns error when AI does not return max_pressure_level', async () => {
    vi.mocked(generateJson).mockResolvedValue({ message_text: 'Hey John, ...' } as any);
    const { client } = makeClient({});
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.error).toContain('max_pressure_level');
    }
  });

  it('returns error when message pressure exceeds constitution max', async () => {
    vi.mocked(generateJson).mockResolvedValue({ message_text: 'Hey John, ...', max_pressure_level: 10 });
    const { client } = makeClient({});
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.error).toContain('exceeds constitution max');
    }
  });

  it('skips stop when invoice is paid', async () => {
    const { client } = makeClient({ invoice: { ...DEFAULT_INVOICE, status: 'paid' } });
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('skipped_stop');
    if (result.outcome === 'skipped_stop') {
      expect(result.reason).toContain('paid');
    }
  });

  it('escalates and sets human_escalation_required when compliance fails', async () => {
    vi.mocked(complianceCheckWithRetry).mockResolvedValue({
      passed: false,
      violations: ['contains forbidden word: aggressive'],
      regenerated: true,
      attempts: 3,
      final_message: 'still aggressive',
    });
    const { client, invoiceUpdates } = makeClient({});
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('error');
    expect(invoiceUpdates.some((u: any) => u.human_escalation_required === true)).toBe(true);
  });

  it('marks follow_up as failed and returns error when email send fails', async () => {
    vi.mocked(sendFollowUpEmail).mockResolvedValue({ success: false, error: 'gmail_quota_exceeded' });
    const { client, followUpInserts } = makeClient({});
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.error).toContain('gmail_quota_exceeded');
    }
    expect(followUpInserts.length).toBe(1);
    expect(followUpInserts[0].status).toBe('failed');
  });

  it('skips wait when invoice is not yet due and no messages sent', async () => {
    const futureInvoice = { ...DEFAULT_INVOICE, due_date: '2099-12-31' };
    const { client } = makeClient({ invoice: futureInvoice });
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('skipped_wait');
  });

  it('returns error when business not found', async () => {
    const { client } = makeClient({ business: null });
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.error).toContain('business lookup failed');
    }
  });

  it('returns skipped_wait when no constitution exists', async () => {
    const { client } = makeClient({ constitution: null });
    const result = await processInvoice(client as any, { invoiceId: 1, businessId: 'biz-1' });
    expect(result.outcome).toBe('skipped_wait');
    if (result.outcome === 'skipped_wait') {
      expect(result.reason).toContain('constitution');
    }
  });
});
