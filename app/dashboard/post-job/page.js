import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import JobPostForm from '@/components/jobs/JobPostForm';

export const metadata = {
  title: 'Post a Job',
  description: 'Post a job and connect with top freelancers on ServiceHub Pro.',
};

export default async function PostJobPage() {
  const supabase = await createClient();

  // Auth guard (middleware already handles guests, this catches wrong roles)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/dashboard/post-job');

  // Role guard — only clients may access this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client') {
    // Freelancers see a friendly explanation instead of a blank error
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="glass rounded-2xl p-12 text-center border border-orange-500/20">
          <div className="text-5xl mb-5">💼</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Freelancer accounts can&apos;t post jobs
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            You&apos;re signed in as a <strong className="text-orange-300">Freelancer</strong>.
            Only Client accounts can post job listings.
            Browse open jobs and submit proposals instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/jobs" className="btn-primary">
              Browse Jobs
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/dashboard" className="hover:text-brand-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-300">Post a Job</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Post a <span className="gradient-text">New Job</span>
        </h1>
        <p className="text-slate-400">
          Fill in the details below. Your listing goes live immediately.
        </p>
      </div>

      {/* Tips banner */}
      <div className="glass rounded-2xl p-4 mb-6 border border-brand-500/15 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Tips for a great listing:</strong> Use a specific title,
          write a detailed description (200+ words), set a realistic budget,
          and add relevant skill tags to attract the right candidates.
        </div>
      </div>

      <JobPostForm />
    </div>
  );
}
