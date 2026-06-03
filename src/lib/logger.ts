import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: { service: 'mira' },
  redact: {
    paths: [
      'apiKey',
      'OPENROUTER_API_KEY',
      'RESEND_API_KEY',
      'gmailRefreshToken',
      'gmail_refresh_token',
      'authorization',
      'headers.authorization',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'clientSecret',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
