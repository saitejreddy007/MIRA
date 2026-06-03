'use client';

import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';

const tabs = [
  { href: '/voice/constitution', label: 'Voice Constitution', value: 'constitution' },
  { href: '/voice/vault', label: 'Voice Vault', value: 'vault' },
];

export function VoiceNav() {
  const pathname = usePathname();
  const current = useMemo(() => {
    if (pathname.includes('/voice/vault')) return 'vault';
    return 'constitution';
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
