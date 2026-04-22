-- ============================================================
-- ServiceHub Pro — Master Deployment Schema
-- Run this single file in the Supabase SQL Editor
-- ============================================================

-- ── 1. Setup & Extensions ──────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Generic update function
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. Profiles Table ──────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        references auth.users on delete cascade not null primary key,
  email       text        not null,
  full_name   text,
  avatar_url  text,
  role        text        not null default 'client'
                check (role in ('client', 'freelancer', 'admin')),
  bio         text,
  location    text,
  website     text,
  is_onboarded boolean    default false,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles for each row execute procedure public.handle_updated_at();

-- Auth Trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();


-- ── 3. Jobs Table ──────────────────────────────────────────
create table if not exists public.jobs (
  id          uuid        default gen_random_uuid() primary key,
  client_id   uuid        references public.profiles(id) on delete cascade not null,
  title       text        not null,
  description text        not null,
  category    text        not null default 'Other',
  type        text        not null default 'Contract'
                check (type in ('Full-time', 'Part-time', 'Contract', 'Freelance')),
  location    text        not null default 'Remote'
                check (location in ('Remote', 'Hybrid', 'On-site')),
  budget_min  numeric(12,2),
  budget_max  numeric(12,2),
  budget_type text        not null default 'Fixed'
                check (budget_type in ('Fixed', 'Hourly', 'Monthly')),
  tags        text[]      default '{}',
  status      text        not null default 'open'
                check (status in ('open', 'closed', 'draft')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

drop trigger if exists on_job_updated on public.jobs;
create trigger on_job_updated before update on public.jobs for each row execute procedure public.handle_updated_at();


-- ── 4. Proposals Table ─────────────────────────────────────
create table if not exists public.proposals (
  id             uuid        default gen_random_uuid() primary key,
  job_id         uuid        references public.jobs(id) on delete cascade not null,
  freelancer_id  uuid        references public.profiles(id) on delete cascade not null,
  cover_letter   text        not null,
  bid_amount     numeric(12,2),
  status         text        not null default 'pending'
                   check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null,
  unique(job_id, freelancer_id)
);

drop trigger if exists on_proposal_updated on public.proposals;
create trigger on_proposal_updated before update on public.proposals for each row execute procedure public.handle_updated_at();


-- ── 5. Contracts Table ─────────────────────────────────────
create table if not exists public.contracts (
  id             uuid        default gen_random_uuid() primary key,
  job_id         uuid        references public.jobs(id) on delete cascade not null,
  client_id      uuid        references public.profiles(id) on delete cascade not null,
  freelancer_id  uuid        references public.profiles(id) on delete cascade not null,
  proposal_id    uuid        references public.proposals(id) on delete restrict not null,
  price          numeric(12,2) not null,
  status         text        not null default 'active'
                   check (status in ('active', 'completed', 'cancelled')),
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

drop trigger if exists on_contract_updated on public.contracts;
create trigger on_contract_updated before update on public.contracts for each row execute procedure public.handle_updated_at();

-- Contract RPC
create or replace function public.accept_proposal_create_contract(p_proposal_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_job_id uuid;  v_client_id uuid; v_freelancer_id uuid;
  v_bid_amount numeric; v_caller_id uuid := auth.uid(); v_contract_id uuid;
begin
  select p.job_id, p.freelancer_id, p.bid_amount, j.client_id
  into v_job_id, v_freelancer_id, v_bid_amount, v_client_id
  from public.proposals p join public.jobs j on j.id = p.job_id
  where p.id = p_proposal_id;
  if not found then raise exception 'Proposal not found'; end if;
  if v_client_id <> v_caller_id then raise exception 'Unauthorized.'; end if;

  update public.proposals set status = 'accepted', updated_at = now() where id = p_proposal_id;
  update public.proposals set status = 'rejected', updated_at = now() where job_id = v_job_id and id <> p_proposal_id and status = 'pending';
  update public.jobs set status = 'closed', updated_at = now() where id = v_job_id;
  
  insert into public.contracts (job_id, client_id, freelancer_id, proposal_id, price)
  values (v_job_id, v_client_id, v_freelancer_id, p_proposal_id, v_bid_amount)
  returning id into v_contract_id;
  return v_contract_id;
end;
$$;


-- ── 6. Submissions Table ───────────────────────────────────
create table if not exists public.submissions (
  id             uuid        default gen_random_uuid() primary key,
  contract_id    uuid        references public.contracts(id) on delete cascade not null,
  freelancer_id  uuid        references public.profiles(id) on delete cascade not null,
  client_id      uuid        references public.profiles(id) on delete cascade not null,
  file_url       text        not null,
  message        text,
  status         text        not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

drop trigger if exists on_submission_updated on public.submissions;
create trigger on_submission_updated before update on public.submissions for each row execute procedure public.handle_updated_at();

-- Submission RPC
create or replace function public.approve_submission_complete_contract(p_submission_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_contract_id uuid; v_client_id uuid; v_caller_id uuid := auth.uid();
begin
  select contract_id, client_id into v_contract_id, v_client_id from public.submissions where id = p_submission_id;
  if not found then raise exception 'Submission not found'; end if;
  if v_client_id <> v_caller_id then raise exception 'Unauthorized.'; end if;

  update public.submissions set status = 'approved', updated_at = now() where id = p_submission_id;
  update public.contracts set status = 'completed', updated_at = now() where id = v_contract_id;
end;
$$;


-- ── 7. Unified RLS Policies ────────────────────────────────
-- Clean up all tables so RLS resets properly
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.submissions enable row level security;

-- Drop previous conflicting policies to ensure clean run
drop policy if exists "Profiles are publicly viewable" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Clients can manage their own jobs" on public.jobs;
drop policy if exists "Open jobs are visible to freelancers" on public.jobs;

drop policy if exists "Freelancers see and submit own proposals" on public.proposals;
drop policy if exists "Clients view proposals for their jobs" on public.proposals;

drop policy if exists "Participants can view their contracts" on public.contracts;
drop policy if exists "Clients can insert contracts" on public.contracts;

drop policy if exists "Only assigned freelancer can submit work" on public.submissions;
drop policy if exists "Participants can view submissions" on public.submissions;
drop policy if exists "Only client can approve work" on public.submissions;

-- Profiles
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Jobs
create policy "Clients can manage their own jobs" on public.jobs using (auth.uid() = client_id);
create policy "Open jobs are visible to freelancers" on public.jobs for select using (status = 'open');

-- Proposals
create policy "Freelancers see and submit own proposals" on public.proposals using (auth.uid() = freelancer_id);
create policy "Clients view proposals for their jobs" on public.proposals for select using (exists (select 1 from public.jobs where id = public.proposals.job_id and client_id = auth.uid()));

-- Contracts
create policy "Participants can view their contracts" on public.contracts for select using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- Submissions
create policy "Only assigned freelancer can submit work" on public.submissions for insert with check (exists (select 1 from public.contracts where id = public.submissions.contract_id and freelancer_id = auth.uid()) and auth.uid() = freelancer_id);
create policy "Participants can view submissions" on public.submissions for select using (auth.uid() = freelancer_id or auth.uid() = client_id);
create policy "Only client can update work status" on public.submissions for update using (auth.uid() = client_id) with check (status in ('approved', 'rejected'));


-- ── 8. System Automations (Cron) ───────────────────────────
create or replace function public.cancel_inactive_contracts()
returns void language plpgsql security definer set search_path = public as $$
begin update public.contracts set status = 'cancelled', updated_at = now() where status = 'active' and updated_at < now() - interval '30 days'; end;
$$;

create or replace function public.expire_old_jobs()
returns void language plpgsql security definer set search_path = public as $$
begin update public.jobs set status = 'closed', updated_at = now() where status = 'open' and created_at < now() - interval '60 days'; end;
$$;

create or replace function public.trigger_daily_reminders()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://your-app.vercel.app/api/cron/reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer CRON_SECRET_123"}'::jsonb,
    body := '{"event": "daily_reminders"}'::jsonb
  );
end;
$$;

select cron.schedule('cancel-inactive-contracts', '0 0 * * *', 'select public.cancel_inactive_contracts()');
select cron.schedule('expire-old-jobs', '0 0 * * *', 'select public.expire_old_jobs()');
select cron.schedule('trigger-daily-reminders', '0 9 * * *', 'select public.trigger_daily_reminders()');
