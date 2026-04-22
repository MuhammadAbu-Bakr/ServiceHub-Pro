-- ============================================================
-- ServiceHub Pro — Scheduled Automations & Cron Jobs
-- Requires: Supabase pg_cron and pg_net extensions
-- ============================================================

-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── 1. Auto-Cancel Inactive Contracts ───────────────────────
-- Any contract that has been 'active' but hasn't had an update 
-- (like a work submission) in 30 days is automatically cancelled.
create or replace function public.cancel_inactive_contracts()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.contracts
  set status = 'cancelled', updated_at = now()
  where status = 'active'
    and updated_at < now() - interval '30 days';
end;
$$;

-- Schedule to run daily at midnight
select cron.schedule('cancel-inactive-contracts', '0 0 * * *', 'select public.cancel_inactive_contracts()');


-- ── 2. Handle Expired Jobs ──────────────────────────────────
-- Jobs that have been 'open' for more than 60 days without being
-- filled are automatically closed.
create or replace function public.expire_old_jobs()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.jobs
  set status = 'closed', updated_at = now()
  where status = 'open'
    and created_at < now() - interval '60 days';
end;
$$;

-- Schedule to run daily at midnight
select cron.schedule('expire-old-jobs', '0 0 * * *', 'select public.expire_old_jobs()');


-- ── 3. Send Daily Reminders (Webhook to Next.js API) ────────
-- Postgres cannot easily send robust HTML emails natively. The 
-- best practice is to use pg_net to ping an API route hosted on 
-- your Next.js application, which then executes the heavy lifting.
create or replace function public.trigger_daily_reminders()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  -- Ping the secure Next.js API route
  -- (Replace 'https://yoursite.com' and the Secret Token with actual env values in production)
  perform net.http_post(
    url := 'https://yoursite.com/api/cron/reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer CRON_SECRET_123"}'::jsonb,
    body := '{"event": "daily_reminders"}'::jsonb
  );
end;
$$;

-- Schedule to run every morning at 9:00 AM (server time)
select cron.schedule('trigger-daily-reminders', '0 9 * * *', 'select public.trigger_daily_reminders()');
