-- MIRA Migration 002 — Adds follow-up pipeline columns (safe, no data loss)
-- Run this in Supabase SQL Editor. Tables already exist with data.

-- ── businesses ──
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS max_follow_up_days INTEGER NOT NULL DEFAULT 45;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_escalation_after_days INTEGER NOT NULL DEFAULT 7;

-- ── clients ──
ALTER TABLE clients ADD COLUMN IF NOT EXISTS segment TEXT NOT NULL DEFAULT 'D';
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_segment_check;
ALTER TABLE clients ADD CONSTRAINT clients_segment_check CHECK (segment IN ('A', 'B', 'C', 'D', 'E'));

-- ── invoices ──
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS segment_override TEXT DEFAULT NULL;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_segment_override_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_segment_override_check CHECK (segment_override IN ('A', 'B', 'C', 'D', 'E'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_override TEXT DEFAULT NULL;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_owner_override_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_owner_override_check CHECK (owner_override IN ('stop', 'pause'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS human_escalation_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pre_due_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- ── follow_ups ──
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS message_position INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoices_segment_override ON invoices (segment_override);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_override ON invoices (owner_override);
CREATE INDEX IF NOT EXISTS idx_invoices_next_follow_up ON invoices (next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_invoices_pre_due ON invoices (pre_due_reminder_sent);
CREATE INDEX IF NOT EXISTS idx_follow_ups_message_position ON follow_ups (message_position);
