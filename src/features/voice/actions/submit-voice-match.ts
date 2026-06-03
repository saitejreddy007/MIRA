'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateCalibrationRound } from '../algorithm';
import type {
  DimensionResults,
  CalibrationRoundData,
  VoiceAnswers,
} from '../types';

const CALIBRATION_DIMENSIONS: {
  dimension: string;
  type: 'numeric' | 'categorical';
  context: string;
}[] = [
  {
    dimension: 'warmth',
    type: 'numeric',
    context: 'A long-time client is 2 weeks overdue on a $2,500 invoice. They are usually prompt. Send a follow-up.',
  },
  {
    dimension: 'directness',
    type: 'numeric',
    context: 'A new client is 3 weeks overdue on their first invoice of $1,200. They have not responded to your first reminder.',
  },
  {
    dimension: 'opening_style',
    type: 'categorical',
    context: 'A reliable client of 2 years is 4 weeks overdue on a $5,000 invoice. You need to escalate slightly.',
  },
  {
    dimension: 'paragraph_length',
    type: 'categorical',
    context: 'A client who always pays late is now 5 weeks overdue on $3,000. This is becoming a pattern.',
  },
  {
    dimension: 'tension_tolerance',
    type: 'numeric',
    context: 'Final notice. A client is 6 weeks overdue on $8,000. Standard practice is to mention late fees or collection.',
  },
];

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id ?? null;
}

export async function getCalibrationRounds(): Promise<{
  rounds?: CalibrationRoundData[];
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
    .select('dimensions, answers, calibration_rounds')
    .eq('business_id', businessId)
    .single();

  if (!voiceProfile?.dimensions) {
    return { error: 'Voice dimensions not found. Complete the questions first.' };
  }

  const existingRounds = voiceProfile.calibration_rounds as
    | CalibrationRoundData[]
    | null
    | undefined;
  if (
    Array.isArray(existingRounds) &&
    existingRounds.length === CALIBRATION_DIMENSIONS.length
  ) {
    return { rounds: existingRounds };
  }

  const dimensions = voiceProfile.dimensions as unknown as DimensionResults;
  const answers = voiceProfile.answers as unknown as VoiceAnswers;

  const rounds = await Promise.all(
    CALIBRATION_DIMENSIONS.map((dim, i) =>
      generateCalibrationRound(
        dim.dimension,
        dim.type,
        dim.context,
        dimensions,
        answers,
        i + 1
      )
    )
  );

  const { error: saveError } = await supabase.from('voice_profiles').upsert({
    business_id: businessId,
    calibration_rounds: rounds,
    updated_at: new Date().toISOString(),
  });

  if (saveError) {
    return { error: saveError.message };
  }

  return { rounds };
}

export async function saveCalibrationResults(
  rounds: CalibrationRoundData[]
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

  const { error: saveError } = await supabase.from('voice_profiles').upsert({
    business_id: businessId,
    calibration_rounds: rounds,
    updated_at: new Date().toISOString(),
  });

  if (saveError) {
    return { error: saveError.message };
  }

  return {};
}
