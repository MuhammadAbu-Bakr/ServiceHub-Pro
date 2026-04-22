'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action — Submit a job proposal (application).
 * Validates auth (must be a freelancer) and checks for duplicates.
 *
 * @param {FormData} formData
 * @returns {{ success?: true, proposal?: object, error?: string }}
 */
export async function submitProposal(formData) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'You must be logged in to apply.' };

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'freelancer') {
    return { error: 'Only freelancer accounts can submit proposals.' };
  }

  // 3. Parse fields
  const jobId = formData.get('job_id');
  const coverLetter = formData.get('cover_letter')?.toString().trim();
  const bidAmount = Number(formData.get('bid_amount'));

  if (!jobId) return { error: 'Job ID is missing.' };
  if (!coverLetter || coverLetter.length < 20) {
    return { error: 'Cover letter must be at least 20 characters.' };
  }

  // 4. Insert proposal
  const { data: proposal, error: insertError } = await supabase
    .from('proposals')
    .insert({
      job_id: jobId,
      freelancer_id: user.id,
      cover_letter: coverLetter,
      bid_amount: bidAmount || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'You have already applied for this job.' };
    }
    console.error('Proposal insert error:', insertError);
    return { error: 'Failed to submit proposal. Please try again.' };
  }

  // 5. Revalidate
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/dashboard');

  return { success: true, proposal };
}

/**
 * Server Action — Update proposal status (Accept/Reject).
 * Called by clients.
 *
 * @param {string} proposalId
 * @param {'accepted'|'rejected'} status
 * @returns {{ success?: true, error?: string }}
 */
export async function updateProposalStatus(proposalId, status) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', proposalId);

  if (error) return { error: 'Failed to update proposal status.' };

  revalidatePath('/dashboard');
  return { success: true };
}
