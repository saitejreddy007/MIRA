'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getVoiceVaultEntries() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) throw new Error('Unauthorized');

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();

  if (!user?.business_id) throw new Error('No business linked');

  const { data: entries, error } = await supabase
    .from('voice_vault')
    .select('id, content, context_tags, created_at')
    .eq('business_id', user.business_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch entries: ' + error.message);
  }

  return entries.map((e: any) => ({
    id: e.id,
    content: e.content,
    contextTags: e.context_tags,
    createdAt: new Date(e.created_at),
  }));
}

export async function deleteVoiceVaultEntry(id: number) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) throw new Error('Unauthorized');

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();

  if (!user?.business_id) throw new Error('No business linked');

  const { error } = await supabase
    .from('voice_vault')
    .delete()
    .eq('id', id);
    // RLS ensures they can only delete their own entries

  if (error) {
    throw new Error('Failed to delete entry: ' + error.message);
  }

  revalidatePath('/settings/voice-vault');
  return { success: true };
}
