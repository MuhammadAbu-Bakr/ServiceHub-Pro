-- ============================================================
-- ServiceHub Pro — Proposals (Job Applications)
-- Run this AFTER jobs_schema.sql
-- ============================================================

-- ── 1. Proposals table ──────────────────────────────────────
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

  -- Ensure a freelancer can only apply once per job
  unique(job_id, freelancer_id)
);

-- ── 2. Row Level Security ──────────────────────────────────
alter table public.proposals enable row level security;

-- Freelancers can view their own proposals
create policy "Freelancers can view own proposals"
  on public.proposals for select
  using (auth.uid() = freelancer_id);

-- Clients can view all proposals for their own jobs
create policy "Clients can view proposals for their jobs"
  on public.proposals for select
  using (
    exists (
      select 1 from public.jobs
      where id = public.proposals.job_id
      and client_id = auth.uid()
    )
  );

-- Only freelancers can submit proposals
create policy "Freelancers can submit proposals"
  on public.proposals for insert
  with check (
    auth.uid() = freelancer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'freelancer'
    )
  );

-- Freelancers can withdraw (delete) their own proposals
create policy "Freelancers can withdraw proposals"
  on public.proposals for delete
  using (auth.uid() = freelancer_id);

-- Clients can update the status (accept/reject)
create policy "Clients can update proposal status"
  on public.proposals for update
  using (
    exists (
      select 1 from public.jobs
      where id = public.proposals.job_id
      and client_id = auth.uid()
    )
  )
  with check (
    status in ('accepted', 'rejected') -- Limit what clients can change
  );

-- ── 3. Trigger for updated_at ───────────────────────────────
drop trigger if exists on_proposal_updated on public.proposals;
create trigger on_proposal_updated
  before update on public.proposals
  for each row execute procedure public.handle_updated_at();
