import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: LucideIcon;
  iconColor?: string;
  meta?: React.ReactNode;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
  emptyMessage?: string;
}

export function ActivityFeed({ items, className, emptyMessage = 'No activity yet' }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className={cn('relative space-y-1', className)}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <li
            key={item.id}
            className={cn(
              'group relative flex items-start gap-3 rounded-xl p-3 transition-colors duration-500 ease-spring',
              'hover:bg-accent cursor-default'
            )}
          >
            {/* Timeline rail */}
            {idx < items.length - 1 && (
              <div
                className="absolute left-[1.45rem] top-12 bottom-0 w-px bg-border/60"
                aria-hidden="true"
              />
            )}

            {Icon ? (
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border">
                <Icon className={cn('h-4 w-4', item.iconColor || 'text-foreground/70')} strokeWidth={2.25} />
              </div>
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-secondary border border-border" />
            )}

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(
                    typeof item.timestamp === 'string' ? item.timestamp : item.timestamp.toISOString()
                  )}
                </span>
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.meta && <div className="mt-1.5">{item.meta}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
