import { describe, it, expect } from 'vitest';
import { determineNextAction, type TimingInputs } from '../follow-up-timing';

function baseInputs(overrides: Partial<TimingInputs> = {}): TimingInputs {
  return {
    invoice_due_date: '2026-01-15',
    days_overdue: 5,
    messages_sent: 0,
    last_message_sent_date: null,
    last_message_opened: false,
    last_message_open_date: null,
    payment_received: false,
    reply_received: false,
    reply_date: null,
    client_segment: 'B',
    detected_state: 'UNKNOWN',
    owner_override: null,
    human_escalation_required: false,
    ...overrides,
  };
}

describe('determineNextAction — termination', () => {
  it('stops when payment received', () => {
    const result = determineNextAction(baseInputs({ payment_received: true }));
    expect(result.type).toBe('stop');
    expect(result.reason).toBe('Payment received');
  });

  it('stops when owner_override is stop', () => {
    const result = determineNextAction(baseInputs({ owner_override: 'stop' }));
    expect(result.type).toBe('stop');
    expect(result.reason).toBe('Owner stopped sequence');
  });

  it('waits when owner_override is pause', () => {
    const result = determineNextAction(baseInputs({ owner_override: 'pause' }));
    expect(result.type).toBe('wait');
    expect(result.reason).toBe('Owner paused sequence');
  });

  it('escalates when human_escalation_required', () => {
    const result = determineNextAction(baseInputs({ human_escalation_required: true }));
    expect(result.type).toBe('escalate');
  });

  it('escalates when invoice is overdue beyond owner threshold', () => {
    const result = determineNextAction(
      baseInputs({ days_overdue: 10, messages_sent: 1, escalation_after_days: 7 })
    );
    expect(result.type).toBe('escalate');
    expect(result.reason).toContain('10 days overdue');
  });
});

describe('determineNextAction — max_messages', () => {
  it('respects max_messages=3 by default (escalate after 3 sent)', () => {
    const result = determineNextAction(baseInputs({ messages_sent: 3, last_message_sent_date: '2026-01-10' }));
    expect(result.type).toBe('escalate');
    expect(result.reason).toContain('3 messages sent');
  });

  it('respects max_messages=5 when set by business', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 4, max_messages: 5, last_message_sent_date: '2026-01-10', days_overdue: 0 })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(5);
  });

  it('escalates when messages_sent >= max_messages (5)', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 5, max_messages: 5, last_message_sent_date: '2026-01-10' })
    );
    expect(result.type).toBe('escalate');
    expect(result.reason).toContain('5 messages sent');
  });

  it('caps max_messages at 10 for safety', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 15, max_messages: 50, last_message_sent_date: '2026-01-10' })
    );
    expect(result.type).toBe('escalate');
  });
});

describe('determineNextAction — pre-due and message 1', () => {
  it('schedules pre-due reminder 3 days before due_date when no messages sent', () => {
    const result = determineNextAction(
      baseInputs({ invoice_due_date: '2026-01-20', days_overdue: -5, messages_sent: 0 })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(0);
    expect(result.scheduled_date).toBe('2026-01-17');
  });

  it('sends message 1 immediately when invoice is overdue and no messages sent', () => {
    const result = determineNextAction(baseInputs({ days_overdue: 2, messages_sent: 0 }));
    expect(result.type).toBe('send');
    expect(result.scheduled_date).toBe('immediately');
    expect(result.message_position).toBe(1);
  });
});

describe('determineNextAction — message 2 timing', () => {
  it('uses 7-day base interval for segment B with opened message', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(2);
    expect(result.reason).toContain('6 days after message 1');
  });

  it('adds 2 days for segment A', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', client_segment: 'A', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('8 days');
  });

  it('subtracts 2 days for segment C', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', client_segment: 'C', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('4 days');
  });

  it('uses 5-day base for segment D', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', client_segment: 'D', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('4 days');
  });

  it('extends interval by 3 days if state is CASH_FLOW', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'CASH_FLOW' })
    );
    expect(result.reason).toContain('9 days');
  });

  it('shortens interval by 2 days if state is DEPRIORITISING', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'DEPRIORITISING' })
    );
    expect(result.reason).toContain('4 days');
  });

  // Phase 3 state detection is not active yet — UNKNOWN/null proceeds with default interval
  it('schedules message 2 with default interval when state is UNKNOWN (no Phase-3 stall)', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'UNKNOWN' })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(2);
    // 7 day base - 1 (opened) = 6 days after 2026-01-10 → nearest preferred weekday
    expect(result.scheduled_date).toBeTruthy();
  });

  it('extends interval by 2 days if previous message was not opened', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: false, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('9 days');
  });

  it('shortens interval by 1 day if previous message was opened', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('6 days');
  });

  it('never schedules with interval < 1 day', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 1, last_message_sent_date: '2026-01-10', client_segment: 'C', last_message_opened: true, detected_state: 'DEPRIORITISING' })
    );
    expect(result.type).toBe('send');
    const d = new Date(result.scheduled_date!);
    const last = new Date('2026-01-10');
    const diff = (d.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBeGreaterThanOrEqual(1);
  });
});

describe('determineNextAction — message 3+ timing', () => {
  it('sends message 3 after message 2', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 2, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(3);
  });

  it('handles segment A modification for message 3', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 2, last_message_sent_date: '2026-01-10', client_segment: 'A', last_message_opened: true, detected_state: 'NORMAL' })
    );
    expect(result.reason).toContain('8 days');
  });

  it('handles CASH_FLOW for message 3 (+4 days)', () => {
    const result = determineNextAction(
      baseInputs({ messages_sent: 2, last_message_sent_date: '2026-01-10', last_message_opened: true, detected_state: 'CASH_FLOW' })
    );
    expect(result.reason).toContain('10 days');
  });
});

describe('determineNextAction — defaults', () => {
  it('waits when invoice is between pre-due and overdue windows', () => {
    const result = determineNextAction(baseInputs({ days_overdue: -1, messages_sent: 0 }));
    expect(result.type).toBe('wait');
  });

  // With 1 message sent and days_overdue=0 the engine now schedules message 2
  // (no longer stalls waiting for Phase-3 state detection)
  it('schedules message 2 when one message is sent and invoice is just due', () => {
    const result = determineNextAction(
      baseInputs({ days_overdue: 0, messages_sent: 1, last_message_sent_date: '2026-01-15' })
    );
    expect(result.type).toBe('send');
    expect(result.message_position).toBe(2);
    expect(result.scheduled_date).toBeTruthy();
  });
});
