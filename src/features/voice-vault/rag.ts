import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/features/ai/openrouter-client';
import { logger } from '@/lib/logger';

export interface RagContext {
  id: number;
  content: string;
  context_tags: string[];
  similarity: number;
}

export async function searchVoiceVault(
  businessId: string,
  query: string,
  limit: number = 3,
  threshold: number = 0.5
): Promise<RagContext[]> {
  try {
    // 1. Generate an embedding for the intent query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Query the Supabase pgvector function using RPC
    const supabase = await createServerSupabaseClient();
    
    // We pass the vector as a formatted string '[0.1, 0.2, ...]' because pgvector expects standard JSON array 
    const formattedEmbedding = `[${queryEmbedding.join(',')}]`;

    const { data, error } = await supabase.rpc('match_voice_vault', {
      query_embedding: formattedEmbedding,
      match_business_id: businessId,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      logger.error({ error, businessId }, 'Error executing match_voice_vault RPC');
      return [];
    }

    return data as RagContext[];
  } catch (err) {
    logger.error({ err, businessId }, 'Failed to perform RAG search');
    return [];
  }
}
