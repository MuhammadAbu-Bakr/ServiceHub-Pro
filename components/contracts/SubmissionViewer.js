'use client';

import { useState, useTransition } from 'react';
import { reviewSubmission } from '@/lib/actions/submissions';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/lib/utils';

export function SubmissionViewer({ submissions, isClient }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const handleAction = (id, actionType) => {
    setLoadingId(id);
    setError('');
    startTransition(async () => {
      const res = await reviewSubmission(id, actionType);
      setLoadingId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-slate-500 text-sm">
        No work submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {submissions.map(sub => (
        <div key={sub.id} className="glass rounded-2xl p-6 border border-surface-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`badge border text-xs px-2.5 py-1 mb-2 ${
                sub.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : sub.status === 'rejected' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}>
                {sub.status.toUpperCase()}
              </span>
              <p className="text-slate-500 text-xs">Submitted {formatTimeAgo(sub.created_at)}</p>
            </div>

            {/* Action buttons strictly for client when pending */}
            {isClient && sub.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm" variant="secondary"
                  className="!bg-red-500/10 !text-red-400 border-red-500/20"
                  disabled={isPending}
                  onClick={() => handleAction(sub.id, 'rejected')}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  loading={isPending && loadingId === sub.id}
                  disabled={isPending}
                  className="!bg-emerald-600 hover:!bg-emerald-500 !text-white !border-none"
                  onClick={() => handleAction(sub.id, 'approved')}
                >
                  Approve File
                </Button>
              </div>
            )}
          </div>

          <a
            href={sub.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary/50 border border-brand-500/20 hover:border-brand-500/50 hover:bg-surface-secondary transition-all text-brand-300 font-medium mb-3"
          >
            <span className="text-2xl">🔗</span>
            <span className="truncate">{sub.file_url}</span>
          </a>

          {sub.message && (
            <div className="text-sm text-slate-300 bg-surface-tertiary p-4 rounded-xl">
              <p className="whitespace-pre-wrap">{sub.message}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
