'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';

const tabs = [
  { href: '/settings', label: 'General', value: 'general' },
  { href: '/settings/connections', label: 'Connections', value: 'connections' },
];

export function SettingsNav() {
  const pathname = usePathname();
  const current = useMemo(() => {
    if (pathname === '/settings') return 'general';
    const match = tabs.find((t) => t.href !== '/settings' && pathname.startsWith(t.href));
    return match?.value || 'general';
  }, [pathname]);

  const handleValueChange = (val: string) => {
    const tab = tabs.find((t) => t.value === val);
    if (tab) {
      window.location.href = tab.href;
    }
  };

  return (
    <Tabs value={current} onValueChange={handleValueChange} className="mb-6">
      <TabsList className="flex-wrap h-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
