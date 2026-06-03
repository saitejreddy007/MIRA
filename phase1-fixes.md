# Phase 1 Fixes — Locked Plan

**Date:** 2026-06-02
**Scope:** Brand Voice + Auto-Send
**Status:** Locked, in execution

---

## Locked Decisions

| Q | Answer |
|---|---|
| A1 | **Upstash Redis** as queue (BRPOP / LPUSH). No QStash, no Inngest. |
| A2 | **Per-businessId lock** in Redis. Parallel across businesses, serial within. |
| B1 | **Defer Drizzle migration to Phase 2.** Keep Supabase JS client. |
| B2 | **Defer schema additions to Phase 2.** Use app-level Redis for idempotency/error tracking. |
| B3 | **RLS already exists** in Supabase. No work. |
| C1 | **Vercel Hobby** (10s timeout). Cron = kicker only. Worker = single-job BRPOP. |
| D1 | **Manual send uses full pipeline** (compliance + AI + lock). Closes the gap. |
| D2 | **Inbound email deferred to Phase 2.** |
| D3 | **WhatsApp deferred to Phase 2.** |
| E1 | **Generate new CRON_SECRET** (64-char hex). |

---

## Architecture: Kicker + Worker

```
vercel cron (every 5 min)
  POST /api/cron/send-followups
    • Reads businesses
    • For each business, fetches eligible invoices (pre-due + overdue)
    • LPUSH job into Upstash list "mira:queue:business:<id>"
    • Returns 200 within 9s
  ↓
Async worker
  POST /api/cron/worker
    • BRPOP "mira:queue:business:any" with 8s timeout
    • For each job:
       • withBusinessLock(businessId, fn)
       • withIdempotency(followupKey, fn)
       • processInvoice()  ← shared logic
       • Update invoice state
    • Returns 200
```

**Constraint:** Vercel Hobby = 10s/function. Cron = 9s, Worker = 9s.
**Throughput:** 1 invoice per 5min per business. Scales linearly with cron frequency.

---

## App-Level Idempotency (no schema column)

```
Key:    mira:idem:followup:<invoiceId>:<position>:<YYYYMMDD>
Value:  1
TTL:    86400 (24h)
Set:    SET key 1 NX EX 86400
Check:  if response is null → already processed → skip
```

**Why day-bucketed:** Different days can have different follow-up positions for the same invoice.
**Why TTL 24h:** If cron fails, next day = new bucket = new attempt.

---

## Bug Fix Catalog

| # | Severity | File | Fix |
|---|---|---|---|
| 1 | 🔴 Critical | `run-pipeline.ts:75` | `.not('status', 'in', '("paid","cancelled")')` → `.not('status', 'in', '(paid,cancelled)')` |
| 2 | 🔴 Critical | `run-pipeline.ts` (whole) | Split into kicker + worker, max 9s each |
| 3 | 🔴 Critical | `send-follow-up.ts` | Add compliance check, use full pipeline |
| 4 | 🔴 Critical | `send-follow-up.ts:88` | `messagePressure ?? MAX` → reject if null |
| 5 | 🟠 High | `add-client.ts:33` | Lowercase email before insert |
| 6 | 🟠 High | `import-clients.ts:72` | Lowercase email |
| 7 | 🟠 High | `lock-constitution.ts:84-106` | Rollback constitution insert if biz update fails |
| 8 | 🟠 High | `lock-constitution.ts:83` | `parseInt('v1.0',10) = 1`; switch to robust `Number()` or strip prefix |
| 9 | 🟠 High | `gmail-client.ts` | Parse response, detect quota, surface specific errors |
| 10 | 🟠 High | `resend-client.ts:56-59` | Read response body for better errors |
| 11 | 🟠 High | `clients/actions/*` (3 files) | Replace `['A','B','C','D','E']` with `import { VALID_SEGMENTS }` |
| 12 | 🟡 Med | `quality-gate.ts:58` | Unicode 13+ emoji regex |
| 13 | 🟡 Med | `quality-gate.ts:25-33` | Don't allow messages that omit required greeting |
| 14 | 🟡 Med | `lib/retry.ts` | Handle `Response` errors with status property |
| 15 | 🟢 Low | `run-pipeline.ts:208-223` | Insert follow_ups AFTER email succeeds (or mark 'failed') |
| 16 | 🟢 Low | `load-demo-data.ts:25-29` | Use shared `addDaysISO` |
| 17 | 🟢 Low | `run-pipeline.ts:275-279` | Use shared `addDaysISO` |

---

## Files to Create

- `src/lib/redis/client.ts`
- `src/lib/redis/lock.ts`
- `src/lib/redis/idempotency.ts`
- `src/lib/segments.ts`
- `src/lib/dates.ts`
- `src/app/api/cron/worker/route.ts`
- `src/features/follow-ups/actions/process-invoice.ts` (shared)
- `src/features/follow-ups/actions/dispatch.ts` (kicker)
- `src/lib/redis/__tests__/lock.test.ts`
- `src/lib/redis/__tests__/idempotency.test.ts`
- `src/features/follow-ups/actions/__tests__/process-invoice.test.ts`

## Files to Modify

- `.env.local` (CRON_SECRET)
- `.env.example` (CRON_SECRET)
- `src/app/api/cron/send-followups/route.ts` (→ kicker)
- `src/features/follow-ups/actions/run-pipeline.ts` (→ thin shim calling dispatch)
- `src/features/invoices/actions/send-follow-up.ts` (→ shared processInvoice)
- `src/features/clients/actions/add-client.ts`
- `src/features/clients/actions/import-clients.ts`
- `src/features/clients/actions/update-client-segment.ts`
- `src/features/clients/actions/load-demo-data.ts`
- `src/features/voice/actions/lock-constitution.ts`
- `src/features/voice/algorithm/quality-gate.ts`
- `src/features/channels/email/gmail-client.ts`
- `src/features/channels/email/resend-client.ts`
- `src/lib/retry.ts`
- `src/features/voice/algorithm/__tests__/quality-gate.test.ts` (extend)

---

## Execution Order

1. Generate CRON_SECRET
2. Shared constants: `lib/segments.ts`, `lib/dates.ts`
3. Redis layer: `client.ts`, `lock.ts`, `idempotency.ts`
4. Shared pipeline logic: `process-invoice.ts`
5. Kicker: `dispatch.ts`, update `run-pipeline.ts`, update cron route
6. Worker route
7. Fix `send-follow-up.ts` to use shared logic
8. Fix email clients + retry
9. Fix clients actions
10. Fix voice actions + quality gate
11. Tests
12. Verify: `tsc --noEmit && npm test && next build`

---

## What's Out of Scope (Phase 2/3/4)

- Inbound email handling (`channels/email/receive.ts`)
- Thread tracking
- WhatsApp (all 5 files)
- Persona layer (9 empty files)
- Conversation services (10 empty files)
- Memory layer (11 empty files)
- Ethics layer (6 empty files)
- Behavioral layer (5 empty files)
- Drizzle migration
- Schema additions (idempotency_key, retry_count, last_error columns)
- Production deploy / domain / DNS

---

## Constraints Recap

- **Vercel Hobby:** 10s timeout per function
- **Vercel Cron:** Every 5 min, Hobby tier
- **Supabase:** JS client (not Drizzle)
- **RLS:** Already in place at Supabase level
- **Upstash Redis:** REST API, used for queue + locks + idempotency
- **AI:** OpenRouter (`openrouter/owl-alpha`)
- **Email:** Gmail primary, Resend fallback
- **Stack:** Next.js 15 + React 19 + TypeScript 5.7
