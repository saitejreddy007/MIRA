import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const followUpId = parseInt(id, 10);

  if (Number.isFinite(followUpId) && followUpId > 0) {
    try {
      const supabase = createServiceRoleClient();
      const { error: updateError } = await supabase
        .from('follow_ups')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', followUpId)
        .is('opened_at', null);
      if (updateError) {
        console.error(`[track/open] failed to mark opened_at for ${followUpId}:`, updateError.message);
      }
    } catch (err) {
      // Tracking failures must never block pixel load
      console.error('[track/open] unexpected error:', err);
    }
  }

  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
