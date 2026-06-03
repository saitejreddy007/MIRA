'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runAssemblyPipeline } from '../algorithm';
import { calculateConfidence } from '../algorithm/confidence';
import type {
  VoiceAnswers,
  DimensionResults,
  VoiceConstitution,
  CalibrationRoundData,
} from '../types';

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id ?? null;
}

function parseVersionInt(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  if (typeof raw !== 'string' || raw.length === 0) return 1;
  const cleaned = raw.replace(/^v/i, '').split('.')[0] ?? '';
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateConstitution(): Promise<{
  constitution?: VoiceConstitution;
  confidence?: { score: number; flag: string; suggestion: string };
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) {
    return { error: 'Business not found. Please contact support.' };
  }

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('answers, dimensions, calibration_rounds')
    .eq('business_id', businessId)
    .single();

  if (!voiceProfile?.answers || !voiceProfile?.dimensions) {
    return { error: 'Voice profile incomplete. Complete the questions and calibration first.' };
  }

  const answers = voiceProfile.answers as unknown as VoiceAnswers;
  const dimensions = voiceProfile.dimensions as unknown as DimensionResults;
  const calibrationRounds = (voiceProfile.calibration_rounds ||
    []) as unknown as CalibrationRoundData[];

  let constitution: VoiceConstitution;
  try {
    constitution = await runAssemblyPipeline(answers, dimensions, calibrationRounds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Constitution assembly failed';
    return { error: msg };
  }

  const confidence = calculateConfidence(answers, calibrationRounds);

  return { constitution, confidence };
}

export async function lockConstitution(
  constitution: VoiceConstitution,
  confidence: { score: number; flag: string }
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) {
    return { error: 'Business not found. Please contact support.' };
  }

  const versionInt = parseVersionInt(constitution.version);

  const { error: bizError } = await supabase
    .from('businesses')
    .update({
      onboarding_complete: true,
    })
    .eq('id', businessId);

  if (bizError) {
    return { error: bizError.message };
  }

  const { error: constError } = await supabase.from('constitutions').insert({
    business_id: businessId,
    version: versionInt,
    content: constitution,
    confidence_score: confidence.score,
    confidence_flag: confidence.flag,
    locked_at: new Date().toISOString(),
  });

  if (constError) {
    await supabase
      .from('businesses')
      .update({ onboarding_complete: false })
      .eq('id', businessId);
    return { error: constError.message };
  }

  return {};
}
