'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runAssemblyPipeline } from '../algorithm';
import { calculateConfidence } from '../algorithm/confidence';
import { logger } from '@/lib/logger';
import type { VoiceAnswers, DimensionResults, CalibrationRoundData } from '../types';

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id ?? null;
}

export async function regenerateConstitution(): Promise<{
  constitution_id?: number;
  confidence_score?: number;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: 'Not authenticated' };

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) return { error: 'Business not found' };

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('answers, dimensions, calibration_rounds')
    .eq('business_id', businessId)
    .single();

  if (!voiceProfile?.answers || !voiceProfile?.dimensions) {
    return { error: 'Voice profile incomplete. Please complete the onboarding flow first.' };
  }

  const answers = voiceProfile.answers as unknown as VoiceAnswers;
  const dimensions = voiceProfile.dimensions as unknown as DimensionResults;
  const calibrationRounds = (voiceProfile.calibration_rounds ||
    []) as unknown as CalibrationRoundData[];

  let constitution;
  try {
    constitution = await runAssemblyPipeline(answers, dimensions, calibrationRounds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Constitution assembly failed';
    logger.error({ businessId, err: msg }, 'regenerateConstitution: assembly failed');
    return { error: msg };
  }

  const confidence = calculateConfidence(answers, calibrationRounds);
  const versionInt = parseInt(constitution.version, 10);

  const { data: inserted, error: constError } = await supabase
    .from('constitutions')
    .insert({
      business_id: businessId,
      version: Number.isFinite(versionInt) ? versionInt : 1,
      content: constitution,
      confidence_score: confidence.score,
      confidence_flag: confidence.flag,
      locked_at: new Date().toISOString(),
    })
    .select('id, confidence_score')
    .single();

  if (constError || !inserted) {
    logger.error({ businessId, err: constError?.message }, 'regenerateConstitution: insert failed');
    return { error: 'Failed to save new constitution' };
  }

  logger.info({
    businessId,
    constitutionId: inserted.id,
    actorUserId: authData.user.id,
    action: 'regenerate_constitution',
  }, 'constitution regenerated');

  return {
    constitution_id: inserted.id,
    confidence_score: inserted.confidence_score ? Number(inserted.confidence_score) : undefined,
  };
}
