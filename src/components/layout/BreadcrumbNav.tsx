'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function BreadcrumbNav({ className }: { className?: string }) {
  const pathname = usePathname();

  const items: BreadcrumbItem[] = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Home' }];

    const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/overview' }];
    let path = '';
    segments.forEach((seg, idx) => {
      path += `/${seg}`;
      const label = humanize(seg);
      const isLast = idx === segments.length - 1;
      crumbs.push(isLast ? { label } : { label, href: path });
    });
    return crumbs;
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isFirst = idx === 0;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-500 ease-spring',
                    isFirst && 'gap-1'
                  )}
                >
                  {isFirst && <Home className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {isFirst && <Home className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function humanize(seg: string): string {
  // If it's a UUID/ID, return truncated
  if (seg.length > 12 && /^[\d-]+$/.test(seg)) {
    return `#${seg.slice(0, 6)}`;
  }
  // Decode common route names
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
