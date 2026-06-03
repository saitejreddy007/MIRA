'use client';

import * as React from 'react';
import { Bell, Check, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read?: boolean;
  href?: string;
}

const seedNotifications: Notification[] = [];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function GlobalNotifications() {
  const [items, setItems] = React.useState<Notification[]>(seedNotifications);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mira:open-notifications', onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mira:open-notifications', onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[aria-label^="Notifications"]')) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            'fixed right-2 sm:right-6 top-14 z-50 w-[min(380px,calc(100vw-1rem))] glass-card-strong squircle-lg p-1.5 animate-scale-in'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" strokeWidth={2.25} aria-hidden="true" />
              <p className="font-display text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <span className="squircle-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 nums">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors duration-500 ease-spring cursor-pointer inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring squircle-xs"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="h-px bg-border/60 my-1" aria-hidden="true" />
          {items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center squircle-md bg-muted mb-2">
                <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.href || '#'}
                    onClick={() => {
                      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
                      setOpen(false);
                    }}
                    className={cn(
                      'flex items-start gap-3 squircle-sm px-3 py-2.5 transition-colors duration-500 ease-spring cursor-pointer',
                      'hover:bg-accent/60 focus:bg-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      !n.read && 'bg-primary/[0.04]'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 squircle-full',
                        n.read ? 'bg-transparent' : 'bg-primary'
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {n.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1.5 nums">
                        {formatRelative(n.timestamp)}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="h-px bg-border/60 my-1" aria-hidden="true" />
          <a
            href="/invoices"
            className="block text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors duration-500 ease-spring py-2 squircle-sm hover:bg-accent/60"
          >
            View all activity
          </a>
        </div>
      )}
    </div>
  );
}
