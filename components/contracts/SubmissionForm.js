'use client';

import { useState, useTransition } from 'react';
import { submitWork } from '@/lib/actions/submissions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export function SubmissionForm({ contractId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ file_url: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('contract_id', contractId);
    formData.set('file_url', form.file_url);
    formData.set('message', form.message);

    startTransition(async () => {
      const result = await submitWork(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  if (success) {
    return (
      <div className="glass rounded-2xl p-6 border border-emerald-500/20 text-center animate-fade-in">
        <span className="text-3xl mb-3 block">📤</span>
        <h3 className="text-white font-semibold mb-1">Work Submitted</h3>
        <p className="text-slate-400 text-sm">
          Your client has been notified to review the deliverables.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-brand-500/10">
      <h3 className="text-lg font-semibold text-white mb-1">Submit Deliverables</h3>
      <p className="text-slate-400 text-sm mb-5">Provide a link to your completed work files.</p>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="file_url"
          name="file_url"
          label="File URL (Google Drive, Figma, GitHub, etc.)"
          type="url"
          placeholder="https://..."
          value={form.file_url}
          onChange={(e) => setForm({ ...form, file_url: e.target.value })}
          required
        />
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1.5">
            Message (Optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Add any notes on how to view the files..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="input-field resize-none leading-relaxed"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isPending}
          disabled={isPending}
        >
          Submit Work
        </Button>
      </form>
    </div>
  );
}
