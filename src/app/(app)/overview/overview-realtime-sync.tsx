'use client';

import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';

export function OverviewRealtimeSync({ businessId }: { businessId: string }) {
  useRealtimeRefresh(['invoices', 'follow_ups'], businessId);
  return null;
}
