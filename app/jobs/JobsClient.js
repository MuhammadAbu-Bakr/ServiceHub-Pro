'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatBudget, formatTimeAgo } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Development', 'Design', 'Writing', 'Marketing', 'AI / ML', 'Video & Audio', 'Finance', 'Legal', 'Other'];
const TYPES      = ['All', 'Full-time', 'Part-time', 'Contract', 'Freelance'];
const LOCATIONS  = ['All', 'Remote', 'Hybrid', 'On-site'];

const typeColors = {
  'Full-time': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Part-time': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Contract:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Freelance:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const locationIcons = { Remote: '🌍', Hybrid: '🏢', 'On-site': '📍' };

const catIcons = {
  Development: '💻', Design: '🎨', Writing: '✍️', Marketing: '📈',
  'AI / ML': '🤖', 'Video & Audio': '🎬', Finance: '💰', Legal: '⚖️', Other: '📋',
};

// ── Single job card ───────────────────────────────────────────
function JobCard({ job }) {
  const clientName = job.profiles?.full_name || 'Anonymous Client';
  const budget     = formatBudget(job.budget_min, job.budget_max, job.budget_type);
  const postedAt   = formatTimeAgo(job.created_at);

  return (
    <div
      id={`job-card-${job.id}`}
      className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-surface-border to-transparent hover:from-brand-500/50 hover:to-purple-500/50 transition-all duration-500"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/5 rounded-3xl transition-colors duration-500 blur-xl" />
      
      {/* Inner Card */}
      <div className="relative h-full bg-surface-secondary/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
        
        {/* Left Side: Icon & Titles */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-tertiary to-surface-border flex items-center justify-center text-2xl flex-shrink-0 shadow-lg border border-white/5 ring-1 ring-black/20 group-hover:ring-brand-500/30 transition-all duration-300">
              {catIcons[job.category] || '📋'}
            </div>
            <div>
              <Link href={`/jobs/${job.id}`} className="hover:underline">
                <h2 className="text-xl sm:text-2xl text-white font-bold group-hover:text-brand-300 transition-colors leading-snug tracking-tight mb-1">
                  {job.title}
                </h2>
              </Link>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className="font-medium text-slate-300">{clientName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{locationIcons[job.location]} {job.location}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{postedAt}</span>
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 md:pr-12 mb-5">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {job.tags?.slice(0, 6).map((tag) => (
              <span key={tag} className="badge tracking-wide bg-surface-border/50 text-slate-300 border border-white/5 px-3 py-1 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Price & Actions */}
        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:w-48 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-surface-border pt-4 sm:pt-0 sm:pl-6">
          <div className="sm:text-right">
            <span className={`badge border px-3 py-1 mb-3 ${typeColors[job.type] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'}`}>
              {job.type}
            </span>
            <div className="text-2xl font-bold text-white tracking-tight">{budget}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">
               Est. Budget
            </div>
          </div>
          
          <Link 
            href={`/jobs/${job.id}`} 
            className="btn-primary w-full sm:w-auto mt-auto !px-8 !py-3 !text-sm group-hover:scale-105 group-hover:shadow-brand-500/30"
          >
            Apply Now →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ hasFilters }) {
  return (
    <div className="glass rounded-2xl p-16 text-center">
      <div className="text-5xl mb-4">{hasFilters ? '🔍' : '📭'}</div>
      <h3 className="text-white font-semibold mb-2">
        {hasFilters ? 'No jobs match your filters' : 'No jobs posted yet'}
      </h3>
      <p className="text-slate-400 text-sm mb-6">
        {hasFilters
          ? 'Try clearing your filters or searching with different keywords.'
          : 'Be the first to post a job and find great talent.'}
      </p>
      {!hasFilters && (
        <Link href="/dashboard/post-job" className="btn-primary inline-flex">
          Post the First Job →
        </Link>
      )}
    </div>
  );
}

// ── Filter pill ───────────────────────────────────────────────
function FilterPill({ label, active, onClick, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
        active
          ? 'bg-brand-600/30 text-brand-300 border-brand-500/50'
          : 'border-surface-border text-slate-400 hover:text-white hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  );
}

// ── Main Client Component ─────────────────────────────────────
export default function JobsClient({ initialJobs = [] }) {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [type,     setType]     = useState('All');
  const [location, setLocation] = useState('All');

  const hasFilters = search || category !== 'All' || type !== 'All' || location !== 'All';

  const clearFilters = () => {
    setSearch(''); setCategory('All'); setType('All'); setLocation('All');
  };

  const filtered = useMemo(() => {
    return initialJobs.filter((job) => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || job.title.toLowerCase().includes(q)
        || (job.profiles?.full_name || '').toLowerCase().includes(q)
        || (job.tags || []).some((t) => t.toLowerCase().includes(q))
        || job.description.toLowerCase().includes(q);
      const matchCat      = category === 'All' || job.category === category;
      const matchType     = type === 'All'     || job.type === type;
      const matchLocation = location === 'All' || job.location === location;
      return matchSearch && matchCat && matchType && matchLocation;
    });
  }, [initialJobs, search, category, type, location]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Browse <span className="gradient-text">Jobs</span>
              </h1>
              <p className="text-slate-400 text-sm">
                {initialJobs.length} {initialJobs.length === 1 ? 'opportunity' : 'opportunities'} available
              </p>
            </div>
            <Link href="/dashboard/post-job" className="btn-primary whitespace-nowrap self-start sm:self-auto">
              + Post a Job
            </Link>
          </div>

          {/* Search + Filters */}
          <div className="glass rounded-2xl p-5 mb-8">
            {/* Search row */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="job-search"
                  type="text"
                  placeholder="Search by title, skill, company…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category */}
            <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <FilterPill
                  key={c} label={c} active={category === c}
                  onClick={() => setCategory(c)}
                  id={`cat-${c.toLowerCase().replace(/[\s/&]+/g, '-')}`}
                />
              ))}
            </div>

            {/* Type + Location */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <FilterPill
                      key={t} label={t} active={type === t}
                      onClick={() => setType(t)}
                      id={`type-${t.toLowerCase().replace(/\s/g, '-')}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-2">Location</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((l) => (
                    <FilterPill
                      key={l} label={l} active={location === l}
                      onClick={() => setLocation(l)}
                      id={`loc-${l.toLowerCase().replace(/\//g, '-')}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-slate-500 text-sm mb-5">
            Showing{' '}
            <span className="text-white font-semibold">{filtered.length}</span>{' '}
            of <span className="text-white font-semibold">{initialJobs.length}</span> jobs
            {hasFilters && (
              <button onClick={clearFilters} className="ml-2 text-brand-400 hover:text-brand-300 text-xs underline">
                clear filters
              </button>
            )}
          </p>

          {/* Job cards */}
          {filtered.length === 0 ? (
            <EmptyState hasFilters={!!hasFilters} />
          ) : (
            <div className="grid gap-4">
              {filtered.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
