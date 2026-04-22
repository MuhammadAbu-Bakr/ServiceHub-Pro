-- ============================================================
-- ServiceHub Pro — Submissions Table
-- Run this AFTER contracts_schema.sql
-- ============================================================

-- ── 1. Submissions table ────────────────────────────────────
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

-- ── 2. Row Level Security ──────────────────────────────────
alter table public.submissions enable row level security;

-- Contract participants can view submissions
create policy "Participants can view submissions"
  on public.submissions for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- Only freelancers can insert submissions for their contracts
create policy "Freelancers can insert submissions"
  on public.submissions for insert
  with check (auth.uid() = freelancer_id);

-- Only clients can update the status of submissions
create policy "Clients can update submission status"
  on public.submissions for update
  using (auth.uid() = client_id)
  with check (status in ('approved', 'rejected'));

-- ── 3. Trigger for updated_at ───────────────────────────────
drop trigger if exists on_submission_updated on public.submissions;
create trigger on_submission_updated
  before update on public.submissions
  for each row execute procedure public.handle_updated_at();

-- ── 4. RPC: Approve submission & update contract ─────────────
create or replace function public.approve_submission_complete_contract(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract_id uuid;
  v_client_id uuid;
  v_caller_id uuid := auth.uid();
begin
  -- 1. Get submission details
  select contract_id, client_id
  into v_contract_id, v_client_id
  from public.submissions
  where id = p_submission_id;

  if not found then
    raise exception 'Submission not found';
  end if;

  -- 2. Verify caller is the client
  if v_client_id <> v_caller_id then
    raise exception 'Unauthorized: Only the client can approve this submission.';
  end if;

  -- 3. Update submission status
  update public.submissions
  set status = 'approved', updated_at = now()
  where id = p_submission_id;

  -- 4. Mark contract as completed
  update public.contracts
  set status = 'completed', updated_at = now()
  where id = v_contract_id;

end;
$$;
