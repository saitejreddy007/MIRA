export const SEGMENT_TONES = {
  A: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-500/20',
  B: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/20',
  C: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20',
  D: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20',
  E: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/20',
} as const;

export type Segment = keyof typeof SEGMENT_TONES;

export const SEGMENT_LABELS: Record<Segment, string> = {
  A: 'Strategic',
  B: 'Growth',
  C: 'Steady',
  D: 'At-risk',
  E: 'Critical',
};

export const STATUS_BADGE_VARIANT = {
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'muted',
  pending: 'warning',
  draft: 'muted',
  sent: 'default',
  failed: 'destructive',
  delivered: 'success',
  bounced: 'destructive',
  opened: 'info',
  replied: 'success',
  escalated: 'destructive',
} as const;

export type InvoiceStatus = keyof typeof STATUS_BADGE_VARIANT;

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  pending: 'Pending',
  draft: 'Draft',
  sent: 'Sent',
  failed: 'Failed',
  delivered: 'Delivered',
  bounced: 'Bounced',
  opened: 'Opened',
  replied: 'Replied',
  escalated: 'Escalated',
};
