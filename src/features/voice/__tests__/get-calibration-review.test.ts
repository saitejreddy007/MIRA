import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { getCalibrationReview } from '../actions/get-calibration-review';
import * as serverModule from '@/lib/supabase/server';

const SUPABASE_AUTH_USER = { data: { user: { id: 'user-1' } }, error: null };

function makeClient(handlers: Record<string, (data: any) => any>) {
  return {
    auth: { getUser: vi.fn(() => Promise.resolve(SUPABASE_AUTH_USER)) },
    from: (table: string) => {
      const handler = handlers[table];
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve(handler ? handler(undefined) : { data: null, error: null }) }) }),
      };
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCalibrationReview', () => {
  it('returns error when not authenticated', async () => {
    const client = makeClient({});
    client.auth.getUser = vi.fn(() => Promise.resolve({ data: { user: null as any }, error: null }));
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.error).toBe('Not authenticated');
    expect(result.data).toBeUndefined();
  });

  it('returns error when user has no business', async () => {
    const client = makeClient({
      users: () => ({ data: null, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.error).toBe('Business not found');
  });

  it('returns error when no voice profile exists', async () => {
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: null, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.error).toBe('No voice profile found. Complete voice setup first.');
  });

  it('returns error when voice dimensions missing', async () => {
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { dimensions: null, calibration_rounds: [] }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.error).toBe('No voice dimensions found. Complete voice setup first.');
  });

  it('counts A and B selections correctly', async () => {
    const rounds = [
      { round: 1, dimension: 'warmth', calibration_type: 'numeric', context: 'c1', message_a: 'a1', message_b: 'b1', selected: 'A' as const },
      { round: 2, dimension: 'directness', calibration_type: 'numeric', context: 'c2', message_a: 'a2', message_b: 'b2', selected: 'B' as const },
      { round: 3, dimension: 'opening_style', calibration_type: 'categorical', context: 'c3', message_a: 'a3', message_b: 'b3', selected: 'A' as const },
      { round: 4, dimension: 'paragraph_length', calibration_type: 'categorical', context: 'c4', message_a: 'a4', message_b: 'b4', selected: 'A' as const },
      { round: 5, dimension: 'tension_tolerance', calibration_type: 'numeric', context: 'c5', message_a: 'a5', message_b: 'b5', selected: 'B' as const },
    ];
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { calibration_rounds: rounds, dimensions: { warmth: 50 } }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.data?.stats.a_selected).toBe(3);
    expect(result.data?.stats.b_selected).toBe(2);
    expect(result.data?.stats.total).toBe(5);
    expect(result.data?.stats.all_answered).toBe(true);
  });

  it('detects unanswered rounds', async () => {
    const rounds = [
      { round: 1, dimension: 'warmth', calibration_type: 'numeric', context: 'c1', message_a: 'a1', message_b: 'b1', selected: 'A' as const },
      { round: 2, dimension: 'directness', calibration_type: 'numeric', context: 'c2', message_a: 'a2', message_b: 'b2' },
      { round: 3, dimension: 'opening_style', calibration_type: 'categorical', context: 'c3', message_a: 'a3', message_b: 'b3' },
    ];
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { calibration_rounds: rounds, dimensions: { warmth: 50 } }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.data?.stats.a_selected).toBe(1);
    expect(result.data?.stats.not_selected).toBe(2);
    expect(result.data?.stats.all_answered).toBe(false);
  });

  it('handles null calibration_rounds (empty result)', async () => {
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { calibration_rounds: null, dimensions: { warmth: 50 } }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.data?.rounds).toEqual([]);
    expect(result.data?.stats.total).toBe(0);
    expect(result.data?.stats.all_answered).toBe(false);
  });

  it('returns dimensions object for downstream use', async () => {
    const dimensions = { warmth: 65, formality: 30, directness: 70, tension_tolerance: 40, cognitive_pattern: 'context_first' };
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { calibration_rounds: [], dimensions }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.data?.dimensions).toEqual(dimensions);
  });

  it('returns all_answered=false when no rounds exist', async () => {
    const client = makeClient({
      users: () => ({ data: { business_id: 'biz-1' }, error: null }),
      voice_profiles: () => ({ data: { calibration_rounds: [], dimensions: { warmth: 50 } }, error: null }),
    });
    vi.mocked(serverModule.createServerSupabaseClient).mockResolvedValue(client as never);

    const result = await getCalibrationReview();
    expect(result.data?.stats.all_answered).toBe(false);
  });
});
