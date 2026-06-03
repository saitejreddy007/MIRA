'use client';

import { ReactNode } from 'react';

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-page-transition h-full w-full">
      {children}
    </div>
  );
}
