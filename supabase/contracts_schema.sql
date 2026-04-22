-- ============================================================
-- ServiceHub Pro — Contracts Table
-- Run this AFTER proposals_schema.sql
-- ============================================================

-- ── 1. Contracts table ──────────────────────────────────────
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

-- ── 2. Row Level Security ──────────────────────────────────
alter table public.contracts enable row level security;

-- Contract participants (client or freelancer) can view their contracts
create policy "Participants can view their contracts"
  on public.contracts for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- Only clients can insert (enforced via RPC below, but good as a fallback)
create policy "Clients can insert contracts"
  on public.contracts for insert
  with check (auth.uid() = client_id);

-- ── 3. Trigger for updated_at ───────────────────────────────
drop trigger if exists on_contract_updated on public.contracts;
create trigger on_contract_updated
  before update on public.contracts
  for each row execute procedure public.handle_updated_at();

-- ── 4. RPC: Transactionally accept proposal & create contract
create or replace function public.accept_proposal_create_contract(p_proposal_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_client_id uuid;
  v_freelancer_id uuid;
  v_bid_amount numeric;
  v_caller_id uuid := auth.uid();
  v_contract_id uuid;
begin
  -- 1. Get proposal & job details
  select p.job_id, p.freelancer_id, p.bid_amount, j.client_id
  into v_job_id, v_freelancer_id, v_bid_amount, v_client_id
  from public.proposals p
  join public.jobs j on j.id = p.job_id
  where p.id = p_proposal_id;

  if not found then
    raise exception 'Proposal not found';
  end if;

  -- 2. Verify caller is the client who owns the job
  if v_client_id <> v_caller_id then
    raise exception 'Unauthorized: Only the job owner can accept this proposal.';
  end if;

  -- 3. Update proposal status
  update public.proposals
  set status = 'accepted', updated_at = now()
  where id = p_proposal_id;

  -- 4. Automatically reject all other pending proposals for this job
  update public.proposals
  set status = 'rejected', updated_at = now()
  where job_id = v_job_id
    and id <> p_proposal_id
    and status = 'pending';

  -- 5. Mark job as closed (since it's filled)
  update public.jobs
  set status = 'closed', updated_at = now()
  where id = v_job_id;

  -- 6. Insert new contract
  insert into public.contracts (job_id, client_id, freelancer_id, proposal_id, price)
  values (v_job_id, v_client_id, v_freelancer_id, p_proposal_id, v_bid_amount)
  returning id into v_contract_id;

  return v_contract_id;
end;
$$;
