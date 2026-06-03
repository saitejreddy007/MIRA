import { sendViaGmail } from './gmail-client';

const SUBJECT_LINES = [
  'Reminder: Invoice {invoiceNumber}',
  'Follow-up: Invoice {invoiceNumber}',
  'Second reminder: Invoice {invoiceNumber}',
  'Final reminder: Invoice {invoiceNumber}',
];

const DISCLOSURE_FOOTERS: Record<string, string> = {
  PROACTIVE: 'Sent by MIRA on behalf of',
  PASSIVE: 'This message was sent via MIRA, an assistant used by',
  MINIMAL: '',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(
  messageText: string,
  businessName: string,
  ownerPhone: string | null | undefined,
  disclosureLevel: string,
  followUpId: number | null
): string {
  const phoneLine = ownerPhone
    ? `<p style="font-size: 12px; color: #9ca3af;">Phone: ${escapeHtml(ownerPhone)}</p>`
    : '';
  const disclosureText = DISCLOSURE_FOOTERS[disclosureLevel] ?? DISCLOSURE_FOOTERS.PROACTIVE;
  const footerLine = disclosureText
    ? `<p style="font-size: 12px; color: #9ca3af;">${disclosureText} ${escapeHtml(businessName)}</p>`
    : '';
  const trackingPixel = followUpId
    ? `<img src="${getAppBaseUrl()}/api/track/open/${followUpId}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`
    : '';
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <p style="font-size: 16px; line-height: 1.6; color: #1b1b1b; white-space: pre-wrap;">${escapeHtml(messageText)}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    ${phoneLine}
    ${footerLine}
    ${trackingPixel}
  </div>`;
}

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    'http://localhost:3000'
  );
}

export async function sendFollowUpEmail(params: {
  to: string;
  clientName: string;
  messageText: string;
  invoiceNumber: string;
  position: number;
  businessName: string;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  gmailRefreshToken?: string | null;
  disclosureLevel?: string | null;
  followUpId?: number | null;
}): Promise<{ success: boolean; error?: string }> {
  const subject = (SUBJECT_LINES[params.position] || SUBJECT_LINES[0]).replace('{invoiceNumber}', params.invoiceNumber);
  const html = buildHtml(
    params.messageText,
    params.businessName,
    params.ownerPhone,
    params.disclosureLevel || 'PROACTIVE',
    params.followUpId ?? null
  );

  if (!params.gmailRefreshToken || !params.ownerEmail) {
    return { success: false, error: 'Gmail not connected — connect in Settings > Email' };
  }

  const gmailResult = await sendViaGmail({
    to: params.to,
    subject,
    html,
    fromEmail: params.ownerEmail,
    fromName: params.businessName,
    refreshToken: params.gmailRefreshToken,
  });

  if (gmailResult.success) return { success: true };

  if (gmailResult.error === 'gmail_token_expired') {
    return { success: false, error: 'Gmail token expired — reconnect in Settings > Email' };
  }

  return gmailResult;
}
