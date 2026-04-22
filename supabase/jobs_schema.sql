-- ============================================================
-- ServiceHub Pro — Jobs Table
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- ── 1. Jobs table ──────────────────────────────────────────
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

-- ── 2. Row Level Security ──────────────────────────────────
alter table public.jobs enable row level security;

-- Anyone can view open jobs
create policy "Open jobs are publicly viewable"
  on public.jobs for select
  using (status = 'open');

-- Only authenticated clients can insert jobs
create policy "Clients can insert jobs"
  on public.jobs for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
  );

-- Only the job owner can update their jobs
create policy "Job owners can update their jobs"
  on public.jobs for update
  using (auth.uid() = client_id);

-- Only the job owner can delete their jobs
create policy "Job owners can delete their jobs"
  on public.jobs for delete
  using (auth.uid() = client_id);

-- ── 3. Auto-update updated_at on jobs ─────────────────────
drop trigger if exists on_job_updated on public.jobs;
create trigger on_job_updated
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();
