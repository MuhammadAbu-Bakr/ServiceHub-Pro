'use client';

import { useState, useTransition } from 'react';
import { updateProposalStatus } from '@/lib/actions/proposals';
import { acceptProposalAndCreateContract } from '@/lib/actions/contracts';
import Button from '@/components/ui/Button';
import { formatTimeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ProposalList({ proposals, jobId, budgetType }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const handleUpdateStatus = (proposalId, status) => {
    setLoadingId(proposalId);
    setError('');
    startTransition(async () => {
      await updateProposalStatus(proposalId, status);
      setLoadingId(null);
      router.refresh();
    });
  };

  const handleAcceptProposal = (proposalId) => {
    setLoadingId(proposalId);
    setError('');
    startTransition(async () => {
      const result = await acceptProposalAndCreateContract(proposalId);
      setLoadingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      // On success, the job is closed and contract created
      // Refreshing the route retrieves the new state
      router.refresh();
    });
  };

  if (!proposals || proposals.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center mt-6">
        <span className="text-4xl mb-3 block">📭</span>
        <h3 className="text-white font-semibold mb-1">No Proposals Yet</h3>
        <p className="text-slate-400 text-sm">
          Applications from freelancers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-4">
        <h3 className="text-xl font-semibold text-white">
          Proposals ({proposals.length})
        </h3>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid gap-4">
        {proposals.map((proposal) => {
          const profile = proposal.profiles || {};
          const isPendingCurrent = isPending && loadingId === proposal.id;

          return (
            <div
              key={proposal.id}
              className="glass rounded-2xl p-6 border border-brand-500/10 flex flex-col sm:flex-row gap-6 hover:border-brand-500/30 transition-colors"
            >
              {/* Left Column: Avatar & Basic Info */}
              <div className="flex flex-col items-center sm:w-1/4 flex-shrink-0 text-center sm:text-left sm:items-start border-b sm:border-b-0 sm:border-r border-surface-border pb-4 sm:pb-0 sm:pr-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg mx-auto sm:mx-0 mb-3">
                  {(profile.full_name || 'F')[0]}
                </div>
                <h4 className="text-white font-semibold text-sm w-full truncate">
                  {profile.full_name || 'Anonymous Freelancer'}
                </h4>
                
                <p className="text-slate-500 text-xs mt-1 w-full flex items-center justify-center sm:justify-start gap-1">
                  <span>⏱️</span> {formatTimeAgo(proposal.created_at)}
                </p>
                {/* Status Badge */}
                <div className="mt-3">
                  <span
                    className={`badge border text-xs px-2.5 py-1 ${
                      proposal.status === 'accepted'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : proposal.status === 'rejected'
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                    }`}
                  >
                    {proposal.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Right Column: Bid & Cover Letter */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      Proposed Bid
                    </span>
                    <span className="text-brand-300 font-bold text-lg">
                      ${proposal.bid_amount} 
                      <span className="text-slate-400 text-xs font-normal ml-1">
                        {budgetType === 'Hourly' ? '/hr' : budgetType === 'Monthly' ? '/mo' : ' total'}
                      </span>
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  {proposal.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPendingCurrent}
                        onClick={() => handleUpdateStatus(proposal.id, 'rejected')}
                        className="!bg-red-500/10 !text-red-400 !border-red-500/30 hover:!bg-red-500/20"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPendingCurrent}
                        loading={isPendingCurrent && loadingId === proposal.id}
                        onClick={() => handleAcceptProposal(proposal.id)}
                        className="!bg-emerald-600 hover:!bg-emerald-500 !text-white !border-none shadow-lg shadow-emerald-500/20"
                      >
                        Accept & Hire
                      </Button>
                    </div>
                  )}
                </div>

                <div className="prose prose-invert max-w-none text-sm text-slate-300 bg-surface-tertiary/50 p-4 rounded-xl border border-surface-border">
                  <p className="whitespace-pre-wrap leading-relaxed m-0 text-slate-300">
                    {proposal.cover_letter}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
