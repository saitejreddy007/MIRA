import { logger } from '@/lib/logger';
import { retryWithBackoff } from '@/lib/retry';
import { sanitizeError, safeUpstreamError } from '@/lib/errors/sanitize';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model fallback chain: try primary, then fallbacks on 429/5xx
const MODEL_CHAIN = [
  process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free',
  'z-ai/glm-4.5-air:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
];

let apiKey: string | null = null;

function getApiKey(): string {
  if (!apiKey) {
    apiKey = process.env.OPENROUTER_API_KEY || null;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }
  }
  return apiKey;
}

function extractJson(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock) return jsonBlock[1].trim();
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return text;
}

export class OpenRouterError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

async function callOpenRouterWithModel(
  messages: { role: string; content: string }[],
  model: string
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
}

export async function generateJson<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const messages: { role: string; content: string }[] = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  messages.push({ role: 'user', content: prompt });

  let response: Response | null = null;
  let lastError: unknown = null;

  // Try each model in the fallback chain
  for (const model of MODEL_CHAIN) {
    try {
      response = await retryWithBackoff(
        async () => {
          const res = await callOpenRouterWithModel(messages, model);
          // Throw on retryable status codes so retryWithBackoff can retry
          if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
            let body = '';
            try { body = await res.text(); } catch { /* ignore */ }
            logger.warn({ model, status: res.status, body: body.slice(0, 200) }, 'openrouter retryable error');
            const err = new OpenRouterError(res.status, `HTTP ${res.status}`);
            throw err;
          }
          return res;
        },
        {
          maxAttempts: 2,
          initialDelayMs: 1500,
          onRetry: (attempt, err, nextDelay) => {
            logger.warn({ model, attempt, nextDelay, err: err instanceof Error ? err.message : String(err) }, 'openrouter retry');
          },
        }
      );

      // If we got a non-429/5xx response, check if it's usable
      if (response.ok) {
        logger.info({ model }, 'openrouter model succeeded');
        break;
      }

      // Non-retryable error (400, 401, 403, 404) — try next model
      if (response.status === 400 || response.status === 404) {
        let body = '';
        try { body = await response.text(); } catch { /* ignore */ }
        logger.warn({ model, status: response.status, body: body.slice(0, 200) }, 'openrouter model unavailable, trying next');
        response = null;
        continue;
      }

      // Other non-OK status — break and report error
      break;
    } catch (err) {
      lastError = err;
      logger.warn({ model, err: err instanceof Error ? err.message : String(err) }, 'openrouter model exhausted retries, trying next');
      response = null;
      continue;
    }
  }

  if (!response) {
    const errMsg = lastError instanceof Error ? lastError.message : 'All AI models failed';
    logger.error({ err: errMsg }, 'openrouter all models failed');
    throw new OpenRouterError(0, 'AI generation failed after trying all available models. Please try again in a minute.');
  }

  if (!response.ok) {
    let errorBody = '';
    try { errorBody = await response.text(); } catch { /* ignore */ }
    logger.error({ status: response.status, statusText: response.statusText, body: errorBody.slice(0, 500) }, 'openrouter non-OK response');
    const sanitized = safeUpstreamError(response, 'openrouter');
    throw new OpenRouterError(response.status, sanitized.message);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  if (!text) {
    logger.warn({ responseKeys: Object.keys(data || {}) }, 'openrouter returned empty content');
    throw new OpenRouterError(200, 'AI returned empty response');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const extracted = extractJson(text);
    try {
      return JSON.parse(extracted) as T;
    } catch {
      logger.error({ textSample: text.slice(0, 200) }, 'openrouter JSON parse failed');
      throw new OpenRouterError(200, 'AI returned invalid JSON response');
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    logger.error({ status: response.status, statusText: response.statusText }, 'openrouter embedding non-OK response');
    throw new OpenRouterError(response.status, 'Failed to generate embedding');
  }

  const data = await response.json();
  if (!data.data?.[0]?.embedding) {
    throw new OpenRouterError(200, 'Invalid embedding response format');
  }

  return data.data[0].embedding;
}
