-- 1. Enable the vector extension in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Voice Vault table
CREATE TABLE IF NOT EXISTS voice_vault (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  context_tags JSONB DEFAULT '[]'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create an index for faster similarity searches
CREATE INDEX ON voice_vault USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE voice_vault ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Users can only manage their own business's vault entries
CREATE POLICY "Users can manage their business voice vault"
  ON voice_vault
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

-- 6. Add a Postgres function for vector similarity search so we can query it easily from our API
CREATE OR REPLACE FUNCTION match_voice_vault(
  query_embedding vector(1536),
  match_business_id UUID,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  context_tags JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vv.id,
    vv.content,
    vv.context_tags,
    1 - (vv.embedding <=> query_embedding) AS similarity
  FROM voice_vault vv
  WHERE vv.business_id = match_business_id
    AND 1 - (vv.embedding <=> query_embedding) > match_threshold
  ORDER BY vv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
