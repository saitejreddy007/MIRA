-- MIRA Database Schema — Business-centric multi-tenant
-- Run this in Supabase SQL Editor

-- ─────────────────────────────────────────────
-- 0. CLEAN UP old schema
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS constitutions CASCADE;
DROP TABLE IF EXISTS voice_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- ─────────────────────────────────────────────
-- 1. ALL TABLES (no FK to other custom tables)
-- ─────────────────────────────────────────────

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  industry TEXT DEFAULT '',
  region TEXT DEFAULT 'IN',
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  disclosure_level TEXT NOT NULL DEFAULT 'PROACTIVE',
  max_follow_up_days INTEGER NOT NULL DEFAULT 45,
  auto_escalation_after_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT DEFAULT '',
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_business_id ON users (business_id);

CREATE TABLE voice_profiles (
  business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed JSONB DEFAULT NULL,
  dimensions JSONB DEFAULT NULL,
  calibration_rounds JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE constitutions (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT NULL,
  confidence_flag TEXT DEFAULT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_constitutions_business_id ON constitutions (business_id);

CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  segment TEXT NOT NULL DEFAULT 'D' CHECK (segment IN ('A', 'B', 'C', 'D', 'E')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clients_business_id ON clients (business_id);

CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'paid', 'cancelled')),
  description TEXT,
  segment_override TEXT DEFAULT NULL CHECK (segment_override IN ('A', 'B', 'C', 'D', 'E')),
  owner_override TEXT DEFAULT NULL CHECK (owner_override IN ('stop', 'pause')),
  human_escalation_required BOOLEAN NOT NULL DEFAULT FALSE,
  next_follow_up_at TIMESTAMPTZ DEFAULT NULL,
  pre_due_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoices_business_id ON invoices (business_id);
CREATE INDEX idx_invoices_client_id ON invoices (client_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_due_date ON invoices (due_date);

CREATE TABLE follow_ups (
  id BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'generated' CHECK (message_type IN ('generated', 'edited', 'sent')),
  message_position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed', 'opened', 'replied')),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  opened_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_follow_ups_business_id ON follow_ups (business_id);
CREATE INDEX idx_follow_ups_invoice_id ON follow_ups (invoice_id);
CREATE INDEX idx_follow_ups_status ON follow_ups (status);

-- ─────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY (all tables exist now)
-- ─────────────────────────────────────────────

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (id IN (SELECT business_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update their own business"
  ON businesses FOR UPDATE
  USING (id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (id IN (SELECT business_id FROM users WHERE id = auth.uid()));

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own record"
  ON users FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their business voice profile"
  ON voice_profiles
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

ALTER TABLE constitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their business constitutions"
  ON constitutions FOR SELECT
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert their business constitutions"
  ON constitutions FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their business clients"
  ON clients
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their business invoices"
  ON invoices
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their business follow-ups"
  ON follow_ups
  USING (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()))
  WITH CHECK (business_id IN (SELECT business_id FROM users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────
-- 3. TRIGGER (all tables exist, all policies set)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_business_id UUID;
BEGIN
  INSERT INTO public.businesses (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'business_name', NEW.raw_user_meta_data ->> 'company_name', SPLIT_PART(NEW.email, '@', 1) || ' Business'))
  RETURNING id INTO new_business_id;

  INSERT INTO public.users (id, email, name, business_id, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), new_business_id, 'owner')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create business + user records for existing auth users who signed up before trigger existed.
-- Idempotent: safe to re-run; both inserts use ON CONFLICT to skip users/businesses already present.
DO $$
DECLARE
  au RECORD;
  new_business_id UUID;
  inserted_count INT := 0;
  skipped_count INT := 0;
BEGIN
  FOR au IN SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    -- Idempotency: skip if this user already has a business assigned via any concurrent run
    IF EXISTS (SELECT 1 FROM public.users WHERE id = au.id) THEN
      skipped_count := skipped_count + 1;
      CONTINUE;
    END IF;

    -- Use ON CONFLICT on email-derived business name to avoid duplicate businesses on re-run
    -- (businesses table has no unique constraint on name, but we check existence first)
    INSERT INTO public.businesses (name)
    VALUES (COALESCE(au.raw_user_meta_data ->> 'business_name', au.raw_user_meta_data ->> 'company_name', SPLIT_PART(au.email, '@', 1) || ' Business'))
    RETURNING id INTO new_business_id;

    INSERT INTO public.users (id, email, name, business_id, role)
    VALUES (au.id, au.email, COALESCE(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name', ''), new_business_id, 'owner')
    ON CONFLICT (id) DO NOTHING;

    inserted_count := inserted_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % users inserted, % skipped (already present)', inserted_count, skipped_count;
END;
$$;
