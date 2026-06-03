'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Bell, Plus, type LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav';
import { MobileNav } from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';

interface HeaderToolbarProps {
  userName: string;
  userEmail?: string;
  companyName?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function HeaderToolbar({
  userName,
  userEmail,
  companyName = 'MIRA',
  action,
  className,
}: HeaderToolbarProps) {
  const ActionIcon = action?.icon ?? Plus;

  const openSearch = () => {
    document.dispatchEvent(new CustomEvent('mira:open-search'));
  };

  const openNotifications = () => {
    document.dispatchEvent(new CustomEvent('mira:open-notifications'));
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3',
        'bg-background/80 backdrop-blur-md border-b border-border',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileNav
          companyName={companyName}
          userName={userName}
          userEmail={userEmail}
        />
        <div className="min-w-0 flex-1">
          <BreadcrumbNav />
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center squircle-sm',
            'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent',
            'transition-colors duration-500 ease-spring cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <Search className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <button
          type="button"
          onClick={openNotifications}
          aria-label="Notifications"
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center squircle-sm',
            'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent',
            'transition-colors duration-500 ease-spring cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <Bell className="h-4 w-4" strokeWidth={2.25} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 squircle-full bg-rose-500 ring-2 ring-card" aria-hidden="true" />
        </button>

        <ThemeToggle />

        {action && (
          <>
            {action.href ? (
              <Link
                href={action.href}
                className="btn-primary hidden sm:inline-flex"
              >
                <ActionIcon className="h-4 w-4" strokeWidth={2.5} />
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="btn-primary hidden sm:inline-flex"
              >
                <ActionIcon className="h-4 w-4" strokeWidth={2.5} />
                {action.label}
              </button>
            )}
          </>
        )}

        <div
          className="ml-1 flex h-9 w-9 items-center justify-center squircle-sm bg-secondary text-foreground text-sm font-bold border border-border"
          title={userName}
          aria-label={userName}
        >
          {(userName || userEmail || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
