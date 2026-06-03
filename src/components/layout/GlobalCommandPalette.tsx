'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  group: 'Navigate' | 'Quick action';
  keywords?: string[];
}

const items: CommandItem[] = [
  { id: 'overview', label: 'Overview', description: 'Dashboard home', href: '/overview', icon: LayoutDashboard, group: 'Navigate' },
  { id: 'clients', label: 'Clients', description: 'Manage your client list', href: '/clients', icon: Users, group: 'Navigate' },
  { id: 'invoices', label: 'Invoices', description: 'Track every invoice', href: '/invoices', icon: FileText, group: 'Navigate' },
  { id: 'invoices-new', label: 'New invoice', description: 'Add an invoice manually', href: '/invoices/new', icon: Plus, group: 'Quick action' },
  { id: 'analytics', label: 'Analytics', description: 'Recovery intelligence', href: '/analytics', icon: BarChart3, group: 'Navigate' },
  { id: 'settings', label: 'Settings', description: 'Business & voice', href: '/settings', icon: Settings, group: 'Navigate' },
  { id: 'persona', label: 'Persona preview', description: 'See how MIRA writes', href: '/persona/preview', icon: Sparkles, group: 'Navigate' },
];

import { createClient } from '@/lib/supabase/client';

export function GlobalCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [dynamicItems, setDynamicItems] = React.useState<CommandItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setQuery('');
      setActiveIdx(0);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setActiveIdx(0);
      }
    };
    document.addEventListener('mira:open-search', onOpen as EventListener);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mira:open-search', onOpen as EventListener);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      
      // Fetch dynamic items
      const fetchDynamicData = async () => {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        
        const { data: userData } = await supabase.from('users').select('business_id').eq('id', auth.user.id).single();
        if (!userData?.business_id) return;
        
        const [clientsResponse, invoicesResponse] = await Promise.all([
          supabase.from('clients').select('id, name').eq('business_id', userData.business_id).limit(5),
          supabase.from('invoices').select('id, invoice_number, amount').eq('business_id', userData.business_id).limit(5)
        ]);
        
        const dynamic: CommandItem[] = [];
        
        if (clientsResponse.data) {
          clientsResponse.data.forEach(client => {
            dynamic.push({
              id: `client-${client.id}`,
              label: client.name,
              description: 'Client',
              href: `/clients/${client.id}`,
              icon: Users,
              group: 'Navigate',
              keywords: ['client']
            });
          });
        }
        
        if (invoicesResponse.data) {
          invoicesResponse.data.forEach(inv => {
            dynamic.push({
              id: `invoice-${inv.id}`,
              label: `Invoice ${inv.invoice_number}`,
              description: `Amount: ${inv.amount}`,
              href: `/invoices/${inv.id}`,
              icon: FileText,
              group: 'Navigate',
              keywords: ['invoice', inv.invoice_number]
            });
          });
        }
        
        setDynamicItems(dynamic);
      };
      
      fetchDynamicData();
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const allItems = [...items, ...dynamicItems];
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) => {
      const hay = [it.label, it.description, ...(it.keywords || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  React.useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) navigate(item.href);
    }
  };

  const grouped: Array<[string, CommandItem[]]> = [];
  filtered.forEach((it) => {
    const last = grouped[grouped.length - 1];
    if (last && last[0] === it.group) last[1].push(it);
    else grouped.push([it.group, [it]]);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideCloseButton className="max-w-xl p-0 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2.25} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search MIRA — clients, invoices, settings…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
            aria-label="Command palette"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 squircle-xs border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(([group, groupItems]) => (
              <div key={group} className="mb-1.5">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {groupItems.map((it) => {
                    const Icon = it.icon;
                    const flatIdx = filtered.findIndex((f) => f.id === it.id);
                    const isActive = flatIdx === activeIdx;
                    return (
                      <li key={it.id} data-idx={flatIdx}>
                        <button
                          type="button"
                          onClick={() => navigate(it.href)}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                          className={cn(
                            'w-full flex items-center gap-3 squircle-sm px-2.5 py-2.5 text-left transition-colors duration-500 ease-spring cursor-pointer',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive ? 'bg-accent' : 'hover:bg-accent/60'
                          )}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center squircle-sm bg-secondary border border-border text-foreground">
                            <Icon className="h-4 w-4" strokeWidth={2.25} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-foreground truncate">
                              {it.label}
                            </span>
                            {it.description && (
                              <span className="block text-xs text-muted-foreground truncate">
                                {it.description}
                              </span>
                            )}
                          </span>
                          <ArrowRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="squircle-xs border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">↑</kbd>
              <kbd className="squircle-xs border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="squircle-xs border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">↵</kbd>
              open
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="squircle-xs border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">⌘</kbd>
            <kbd className="squircle-xs border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">K</kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
