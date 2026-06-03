'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface MobileNavProps {
  companyName: string;
  userName: string;
  userEmail?: string;
}

export function MobileNav({ companyName, userName, userEmail }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (open) {
      document.body.dataset.drawerOpen = 'true';
    } else {
      delete document.body.dataset.drawerOpen;
    }
  }, [open]);

  const handleSearch = () => {
    setOpen(false);
    document.dispatchEvent(new CustomEvent('mira:open-search'));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden inline-flex h-9 w-9 items-center justify-center squircle-sm border border-border bg-card text-foreground hover:bg-accent transition-colors duration-500 ease-spring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <SheetContent side="left" ariaLabel="Navigation">
        <div className="flex flex-col h-full pt-8">
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center squircle-sm bg-foreground text-background font-bold tracking-tighter text-base">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight truncate">
                {companyName}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Powered by MIRA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-2 squircle-sm px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors duration-500 ease-spring cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-2"
          >
            <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
            <span>Search</span>
          </button>

          <nav className="flex-1 overflow-y-auto -mx-1">
            <ul className="space-y-0.5 px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-active={active}
                      aria-current={active ? 'page' : undefined}
                      className="nav-link"
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border/60 pt-3 mt-3 space-y-2">
            {(userName || userEmail) && (
              <div className="squircle-md bg-muted p-3 flex items-center gap-2.5">
                <div className="h-8 w-8 shrink-0 squircle-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center">
                  {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{userName || 'Account'}</p>
                  {userEmail && (
                    <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                  )}
                </div>
              </div>
            )}

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="nav-link w-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
                <span>Sign out</span>
              </button>
            </form>

            <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium pt-2">
              A WhiteMirror product
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
