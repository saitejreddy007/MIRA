import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/features/ai/openrouter-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', auth.user.id)
      .single();

    if (!user?.business_id) {
      return NextResponse.json({ error: 'No business linked to user' }, { status: 403 });
    }

    const body = await request.json();
    const { content, contextTags = [] } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
    }

    const cleanedContent = content.trim();
    if (cleanedContent.length < 5) {
      return NextResponse.json({ error: 'Content too short' }, { status: 400 });
    }

    // Generate mathematical embedding for similarity search
    const embedding = await generateEmbedding(cleanedContent);

    // Save to the database using Supabase
    // pgvector expects a formatted array string
    const formattedEmbedding = `[${embedding.join(',')}]`;

    const { error: insertError } = await supabase
      .from('voice_vault')
      .insert({
        business_id: user.business_id,
        content: cleanedContent,
        context_tags: contextTags,
        embedding: formattedEmbedding,
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Voice vault ingest error:', err);
    return NextResponse.json({ error: err.message || 'Failed to ingest data' }, { status: 500 });
  }
}
