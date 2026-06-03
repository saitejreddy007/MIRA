export type SanitizedError = {
  message: string;
  status?: number;
  code?: string;
  upstream: 'openrouter' | 'gmail' | 'pipeline' | 'unknown';
};

const GENERIC_MESSAGES: Record<SanitizedError['upstream'], string> = {
  openrouter: 'AI generation failed. Please try again.',
  gmail: 'Gmail delivery failed. Please reconnect your Gmail account.',
  pipeline: 'Follow-up pipeline error.',
  unknown: 'Something went wrong. Please try again.',
};

const SAFE_STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request to upstream service.',
  401: 'Authentication failed with upstream service.',
  403: 'Access denied by upstream service.',
  404: 'Upstream resource not found.',
  429: 'Rate limit reached. Please try again shortly.',
  500: 'Upstream service is having issues. Please try again.',
  502: 'Upstream service is temporarily unavailable.',
  503: 'Upstream service is temporarily unavailable.',
  504: 'Upstream service timed out.',
};

function stripSensitive(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9_.-]{8,}/gi, 'Bearer [REDACTED]')
    .replace(/"api[_-]?key"\s*:\s*"[^"]+"/gi, '"api_key":"[REDACTED]"')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) =>
      m.split('@')[0]?.slice(0, 2) + '***@' + m.split('@')[1] || '***'
    )
    .slice(0, 300);
}

export function sanitizeError(
  err: unknown,
  upstream: SanitizedError['upstream'] = 'unknown',
  status?: number
): SanitizedError {
  if (err instanceof Error) {
    if (process.env.NODE_ENV !== 'production') {
      return { message: stripSensitive(err.message), status, code: err.name, upstream };
    }
    return {
      message: status && SAFE_STATUS_MESSAGES[status]
        ? SAFE_STATUS_MESSAGES[status]
        : GENERIC_MESSAGES[upstream],
      status,
      code: err.name,
      upstream,
    };
  }
  return { message: GENERIC_MESSAGES[upstream], status, upstream };
}

export function safeUpstreamError(
  response: Response,
  upstream: SanitizedError['upstream']
): SanitizedError {
  return {
    message:
      process.env.NODE_ENV !== 'production'
        ? `Upstream error (${response.status})`
        : SAFE_STATUS_MESSAGES[response.status] || GENERIC_MESSAGES[upstream],
    status: response.status,
    upstream,
  };
}
