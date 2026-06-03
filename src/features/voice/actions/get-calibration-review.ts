'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CalibrationRoundData, DimensionResults } from '../types';

export type CalibrationReview = {
  rounds: CalibrationRoundData[];
  dimensions: DimensionResults;
  stats: {
    total: number;
    a_selected: number;
    b_selected: number;
    not_selected: number;
    all_answered: boolean;
  };
};

export async function getCalibrationReview(): Promise<{
  data?: CalibrationReview;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Not authenticated' };

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();
  if (!user?.business_id) return { error: 'Business not found' };

  const { data: profile } = await supabase
    .from('voice_profiles')
    .select('calibration_rounds, dimensions')
    .eq('business_id', user.business_id)
    .single();

  if (!profile) return { error: 'No voice profile found. Complete voice setup first.' };
  if (!profile.dimensions) return { error: 'No voice dimensions found. Complete voice setup first.' };

  const rounds = (profile.calibration_rounds as unknown as CalibrationRoundData[] | null) || [];
  const dimensions = profile.dimensions as unknown as DimensionResults;

  const aSelected = rounds.filter((r) => r.selected === 'A').length;
  const bSelected = rounds.filter((r) => r.selected === 'B').length;
  const notSelected = rounds.filter((r) => !r.selected).length;

  return {
    data: {
      rounds,
      dimensions,
      stats: {
        total: rounds.length,
        a_selected: aSelected,
        b_selected: bSelected,
        not_selected: notSelected,
        all_answered: notSelected === 0 && rounds.length > 0,
      },
    },
  };
}
