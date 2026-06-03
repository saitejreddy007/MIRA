export type NextAction = {
  type: 'send' | 'wait' | 'escalate' | 'stop';
  scheduled_date: string | null;
  scheduled_time: string | null;
  message_position: 0 | 1 | 2 | 3 | null;
  reason: string;
};

export type TimingInputs = {
  invoice_due_date: string;
  days_overdue: number;
  messages_sent: number;
  last_message_sent_date: string | null;
  last_message_opened: boolean;
  last_message_open_date: string | null;
  payment_received: boolean;
  reply_received: boolean;
  reply_date: string | null;
  client_segment: 'A' | 'B' | 'C' | 'D' | 'E';
  detected_state: string | null;
  owner_override: string | null;
  human_escalation_required: boolean;
  max_messages?: number;
  escalation_after_days?: number;
};

const DEFAULT_MAX_MESSAGES = 3;
const DEFAULT_ESCALATION_DAYS = 7;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isPreferredDay(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day >= 2 && day <= 4;
}

function nextPreferredDay(dateStr: string): string {
  let d = new Date(dateStr);
  for (let i = 0; i < 7; i++) {
    const day = d.getDay();
    if (day >= 2 && day <= 4) return d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 1);
  }
  return dateStr;
}

function avoidBadDays(dateStr: string): string {
  let d = new Date(dateStr);
  const day = d.getDay();
  if (day === 6) { d.setDate(d.getDate() + 2); }
  else if (day === 0) { d.setDate(d.getDate() + 1); }
  else if (day === 1 && d.getHours() < 10) { d.setHours(10, 0, 0, 0); }
  else if (day === 5 && d.getHours() >= 15) { d.setDate(d.getDate() + 3); }
  return d.toISOString().split('T')[0];
}

export function determineNextAction(inputs: TimingInputs): NextAction {
  const {
    days_overdue, messages_sent, payment_received, reply_received,
    last_message_sent_date, last_message_opened,
    client_segment, detected_state, owner_override,
    human_escalation_required,
  } = inputs;

  const maxMessages = Math.max(1, Math.min(inputs.max_messages ?? DEFAULT_MAX_MESSAGES, 10));
  const escalationAfterDays = Math.max(1, inputs.escalation_after_days ?? DEFAULT_ESCALATION_DAYS);

  // ── STEP 1: TERMINATION CHECK ──
  if (payment_received) return { type: 'stop', scheduled_date: null, scheduled_time: null, message_position: null, reason: 'Payment received' };
  if (owner_override === 'stop') return { type: 'stop', scheduled_date: null, scheduled_time: null, message_position: null, reason: 'Owner stopped sequence' };
  if (owner_override === 'pause') return { type: 'wait', scheduled_date: null, scheduled_time: null, message_position: null, reason: 'Owner paused sequence' };
  if (human_escalation_required) return { type: 'escalate', scheduled_date: null, scheduled_time: null, message_position: null, reason: 'Escalation required' };

  // Auto-escalate if invoice is overdue beyond the owner's threshold
  if (days_overdue >= escalationAfterDays && messages_sent > 0) {
    return { type: 'escalate', scheduled_date: null, scheduled_time: null, message_position: null, reason: `${days_overdue} days overdue (threshold ${escalationAfterDays})` };
  }

  if (messages_sent >= maxMessages && !payment_received) {
    return { type: 'escalate', scheduled_date: null, scheduled_time: null, message_position: Math.min(maxMessages, 3) as 0 | 1 | 2 | 3, reason: `${maxMessages} messages sent, no payment — escalate` };
  }

  // ── STEP 2: PRE-DUE TRIGGER ──
  if (days_overdue <= -3 && messages_sent === 0) {
    const sendDate = addDays(inputs.invoice_due_date, -3);
    return {
      type: 'send',
      scheduled_date: sendDate,
      scheduled_time: '09:00',
      message_position: 0,
      reason: 'Pre-due reminder',
    };
  }

  // ── STEP 7: REPLY RECEIVED OVERRIDE (Phase 2 stub) ──
  if (reply_received) {
    return { type: 'wait', scheduled_date: null, scheduled_time: null, message_position: null, reason: 'Reply received — handling in Phase 2' };
  }

  // ── STEP 3: MESSAGE 1 TIMING ──
  if (messages_sent === 0 && days_overdue >= 1) {
    return {
      type: 'send',
      scheduled_date: 'immediately',
      scheduled_time: null,
      message_position: 1,
      reason: 'First follow-up — invoice overdue',
    };
  }

  // ── STEP 4: MESSAGE 2 TIMING ──
  if (messages_sent === 1 && last_message_sent_date && maxMessages >= 2) {
    let baseInterval = 7;

    // Segment modifiers
    if (client_segment === 'A') baseInterval += 2;
    else if (client_segment === 'C') baseInterval -= 2;
    else if (client_segment === 'D') baseInterval = 5;

    // State modifiers (Phase 3: state detection not yet active — null/UNKNOWN uses default interval)
    if (detected_state === 'CASH_FLOW') baseInterval += 3;
    else if (detected_state === 'DEPRIORITISING') baseInterval -= 2;
    // null / UNKNOWN → no adjustment, proceed with default interval

    // Open modifiers
    if (!last_message_opened) baseInterval += 2;
    else baseInterval -= 1;

    baseInterval = Math.max(1, baseInterval);
    let sendDate = addDays(last_message_sent_date, baseInterval);

    // Step 6: Optimize send time
    sendDate = nextPreferredDay(sendDate);
    sendDate = avoidBadDays(sendDate);

    // Avoid same day as last message
    if (sendDate === last_message_sent_date.split('T')[0]) {
      sendDate = addDays(sendDate, 1);
      sendDate = nextPreferredDay(sendDate);
    }

    return {
      type: 'send',
      scheduled_date: sendDate,
      scheduled_time: '09:00',
      message_position: 2,
      reason: `Message 2 — ${baseInterval} days after message 1`,
    };
  }

  // ── STEP 5: MESSAGE 3+ TIMING (generalized for max_messages) ──
  if (messages_sent >= 2 && messages_sent < maxMessages && last_message_sent_date) {
    const position = Math.min(messages_sent + 1, maxMessages) as 0 | 1 | 2 | 3;
    let baseInterval = 7;

    if (client_segment === 'A') baseInterval += 2;
    else if (client_segment === 'C') baseInterval -= 2;

    if (detected_state === 'CASH_FLOW') baseInterval += 4;
    else if (detected_state === 'DEPRIORITISING') baseInterval -= 2;

    if (!last_message_opened) baseInterval += 2;
    else baseInterval -= 1;

    baseInterval = Math.max(1, baseInterval);
    let sendDate = addDays(last_message_sent_date, baseInterval);
    sendDate = nextPreferredDay(sendDate);
    sendDate = avoidBadDays(sendDate);

    if (sendDate === last_message_sent_date.split('T')[0]) {
      sendDate = addDays(sendDate, 1);
      sendDate = nextPreferredDay(sendDate);
    }

    return {
      type: 'send',
      scheduled_date: sendDate,
      scheduled_time: '09:00',
      message_position: position,
      reason: `Message ${position} — ${baseInterval} days after message ${messages_sent}`,
    };
  }

  // ── DEFAULT: Wait ──
  return {
    type: 'wait',
    scheduled_date: null,
    scheduled_time: null,
    message_position: null,
    reason: messages_sent === 0 ? 'Invoice not yet overdue' : 'Waiting for next scheduled date',
  };
}
