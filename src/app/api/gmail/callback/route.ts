import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code') || '';
  const state = reqUrl.searchParams.get('state') || '';
  const origin = reqUrl.origin;

  let parsedState: { biz: string; source: string };
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    if (!parsed || !parsed.biz) throw new Error();
    parsedState = parsed;
  } catch {
    // legacy fallback
    parsedState = { biz: state, source: 'settings' };
  }

  const redirectBase = parsedState?.source === 'onboarding' ? '/onboarding/integrations' : '/settings/connections';

  if (!code || !state) {
    return new Response(
      `<html><body><script>location.href="${origin}${redirectBase}?error=gmail-denied"</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokens = await tokenRes.json();
    if (!tokens.refresh_token) {
      throw new Error('No refresh_token');
    }

    // The actual Gmail address can be captured here if needed, but we don't save it to businesses.owner_email anymore.
    let gmailEmail: string | null = null;
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        gmailEmail = profile.email ?? null;
      }
    } catch {
      // Non-fatal — refresh token will still be saved
    }

    const supabase = createServiceRoleClient();

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        gmail_refresh_token: tokens.refresh_token,
      })
      .eq('id', parsedState.biz);

    if (updateError) throw updateError;

    return new Response(
      `<html><body><script>location.href="${origin}${redirectBase}?success=gmail-connected"</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Gmail callback error:', error);
    return new Response(
      `<html><body><script>location.href="${origin}${redirectBase}?error=callback-failed"</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
