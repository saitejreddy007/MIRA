import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();

  if (!user?.business_id) {
    return NextResponse.redirect(new URL('/settings/connections?error=no-business', origin));
  }

  const source = request.nextUrl.searchParams.get('source') || 'settings';
  const statePayload = Buffer.from(JSON.stringify({ biz: user.business_id, source })).toString('base64');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/gmail/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
    prompt: 'consent',
    state: statePayload,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
