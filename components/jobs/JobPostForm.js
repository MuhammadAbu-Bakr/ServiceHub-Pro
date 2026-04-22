'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createJob } from '@/lib/actions/jobs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  'Development', 'Design', 'Writing', 'Marketing',
  'AI / ML', 'Video & Audio', 'Finance', 'Legal', 'Other',
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'];
const LOCATIONS  = ['Remote', 'Hybrid', 'On-site'];
const BUDGETS    = ['Fixed', 'Hourly', 'Monthly'];

const budgetLabels = { Fixed: 'Fixed Price ($)', Hourly: 'Hourly Rate ($/hr)', Monthly: 'Monthly Rate ($/mo)' };

// ── Pill toggle button ─────────────────────────────────────────
function Pill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
        selected
          ? 'bg-brand-600/25 text-brand-300 border-brand-500/50 shadow-sm shadow-brand-600/20'
          : 'border-surface-border text-slate-400 hover:text-white hover:border-slate-500 hover:bg-surface-tertiary'
      }`}
    >
      {label}
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-white font-semibold text-base">{title}</h2>
        {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────
export default function JobPostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    'Development',
    type:        'Contract',
    location:    'Remote',
    budget_type: 'Fixed',
    budget_min:  '',
    budget_max:  '',
    tags:        '',
  });

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setPill = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const descLen  = form.description.length;
  const descLeft = 5000 - descLen;

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.set(k, v));

    startTransition(async () => {
      const result = await createJob(data);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      // Brief delay so user sees the success state, then redirect
      setTimeout(() => router.push('/jobs'), 1800);
    });
  };

  // ── Success screen ───────────────────────────────────────
  if (success) {
    return (
      <div className="glass rounded-2xl p-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto mb-6 animate-bounce">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Job posted successfully!</h2>
        <p className="text-slate-400 mb-2">
          Your job is now live and visible to all freelancers.
        </p>
        <p className="text-slate-500 text-sm">Redirecting to Jobs page…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="job-post-form" className="space-y-6">
      {/* Error banner */}
      {error && (
        <div
          id="job-form-error"
          role="alert"
          className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
        >
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Section 1: Basic Info ── */}
      <Section title="Job Details" description="Describe the role clearly to attract the right talent.">
        <div className="space-y-5">
          <Input
            id="job-title"
            name="title"
            label="Job Title"
            placeholder="e.g. Senior React Developer, Logo Designer, SEO Specialist"
            value={form.title}
            onChange={set('title')}
            required
            hint={`${form.title.length}/120 characters`}
            maxLength={120}
          />

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="job-description"
              name="description"
              rows={8}
              placeholder="Describe the job responsibilities, required skills, deliverables, and any relevant context. The more detail, the better proposals you'll receive."
              value={form.description}
              onChange={set('description')}
              required
              maxLength={5000}
              className={`input-field resize-none leading-relaxed ${
                descLen > 0 && descLen < 50 ? 'border-orange-500/50' : ''
              }`}
            />
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs ${descLen < 50 && descLen > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                {descLen < 50 && descLen > 0 ? `${50 - descLen} more characters needed` : 'Min. 50 characters'}
              </span>
              <span className={`text-xs ${descLeft < 200 ? 'text-orange-400' : 'text-slate-600'}`}>
                {descLeft.toLocaleString()} remaining
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="job-category" className="block text-sm font-medium text-slate-300 mb-1.5">
              Category
            </label>
            <select
              id="job-category"
              name="category"
              value={form.category}
              onChange={set('category')}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Type & Location ── */}
      <Section title="Employment Details" description="How and where will this work be done?">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Job Type</p>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => (
                <Pill key={t} label={t} selected={form.type === t} onClick={() => setPill('type', t)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Location</p>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((l) => (
                <Pill key={l} label={l} selected={form.location === l} onClick={() => setPill('location', l)} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Budget ── */}
      <Section title="Budget" description="Set a budget range to attract the right level of talent.">
        <div className="space-y-5">
          {/* Budget type selector */}
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <Pill key={b} label={b} selected={form.budget_type === b} onClick={() => setPill('budget_type', b)} />
            ))}
          </div>

          {/* Budget range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="budget-min"
              name="budget_min"
              type="number"
              label={`Min ${budgetLabels[form.budget_type]}`}
              placeholder="e.g. 500"
              value={form.budget_min}
              onChange={set('budget_min')}
              min="0"
            />
            <Input
              id="budget-max"
              name="budget_max"
              type="number"
              label={`Max ${budgetLabels[form.budget_type]}`}
              placeholder="e.g. 2000"
              value={form.budget_max}
              onChange={set('budget_max')}
              min="0"
            />
          </div>

          {/* Budget preview */}
          {(form.budget_min || form.budget_max) && (
            <div className="glass rounded-xl px-4 py-3 border border-brand-500/20 text-brand-300 text-sm">
              💰 Budget preview:{' '}
              <span className="font-semibold">
                {form.budget_min && form.budget_max
                  ? `$${Number(form.budget_min).toLocaleString()} – $${Number(form.budget_max).toLocaleString()}`
                  : form.budget_min
                  ? `From $${Number(form.budget_min).toLocaleString()}`
                  : `Up to $${Number(form.budget_max).toLocaleString()}`}
                {form.budget_type === 'Hourly' ? '/hr' : form.budget_type === 'Monthly' ? '/mo' : ' fixed'}
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 4: Tags ── */}
      <Section title="Skills & Tags" description="Optional — add up to 8 skills to help freelancers find your job.">
        <Input
          id="job-tags"
          name="tags"
          label="Skills (comma-separated)"
          placeholder="e.g. React, TypeScript, Node.js, REST APIs"
          value={form.tags}
          onChange={set('tags')}
          hint="Separate skills with commas. Max 8 tags."
        />
        {/* Tag preview */}
        {form.tags && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8).map((tag) => (
              <span key={tag} className="badge bg-surface-tertiary text-slate-300 border border-surface-border">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* ── Submit ── */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-slate-500 text-xs">
          Your job will be visible to all freelancers immediately after posting.
        </p>
        <Button
          id="post-job-submit-btn"
          type="submit"
          loading={isPending}
          className="!px-8"
        >
          {isPending ? 'Posting…' : 'Post Job →'}
        </Button>
      </div>
    </form>
  );
}
