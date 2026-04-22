'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action — Submit work files (URL) for a contract.
 */
export async function submitWork(formData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const contractId = formData.get('contract_id');
  const fileUrl = formData.get('file_url')?.toString().trim();
  const message = formData.get('message')?.toString().trim();

  if (!contractId || !fileUrl) {
    return { error: 'Please provide a file URL.' };
  }

  // Verify caller is the freelancer of this contract
  const { data: contract } = await supabase
    .from('contracts')
    .select('freelancer_id, status')
    .eq('id', contractId)
    .single();

  if (!contract || contract.freelancer_id !== user.id) {
    return { error: 'Only the assigned freelancer can submit work.' };
  }

  if (contract.status !== 'active') {
    return { error: 'Contract is not active.' };
  }

  // Insert submission
  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      contract_id: contractId,
      freelancer_id: user.id,
      client_id: supabase.auth.uid, // Should get from contract, wait let's get it 
      file_url: fileUrl,
      message: message || null,
      status: 'pending'
    })
    .select()
    .single();

  // Fix client_id safely
  if (insertError?.code === '23502') {
     // Re-fetch full contract to inject client_id
     const { data: fullContract } = await supabase.from('contracts').select('client_id').eq('id', contractId).single();
     const { data: retrySubmission, error: retryError } = await supabase
      .from('submissions')
      .insert({
        contract_id: contractId,
        freelancer_id: user.id,
        client_id: fullContract.client_id,
        file_url: fileUrl,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();

      if (retryError) {
         console.error('Retry submission error:', retryError);
         return { error: 'Failed to submit work.' };
      }
      revalidatePath(`/dashboard/contracts/${contractId}`);
      revalidatePath('/dashboard');
      return { success: true, submission: retrySubmission };
  }

  if (insertError) {
    console.error('Submission error:', insertError);
    return { error: 'Failed to submit work.' };
  }

  revalidatePath(`/dashboard/contracts/${contractId}`);
  revalidatePath('/dashboard');
  return { success: true, submission };
}

/**
 * Server Action — Review Submission (Client only)
 */
export async function reviewSubmission(submissionId, actionType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  if (actionType === 'approved') {
    // Transactional completion
    const { error: rpcError } = await supabase.rpc(
      'approve_submission_complete_contract',
      { p_submission_id: submissionId }
    );
    if (rpcError) return { error: rpcError.message || 'Failed to approve.' };
  } else if (actionType === 'rejected') {
    // Simple update
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId)
      .eq('client_id', user.id);
    
    if (error) return { error: 'Failed to reject.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
