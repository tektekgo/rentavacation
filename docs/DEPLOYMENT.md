# Rent-A-Vacation Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Lovable Editor ──push──> GitHub (main branch) ──deploy──> Vercel PROD │
│        │                         │                              │        │
│        │                         │                              ▼        │
│        ▼                   (feature branches)          Supabase PROD     │
│   Lovable Preview                │                  (xzfllqndrlmhclqfybew)│
│        │                         ▼                                       │
│        │                    Vercel Preview                               │
│        │                         │                                       │
│        ▼                         ▼                                       │
│   Supabase DEV ◄────────────────────────────────────────────────────────┤
│   (oukbxqnlxnkainnligfz)                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Environment Mapping

| Environment | Frontend Host | Database | Usage |
|-------------|---------------|----------|-------|
| **Development** | Lovable Preview | Supabase DEV (`oukbxqnlxnkainnligfz`) | Active development & testing |
| **Preview** | Vercel Preview (PR/branch deploys) | Supabase DEV | PR reviews, feature testing |
| **Production** | Vercel (`rentavacation.lovable.app`) | Supabase PROD (`xzfllqndrlmhclqfybew`) | Live users |

---

## Repository

**GitHub:** https://github.com/tektekgo/rentavacation.git

---

## Deployment Workflows

### 1. Development (Lovable → Preview)

All code changes in Lovable are automatically:
1. Synced to GitHub `main` branch in real-time
2. Previewed instantly in Lovable's preview iframe
3. Connected to **Supabase DEV** project

**No manual steps required** - changes are immediately visible.

### 2. Production (GitHub → Vercel)

When code is pushed/synced to `main` branch:
1. Vercel automatically deploys to production
2. Live at: `https://rentavacation.lovable.app`
3. Uses **Supabase PROD** environment variables

### 3. Edge Function Deployment

Edge Functions must be deployed **manually via Supabase CLI** from your local machine.

```bash
# Clone repository (if not done)
git clone https://github.com/tektekgo/rentavacation.git
cd rentavacation

# Install Supabase CLI (if not installed)
npm install -g supabase

# Deploy to DEV
supabase link --project-ref oukbxqnlxnkainnligfz
supabase functions deploy send-email
supabase functions deploy send-verification-notification
supabase functions deploy send-booking-confirmation-reminder
supabase functions deploy process-deadline-reminders
supabase functions deploy create-booking-checkout
supabase functions deploy verify-booking-payment

# Deploy to PROD (switch project)
supabase link --project-ref xzfllqndrlmhclqfybew
supabase functions deploy send-email
supabase functions deploy send-verification-notification
supabase functions deploy send-booking-confirmation-reminder
supabase functions deploy process-deadline-reminders
supabase functions deploy create-booking-checkout
supabase functions deploy verify-booking-payment
```

---

## Environment Variables

### Vercel Configuration

**Production Environment:**
```env
VITE_SUPABASE_URL=https://xzfllqndrlmhclqfybew.supabase.co
VITE_SUPABASE_ANON_KEY=<prod_anon_key>
```

**Preview Environment:**
```env
VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
VITE_SUPABASE_ANON_KEY=<dev_anon_key>
```

### Supabase Edge Function Secrets

Set these in **both DEV and PROD** Supabase projects:

```bash
# Via CLI
supabase secrets set RESEND_API_KEY=re_your_key --project-ref <PROJECT_REF>
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx --project-ref <PROJECT_REF>

# Or via Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
```

**Required Secrets:**
| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Email delivery via Resend |
| `STRIPE_SECRET_KEY` | Stripe payment processing |

---

## Database Setup

### Extensions Required

Enable these in **both DEV and PROD** via Supabase Dashboard → Database → Extensions:

1. **pg_cron** - For scheduled jobs
2. **pg_net** - For HTTP requests from database

### Schema Migrations

Run migrations in order via Supabase SQL Editor:

1. `docs/supabase-migrations/001_initial_schema.sql`
2. `docs/supabase-migrations/002_seed_data.sql` (optional - sample data)
3. `docs/supabase-migrations/003_bidding_system.sql`
4. `docs/supabase-migrations/004_payout_tracking.sql`
5. `docs/supabase-migrations/005_cancellation_policies.sql`
6. `docs/supabase-migrations/006_owner_verification.sql`

---

## Automated Reminders (CRON Jobs)

### What the CRON SQL Does

The CRON SQL schedules a PostgreSQL job that runs every 30 minutes. It uses `pg_cron` to schedule and `pg_net` to make an HTTP POST request to the Edge Function.

```sql
-- Runs every 30 minutes, calls the edge function via HTTP
select cron.schedule(
  'process-deadline-reminders',   -- Job name
  '*/30 * * * *',                  -- Every 30 minutes
  $$
  select net.http_post(
    url:='https://<PROJECT_REF>.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### What the Edge Function Does

The `process-deadline-reminders` function:

1. **Queries pending booking confirmations** with deadlines within 12 hours
2. **Sends reminder emails to owners:**
   - Standard reminder (6-12 hours remaining)
   - Urgent reminder (< 6 hours remaining)
3. **Queries pending check-in confirmations** around check-in time
4. **Sends check-in reminders to travelers** within 2 hours of arrival
5. **Tracks which reminders were sent** to avoid duplicates

### Setup CRON Job

Run this SQL in **both DEV and PROD** Supabase SQL Editor:

**For PROD:**
```sql
select cron.schedule(
  'process-deadline-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_PROD_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**For DEV:**
```sql
select cron.schedule(
  'process-deadline-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_DEV_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Manage CRON Jobs

```sql
-- View all scheduled jobs
select * from cron.job;

-- Unschedule a job
select cron.unschedule('process-deadline-reminders');

-- View job run history
select * from cron.job_run_details order by start_time desc limit 20;
```

---

## Stripe Configuration

Currently in **Test Mode** for both environments.

- Test cards: `4242 4242 4242 4242`
- Dashboard: https://dashboard.stripe.com/test

**For Production:**
1. Activate Stripe account
2. Switch to live keys
3. Update `STRIPE_SECRET_KEY` in Supabase Edge Function secrets

---

## Troubleshooting

### Edge Functions Not Working

1. Verify function is deployed: `supabase functions list --project-ref <REF>`
2. Check secrets are set: `supabase secrets list --project-ref <REF>`
3. View logs: `supabase functions logs process-deadline-reminders --project-ref <REF>`

### CRON Job Not Running

1. Verify extensions enabled: `select * from pg_extension where extname in ('pg_cron', 'pg_net');`
2. Check job exists: `select * from cron.job;`
3. Check job history: `select * from cron.job_run_details order by start_time desc limit 10;`

### Emails Not Sending

1. Verify `RESEND_API_KEY` is set in Edge Function secrets
2. Verify domain is validated in Resend: https://resend.com/domains
3. Check Edge Function logs for errors

---

## Quick Reference

| Task | Command/Location |
|------|------------------|
| Deploy Edge Functions | `supabase functions deploy <name> --project-ref <ref>` |
| Set Secrets | `supabase secrets set KEY=value --project-ref <ref>` |
| View Function Logs | `supabase functions logs <name> --project-ref <ref>` |
| Enable Extensions | Supabase Dashboard → Database → Extensions |
| Run Migrations | Supabase Dashboard → SQL Editor |
| View CRON Jobs | `select * from cron.job;` |
| Vercel Settings | https://vercel.com/dashboard |

---

## Contact

- **Domain:** rentavacation.com
- **Phone:** 1-800-RAV-0800
- **Location:** Jacksonville, FL
