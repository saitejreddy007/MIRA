'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runExtractionPipeline } from '../algorithm';
import type { VoiceAnswers, DimensionResults, ProcessedAnswers } from '../types';

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id ?? null;
}

export async function submitVoiceAnswers(answers: VoiceAnswers) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) {
    return { error: 'Business not found. Please contact support.' };
  }

  let processed: ProcessedAnswers;
  let dimensions: DimensionResults;

  try {
    const result = await runExtractionPipeline(answers);
    processed = result.processed;
    dimensions = result.dimensions;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Voice analysis failed';
    return { error: msg };
  }

  const { error: upsertError } = await supabase.from('voice_profiles').upsert({
    business_id: businessId,
    answers,
    processed,
    dimensions,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return { error: upsertError.message };
  }

  return { dimensions, answers };
}
