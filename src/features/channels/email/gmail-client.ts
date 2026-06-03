import { google } from 'googleapis';
import { logger } from '@/lib/logger';
import { retryWithBackoff, throwIfNotOk } from '@/lib/retry';
import { sanitizeError } from '@/lib/errors/sanitize';

export async function sendViaGmail(params: {
  to: string;
  subject: string;
  html: string;
  fromEmail: string;
  fromName: string;
  refreshToken: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    oauth2Client.setCredentials({ refresh_token: params.refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const subject = `=?UTF-8?B?${Buffer.from(params.subject, 'utf-8').toString('base64')}?=`;

    const message = [
      `From: ${params.fromName} <${params.fromEmail}>`,
      `To: ${params.to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.html,
    ].join('\r\n');

    const encoded = Buffer.from(message, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await retryWithBackoff(
      async () => {
        const r = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
        if ((r.status < 200 || r.status >= 300) && r.status !== 200) {
          await throwIfNotOk(
            new Response(r.data ? JSON.stringify(r.data) : '', {
              status: r.status,
              statusText: r.statusText,
            })
          );
        }
        return r;
      },
      {
        maxAttempts: 3,
        shouldRetry: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('invalid_grant') || msg.includes('Token has been expired')) {
            return false;
          }
          if (err && typeof err === 'object' && 'status' in err) {
            const status = (err as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return true;
        },
        onRetry: (attempt, err, nextDelay) => {
          logger.warn({ attempt, nextDelay, to: params.to, err: err instanceof Error ? err.message : String(err) }, 'gmail retry');
        },
      }
    );

    return { success: true, id: response.data.id ?? undefined };
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : 'Unknown Gmail error';
    if (rawMessage.includes('invalid_grant') || rawMessage.includes('Token has been expired')) {
      return { success: false, error: 'gmail_token_expired' };
    }
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 429) {
        logger.error({ to: params.to, status }, 'gmail: rate limited (daily quota)');
        return { success: false, error: 'gmail_quota_exceeded' };
      }
      if (status === 403) {
        logger.error({ to: params.to, status }, 'gmail: forbidden');
        return { success: false, error: 'gmail_forbidden' };
      }
    }
    logger.error({ err: rawMessage, to: params.to }, 'gmail send failure');
    return { success: false, error: sanitizeError(err, 'gmail').message };
  }
}
