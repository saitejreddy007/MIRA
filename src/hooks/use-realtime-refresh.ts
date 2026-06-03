'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type TableName = 'invoices' | 'follow_ups' | 'clients';

export function useRealtimeRefresh(tables: TableName[], businessId?: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`realtime-${tables.join('-')}-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follow_ups' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, router, supabase, tables]);
}
