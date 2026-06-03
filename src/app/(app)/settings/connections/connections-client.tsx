'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, XCircle, AlertCircle, Shield, RefreshCw, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTile } from '@/components/shared/IconTile';
import { StatusBadge } from '@/components/shared/StatusBadge';

function Messages() {
  const searchParams = useSearchParams();
  const message = searchParams.get('success') || searchParams.get('error') || '';

  if (message === 'gmail-connected') {
    return (
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 mb-5 animate-fade-up">
        <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span className="font-semibold">Gmail connected successfully.</span>
      </div>
    );
  }

  if (message === 'gmail-denied' || message === 'no-refresh-token') {
    return (
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2.5 mb-5 animate-fade-up">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.25} />
        <span className="font-semibold">
          Grant the &quot;Send email on your behalf&quot; permission and try again.
        </span>
      </div>
    );
  }

  if (message === 'save-failed' || message === 'callback-failed' || message === 'token-exchange-failed') {
    return (
      <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5 mb-5 animate-fade-up">
        <XCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.25} />
        <span className="font-semibold">Failed to connect. Try again.</span>
      </div>
    );
  }

  if (message === 'missing-config') {
    return (
      <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5 mb-5 animate-fade-up">
        <XCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.25} />
        <span className="font-semibold">Google OAuth not configured.</span>
      </div>
    );
  }

  return null;
}

function ConnectionsContent({ gmailConnected, gmailEmail, source }: { gmailConnected: boolean; gmailEmail: string; source?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="glass-card p-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-5">
          <IconTile icon={Mail} size="lg" tone="brand" />
          <div>
            <h2 className="font-display text-base font-semibold">Gmail connection</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Send follow-ups from your own inbox</p>
          </div>
        </div>

        <Suspense fallback={null}>
          <Messages />
        </Suspense>

        <div className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-colors duration-500 ease-spring',
          gmailConnected
            ? 'bg-emerald-500/8 border-emerald-500/30'
            : 'glass border-border/60'
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <IconTile icon={Mail} size="lg" tone={gmailConnected ? 'success' : 'muted'} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {gmailConnected ? gmailEmail || 'Connected' : 'Not connected'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {gmailConnected
                  ? 'Emails are sent from this Gmail address'
                  : 'Connect Gmail to send from your own address'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <StatusBadge variant={gmailConnected ? 'success' : 'neutral'}>
              {gmailConnected ? 'Active' : 'Off'}
            </StatusBadge>
            <a
              href={`/api/gmail/auth${source ? `?source=${source}` : ''}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 h-8 text-xs font-semibold transition-all duration-500 ease-spring active:scale-[0.98] shadow-sm',
                gmailConnected
                  ? 'glass border border-border/60 text-foreground hover:bg-white/90 dark:hover:bg-white/5'
                  : 'text-white shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_-1px_0_rgba(0,0,0,0.08)_inset,0_8px_24px_-8px_rgba(34,197,94,0.5)] hover:-translate-y-px bg-primary'
              )}
            >
              {gmailConnected
                ? <><RefreshCw className="h-3 w-3" /> Reconnect</>
                : <><Mail className="h-3 w-3" /> Connect Gmail</>}
            </a>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Grants MIRA permission to <strong className="text-foreground font-semibold">send</strong> emails only.
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed pl-5">
            Emails appear to come from your Gmail address.
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed pl-5">
            If the token expires, reconnect above.
          </p>
        </div>
      </div>

      <div className="glass-card p-6 mt-6 animate-fade-up stagger-1">
        <div className="flex items-center gap-3 mb-5">
          <IconTile icon={MessageCircle} size="lg" tone="success" />
          <div>
            <h2 className="font-display text-base font-semibold">WhatsApp Business</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Send fast follow-ups via messaging</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">WhatsApp API</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
              Send follow-ups via WhatsApp for clients who prefer messaging. MIRA will detect which channel each client responds to fastest.
              <br /><br />
              <span className="text-primary font-medium">Coming soon. Email and Gmail are live today.</span>
            </p>
          </div>
          <StatusBadge variant="neutral" className="self-start sm:self-auto">Upcoming</StatusBadge>
        </div>
      </div>
    </div>
  );
}

export function ConnectionsSettingsClient(props: { gmailConnected: boolean; gmailEmail: string; source?: string }) {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-6 max-w-2xl animate-pulse">
          <div className="h-5 bg-foreground/8 rounded w-1/3 mb-4" />
          <div className="h-20 bg-foreground/8 rounded-2xl" />
        </div>
      }
    >
      <ConnectionsContent {...props} />
    </Suspense>
  );
}
