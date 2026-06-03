# MIRA — Deployment Guide

This guide walks you through deploying MIRA to Vercel with a Supabase backend. Estimated setup time: 45–60 minutes if you start from scratch.

## 1. Prerequisites

- A Vercel account (Pro plan required — see [Cron limits](#vercel-cron))
- A Supabase account (free tier is fine for the first 500 users)
- A Google Cloud project (for Gmail OAuth, optional but recommended)
- An OpenRouter account (for LLM calls — https://openrouter.ai)
- A Resend account (for email fallback, optional)
- A domain pointed at Vercel (optional but recommended for production)

## 2. Supabase Setup

### 2.1 Create a Project

1. Go to https://supabase.com/dashboard and create a new project
2. Save your database password somewhere safe — you'll need it later
3. Choose the region closest to your users (e.g., `ap-south-1` for India)

### 2.2 Run the Schema

The schema lives in two files:

```bash
# Apply DDL (tables, indexes, constraints)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f drizzle/schema.sql

# Apply RLS policies, triggers, and backfill
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f drizzle/rls.sql
```

Alternatively, paste each file into the Supabase SQL Editor (Database → SQL Editor → New query).

The `rls.sql` backfill block is idempotent — safe to re-run.

### 2.3 Get Your API Keys

Settings → API:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 3. Vercel Setup

### 3.1 Create Project

1. Push the MIRA repo to GitHub
2. In Vercel, click "New Project" → import the repo
3. Framework preset: Next.js (auto-detected)
4. Root directory: `.` (project root)

### 3.2 Environment Variables

Add these in Settings → Environment Variables. Apply to **Production** at minimum.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From §2.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | From §2.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | From §2.3 — used by cron, tracking pixel, server actions |
| `OPENROUTER_API_KEY` | Yes | From https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | No | Default: `openrouter/owl-alpha` |
| `CRON_SECRET` | Yes | Generate with `openssl rand -hex 32` |
| `RESEND_API_KEY` | No | From https://resend.com/api-keys (email fallback) |
| `RESEND_FROM` | No | e.g. `MIRA <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public app URL, e.g. `https://app.yourdomain.com` — used for email tracking pixels |
| `GMAIL_CLIENT_ID` | No | Google OAuth client ID (for Gmail channel) |
| `GMAIL_CLIENT_SECRET` | No | Google OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | No | Long-lived refresh token (see §5) |
| `GMAIL_FROM_EMAIL` | No | e.g. `you@gmail.com` |
| `GMAIL_FROM_NAME` | No | e.g. `Acme Studio` |
| `LOG_LEVEL` | No | `info` (default) / `debug` / `warn` / `error` |
| `NODE_ENV` | Set by Vercel | `production` in prod |

> **Vercel cron auth**: The cron route checks `Authorization: Bearer ${CRON_SECRET}`. Without it, anyone who knows the route URL could trigger sends. Always set this.

## 4. Vercel Cron

`vercel.json` is already configured with:

```json
{
  "crons": [{ "path": "/api/cron/send-followups", "schedule": "*/5 * * * *" }]
}
```

The cron handler:
- Requires `Authorization: Bearer ${CRON_SECRET}`
- Fetches all businesses, runs the pipeline, sends due follow-ups
- Returns 401 if unauthorized
- Logs structured events for observability

### Vercel Cron Limits

| Plan | Cron Frequency Limit |
| --- | --- |
| Hobby (free) | 2 cron jobs/day |
| Pro | 60 cron jobs/hour |
| Enterprise | Custom |

`*/5 * * * *` (every 5 minutes) requires **Vercel Pro**. Downgrade the schedule to `0 */12 * * *` (twice daily) if you stay on Hobby.

## 5. Gmail OAuth (Optional)

If you want to send follow-ups from a real Gmail account (e.g. `you@gmail.com`) instead of Resend:

### 5.1 Create OAuth Client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or use existing)
3. Enable the **Gmail API**
4. Configure OAuth consent screen:
   - User type: External
   - Scopes: `https://www.googleapis.com/auth/gmail.send`
   - Add your email as a test user
5. Create **OAuth 2.0 Client ID** credentials:
   - Application type: Web application
   - Authorized redirect URI: `https://developers.google.com/oauthplayground`
6. Save the Client ID and Client Secret

### 5.2 Get a Refresh Token

1. Go to https://developers.google.com/oauthplayground
2. Settings (gear icon) → "Use your own OAuth credentials" → enter your Client ID/Secret
3. In the API list on the left, find **Gmail API v1** → `https://www.googleapis.com/auth/gmail.send`
4. Click "Authorize APIs" → sign in with the Gmail account you want to send from
5. Click "Exchange authorization code for tokens"
6. Copy the **refresh token** to `GMAIL_REFRESH_TOKEN`

### 5.3 Wire It Up

Set `GMAIL_FROM_EMAIL` and `GMAIL_FROM_NAME` to the sender identity. MIRA will try Gmail first, fall back to Resend on any non-transient error.

> **Failure modes**:
> - `invalid_grant` (revoked token, password changed) — MIRA short-circuits the retry and logs the error. User must re-authorize.
> - Quota exceeded — MIRA retries 3x with backoff, then falls back to Resend.

## 6. First Deploy

1. Push your code to GitHub
2. Vercel will build and deploy automatically
3. Once deployed, run the cron manually to verify:

```bash
curl -X POST "https://your-app.vercel.app/api/cron/send-followups" \
  -H "Authorization: Bearer $CRON_SECRET"
```

4. Check Vercel logs for the structured events (`cron.send_followups.start`, `.success`, `.error`)

## 7. Smoke Test Checklist

After deploy, verify the basics:

- [ ] Sign up at `/signup` — should create auth user → trigger creates business + users row
- [ ] Check `public.users` table — your user should appear with role `owner`
- [ ] Complete voice onboarding → constitution should be locked
- [ ] Add a client with an invoice
- [ ] Manually trigger the cron — follow-up should be generated and sent (check inbox)
- [ ] Open the email → `opened_at` should populate in `follow_ups` table
- [ ] Check `/dashboard/overview` — KPIs should reflect the data

## 8. Observability

MIRA logs to stdout in JSON (via `pino`). On Vercel, view logs at:
- Vercel Dashboard → Project → Logs
- Filter by `level:error` for failures
- Filter by `event` for specific actions (e.g. `event:quality_gate.retry`, `event:demo_data_loaded`)

### Key Events

| Event | When |
| --- | --- |
| `cron.send_followups.start` | Cron fires |
| `cron.send_followups.success` | Cron completes |
| `quality_gate.retry` | Compliance fails, regenerating |
| `quality_gate.exhausted` | All retries failed, manual review needed |
| `pipeline.send_success` | Follow-up sent successfully |
| `pipeline.send_error` | Send failed |
| `email.opened` | Recipient opened the email (tracking pixel hit) |
| `override.set` | User overrode timing/segment |
| `demo_data_loaded` | User loaded sample data |
| `constitution.regenerated` | User regenerated their voice constitution |

## 9. Cost Notes

| Service | Free Tier | Typical Cost at Scale |
| --- | --- | --- |
| Vercel | 100GB bandwidth | $20/mo Pro for cron |
| Supabase | 500MB DB, 2GB bandwidth | $25/mo Pro for prod |
| OpenRouter | Pay per token (~$0.001–0.01/follow-up) | ~$10/mo for 1k follow-ups |
| Resend | 3k emails/mo, 100/day | $20/mo for 50k emails |
| Google Gmail API | Free | Free (with workspace limits) |

## 10. Troubleshooting

### "Constitution version is not a number"
This was a known issue fixed in Phase 1. If you see it, run `npx tsc --noEmit` and check `src/features/voice/actions/lock-constitution.ts` uses `parseInt(constitution.version, 10)`.

### Cron returns 401
Your `CRON_SECRET` env var is missing or doesn't match the one used in the request. Vercel injects the secret automatically into cron requests — your manual `curl` needs to pass it.

### "Function execution timed out" (60s on Hobby, 300s on Pro)
The pipeline runs sequentially per business. If you have 100+ businesses, consider batching the cron handler in Phase 2.

### "permission denied for table users"
The RLS policies expect the JWT to be set. Check that the Supabase client is using the user's session token, not the service role, for normal reads.

### Emails go to spam
- Set up SPF, DKIM, and DMARC records for your sending domain
- For Resend, verify the domain in the Resend dashboard
- For Gmail, warm up the account by sending to engaged recipients first

## 11. Backup & Recovery

- **Database**: Supabase Pro includes point-in-time recovery (7 days)
- **Constitution versions**: Never deleted — `constitutions` table keeps history
- **Voice profiles**: `calibration_rounds` JSONB is append-only per business

## 12. What's Next

This covers Phase 1 (AI Auto-Sender). Phase 2 will add:
- WhatsApp Business API channel
- Persona-based persona switching
- Live negotiation mode
- Transparency portal for clients

The current code is structured to accept these as additive features without schema migrations.
