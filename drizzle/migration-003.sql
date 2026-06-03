-- MIRA Migration 003 — Adds owner Gmail columns (safe, no data loss)
-- Run this in Supabase SQL Editor after migration-002.sql.

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_phone TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT DEFAULT NULL;
