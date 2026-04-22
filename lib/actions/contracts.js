'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action — Accept a proposal and create a contract.
 * Uses a Supabase RPC to transactionally verify ownership,
 * update the proposal, reject competing proposals, close the job,
 * and create the contract.
 *
 * @param {string} proposalId
 * @returns {{ success?: true, contractId?: string, error?: string }}
 */
export async function acceptProposalAndCreateContract(proposalId) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'You must be logged in to accept a proposal.' };

  // 2. Execute RPC function
  const { data: contractId, error: rpcError } = await supabase.rpc(
    'accept_proposal_create_contract',
    { p_proposal_id: proposalId }
  );

  if (rpcError) {
    console.error('RPC Error accepting proposal:', rpcError);
    // Supabase raises custom text exceptions directly from PL/pgSQL
    return { error: rpcError.message || 'Failed to accept proposal and create contract.' };
  }

  // 3. Revalidate affected pages
  revalidatePath('/dashboard');
  revalidatePath('/jobs/[id]', 'page');

  return { success: true, contractId };
}
