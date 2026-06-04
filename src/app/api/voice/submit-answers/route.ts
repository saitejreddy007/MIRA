import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runExtractionPipeline } from '@/features/voice/algorithm';
import type { VoiceAnswers } from '@/features/voice/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', authData.user.id)
      .single();

    const businessId = profile?.business_id;
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 400 });
    }

    const answers: VoiceAnswers = await request.json();

    const { processed, dimensions } = await runExtractionPipeline(answers);

    const { error: upsertError } = await supabase.from('voice_profiles').upsert({
      business_id: businessId,
      answers,
      processed,
      dimensions,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ dimensions, answers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Voice analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
