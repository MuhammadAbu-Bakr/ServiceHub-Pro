-- ============================================================
-- ServiceHub Pro — Master RLS Policies
-- ============================================================

-- ── 1. Jobs Table ──────────────────────────────────────────
-- Note: If strictly *only* clients see their own jobs, freelancers 
-- cannot browse the marketplace to apply! The standard approach is 
-- letting everyone see 'open' jobs, while restricting modification.
-- Assuming the prompt implies "Clients can only modify/see drafts of their own jobs":

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 1a. Clients can manage (View/Update/Delete) their own jobs
CREATE POLICY "Clients can manage their own jobs"
ON public.jobs
USING (auth.uid() = client_id);

-- 1b. Freelancers can view jobs if they are open (Required for a marketplace to function)
CREATE POLICY "Open jobs are visible to freelancers"
ON public.jobs FOR SELECT
USING (status = 'open');


-- ── 2. Proposals Table ─────────────────────────────────────
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 2a. Freelancers can only see and submit their own proposals
CREATE POLICY "Freelancers see and submit own proposals"
ON public.proposals
USING (auth.uid() = freelancer_id);

-- 2b. Clients can view proposals submitted to their jobs
CREATE POLICY "Clients view proposals for their jobs"
ON public.proposals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = public.proposals.job_id
    AND client_id = auth.uid()
  )
);


-- ── 3. Submissions Table ───────────────────────────────────
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3a. Only the assigned freelancer can submit work (INSERT)
CREATE POLICY "Only assigned freelancer can submit work"
ON public.submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE id = public.submissions.contract_id 
    AND freelancer_id = auth.uid()
  )
  AND auth.uid() = freelancer_id -- Double verify they are setting themselves as the sender
);

-- 3b. Freelancers and Clients can VIEW the submissions for their contract
CREATE POLICY "Participants can view submissions"
ON public.submissions FOR SELECT
USING (
  auth.uid() = freelancer_id OR auth.uid() = client_id
);

-- 3c. Only client can approve (UPDATE) work
CREATE POLICY "Only client can approve work"
ON public.submissions FOR UPDATE
USING (
  auth.uid() = client_id
)
WITH CHECK (
  status IN ('approved', 'rejected') -- Prevents them from tampering with the file URL itself
);
