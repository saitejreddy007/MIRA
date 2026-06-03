'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WhiteMirrorAttribution } from '@/components/brand/WhiteMirrorAttribution';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Fingerprint,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Voice Profile', href: '/voice/constitution', icon: Fingerprint },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  companyName: string;
  userName: string;
  userEmail?: string;
  className?: string;
}

export function Sidebar({ companyName, userName, userEmail, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen shrink-0 glass border-r border-border/60',
        'transition-[width] duration-500 ease-spring',
        collapsed ? 'w-[4.5rem]' : 'w-64',
        className
      )}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2.5 p-4 border-b border-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center squircle-sm bg-foreground text-background font-bold tracking-tighter text-base">
            {(companyName || 'M').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="font-display text-sm font-semibold tracking-tight truncate"
                title={companyName}
              >
                {companyName}
              </p>
              <div className="mt-1">
                <WhiteMirrorAttribution className="!text-[9px]" />
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
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
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={2.25}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto squircle-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User card + sign out */}
        <div className="p-3 border-t border-border">
          {!collapsed && (userName || userEmail) && (
            <div className="mb-2 squircle-md bg-muted p-3 flex items-center gap-2.5">
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
              suppressHydrationWarning
              className={cn(
                'nav-link w-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10',
                'data-[active=false]:hover:text-rose-600'
              )}
              title={collapsed ? 'Sign out' : undefined}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
              {!collapsed && <span>Sign out</span>}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mt-1 nav-link w-full text-xs text-muted-foreground"
          >
            <span className={cn('transition-transform duration-500 ease-spring', collapsed && 'rotate-180')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
