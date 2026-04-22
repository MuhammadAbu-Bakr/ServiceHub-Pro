'use client';

import { useState, useTransition } from 'react';
import { submitProposal } from '@/lib/actions/proposals';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/**
 * ProposalForm Component
 * Allows freelancers to submit their bid and cover letter for a job.
 * 
 * @param {string} jobId
 * @param {boolean} alreadyApplied - Flag if the user has already applied
 * @param {string} budgetType - Fixed, Hourly, or Monthly
 */
export default function ProposalForm({ jobId, alreadyApplied, budgetType }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    cover_letter: '',
    bid_amount: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('job_id', jobId);
    formData.set('cover_letter', form.cover_letter);
    formData.set('bid_amount', form.bid_amount);

    startTransition(async () => {
      const result = await submitProposal(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  };

  if (alreadyApplied) {
    return (
      <div className="glass rounded-2xl p-8 border border-emerald-500/20 text-center">
        <span className="text-3xl mb-3 block">✅</span>
        <h3 className="text-white font-semibold mb-1">Proposal Submitted</h3>
        <p className="text-slate-400 text-sm">
          You have already applied for this position. You can track its status in your dashboard.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass rounded-2xl p-8 border border-emerald-500/20 text-center animate-fade-in">
        <span className="text-3xl mb-3 block">🎉</span>
        <h3 className="text-white font-semibold mb-1">Application Sent!</h3>
        <p className="text-slate-400 text-sm">
          Your proposal has been successfully submitted to the client.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-brand-500/10">
      <h3 className="text-white font-semibold mb-4 text-lg">Apply for this position</h3>
      
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="bid_amount" className="block text-sm font-medium text-slate-300 mb-1.5">
            Your Bid ({budgetType === 'Fixed' ? '$ Total' : `$ / ${budgetType === 'Hourly' ? 'hr' : 'mo'}`})
          </label>
          <Input
            id="bid_amount"
            name="bid_amount"
            type="number"
            placeholder="e.g. 1500"
            value={form.bid_amount}
            onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
            required
            min="1"
          />
        </div>

        <div>
          <label htmlFor="cover_letter" className="block text-sm font-medium text-slate-300 mb-1.5">
            Cover Letter
          </label>
          <textarea
            id="cover_letter"
            name="cover_letter"
            rows={5}
            placeholder="Introduce yourself and explain why you're a great fit for this project..."
            value={form.cover_letter}
            onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
            required
            className="input-field resize-none leading-relaxed min-h-[150px]"
          />
          <p className="text-[10px] text-slate-500 mt-1">Min. 20 characters</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isPending}
          disabled={isPending}
        >
          Submit Proposal
        </Button>

        <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest mt-4">
          🔒 Secure Application
        </p>
      </form>
    </div>
  );
}
