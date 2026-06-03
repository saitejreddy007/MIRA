import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/features/voice/algorithm', () => ({
  runAssemblyPipeline: vi.fn(() => Promise.resolve({
    version: '1.0',
    voice_dimensions: { warmth: 50 },
    tension_rules: { max_pressure_level: 3 },
  })),
}));

vi.mock('@/features/voice/algorithm/confidence', () => ({
  calculateConfidence: vi.fn(() => ({ score: 75, flag: 'High', suggestion: '' })),
}));

import { lockConstitution, generateConstitution } from '../actions/lock-constitution';
import * as serverModule from '@/lib/supabase/server';

let insertPayload: any = null;
let businessUpdatePayload: any = null;

function makeClient(opts: { user?: any; business?: any; profile?: any; insertError?: any; bizError?: any } = {}) {
  insertPayload = null;
  businessUpdatePayload = null;
  return {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: opts.user === null ? null : { id: 'user-1' } },
        error: null,
      }),
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { business_id: 'biz-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'voice_profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: opts.profile === null ? null : (opts.profile || {
                  answers: { q1: 'a' },
                  dimensions: { warmth: 50 },
                  calibration_rounds: [],
                }),
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'constitutions') {
        return {
          insert: (payload: any) => {
            insertPayload = payload;
            return Promise.resolve({ data: null, error: opts.insertError || null });
          },
        };
      }
      if (table === 'businesses') {
        return {
          update: (payload: any) => {
            businessUpdatePayload = payload;
            return {
              eq: () => Promise.resolve({ data: null, error: opts.bizError || null }),
            };
          },
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insertPayload = null;
  businessUpdatePayload = null;
});

function makeConstitution(versionStr: string) {
  return {
    version: versionStr,
    created_at: '2025-01-01',
    business_identity: { industry: 'design', client_type: 'small_business', culture: 'casual', business_age: '5_years' },
    voice_dimensions: { warmth: 65, formality: 35, directness: 55, tension_tolerance: 45, cognitive_pattern: 'empathy_first' as const },
    surface_rules: { greeting: 'Hey', signoff: 'Thanks', emoji_allowed: false, contraction_preference: true, punctuation_style: 'minimal' as const },
    vocabulary: {
      power_words: [],
      forbidden_words: [],
      forbidden_phrases: [],
      industry_terms: [],
      filler_phrases: [],
      regional_markers: [],
      contraction_preference: true,
      sentence_starter_patterns: [],
    },
    structural_rules: { opening_pattern: 'warmth_first' as const, reasoning_style: 'show' as const, bad_news_delivery: 'soften' as const, cta_style: 'single_soft' as const, paragraph_length: 'medium' as const },
    rhythm: { avg_sentence_length: 15, variance: 8, rhythm_type: 'flowing' as const, min_sentence_length: 8, max_sentence_length: 30, short_long_ratio: 0.4 },
    tension_rules: { day1_approach: 'friendly' as const, escalation_speed: 'slow' as const, consequence_mention: 'late' as const, max_pressure_level: 3 },
  };
}

describe('lockConstitution — version type bug fix', () => {
  it('parses string version "1.0" to integer 1', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('1.0') as any, { score: 80, flag: 'High' });

    expect(insertPayload).not.toBeNull();
    expect(insertPayload.version).toBe(1);
    expect(typeof insertPayload.version).toBe('number');
  });

  it('parses string version "1.5" to integer 1 (loses decimal by design)', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('1.5') as any, { score: 80, flag: 'High' });

    expect(insertPayload.version).toBe(1);
  });

  it('parses plain integer string "2" to integer 2', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('2') as any, { score: 80, flag: 'High' });

    expect(insertPayload.version).toBe(2);
  });

  it('falls back to 1 when version is non-numeric like "v1.0"', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('v1.0') as any, { score: 80, flag: 'High' });

    expect(insertPayload.version).toBe(1);
  });

  it('falls back to 1 when version is empty string', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('') as any, { score: 80, flag: 'High' });

    expect(insertPayload.version).toBe(1);
  });

  it('falls back to 1 when version is undefined', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const con = makeConstitution('1.0') as any;
    delete con.version;

    await lockConstitution(con, { score: 80, flag: 'High' });

    expect(insertPayload.version).toBe(1);
  });

  it('does NOT throw a TypeError (regression test for the original bug)', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await lockConstitution(makeConstitution('1.0') as any, { score: 80, flag: 'High' });
    expect(result.error).toBeUndefined();
  });

  it('also marks onboarding_complete=true on the business', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    await lockConstitution(makeConstitution('1.0') as any, { score: 80, flag: 'High' });

    expect(businessUpdatePayload).toEqual({ onboarding_complete: true });
  });

  it('returns error if user is not authenticated', async () => {
    const client = makeClient({ user: null });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await lockConstitution(makeConstitution('1.0') as any, { score: 80, flag: 'High' });
    expect(result.error).toBe('Not authenticated');
  });
});

describe('generateConstitution', () => {
  it('returns error when voice profile is missing', async () => {
    const client = makeClient({ profile: null });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await generateConstitution();
    expect(result.error).toBe('Voice profile incomplete. Complete the questions and calibration first.');
  });

  it('returns constitution and confidence when profile is complete', async () => {
    const client = makeClient();
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await generateConstitution();
    expect(result.constitution).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.error).toBeUndefined();
  });
});
