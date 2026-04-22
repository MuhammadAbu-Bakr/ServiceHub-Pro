import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatBudget, formatTimeAgo } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProposalForm from '@/components/jobs/ProposalForm';
import ProposalList from '@/components/jobs/ProposalList';
import Card, { CardBody } from '@/components/ui/Card';

/**
 * Job Details Page (Server Component)
 * Fetches full job details, checks application status for freelancers,
 * and fetches proposals for the client owner.
 */
export default async function JobDetailsPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch job with client details
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      profiles:client_id (
        full_name,
        avatar_url,
        role,
        bio,
        location,
        website
      )
    `)
    .eq('id', id)
    .single();

  if (error || !job) {
    notFound();
  }

  // 2. Check auth and application status
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  let alreadyApplied = false;
  let proposals = [];

  const isOwner = user?.id === job.client_id;

  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    profile = prof;

    if (profile?.role === 'freelancer') {
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('job_id', id)
        .eq('freelancer_id', user.id)
        .single();
      alreadyApplied = !!existingProposal;
    }

    if (isOwner) {
      // Fetch all proposals for this job
      const { data: fetchedProposals } = await supabase
        .from('proposals')
        .select(`
          *,
          profiles:freelancer_id (
            full_name,
            avatar_url
          )
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false });
      
      proposals = fetchedProposals || [];
    }
  }

  const budgetStr = formatBudget(job.budget_min, job.budget_max, job.budget_type);
  const postedAt  = formatTimeAgo(job.created_at);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/jobs" className="hover:text-brand-300 transition-colors">Jobs</Link>
            <span>/</span>
            <span className="text-slate-300 truncate">{job.title}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left: Job Details */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="badge bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    {job.category}
                  </span>
                  <span className="badge bg-slate-500/15 text-slate-300 border border-slate-500/30">
                    {job.type}
                  </span>
                  <span className="text-slate-500 text-xs">{postedAt}</span>
                </div>
                
                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 py-6 border-y border-surface-border mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Budget</p>
                      <p className="text-white font-medium">{budgetStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Location</p>
                      <p className="text-white font-medium">{job.location}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-4">Project Description</h3>
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                </div>

                {job.tags?.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-sm font-semibold text-white mb-4">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="badge bg-surface-tertiary text-slate-300 border border-surface-border text-xs px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Show proposals if owner */}
              {isOwner && (
                <ProposalList proposals={proposals} jobId={job.id} budgetType={job.budget_type} />
              )}
            </div>

            {/* Right: Sidebar (Action/Client Info) */}
            <div className="space-y-6">
              
              {/* Proposal Box / Owner Stats */}
              {!user ? (
                <Card>
                  <CardBody className="p-6 text-center">
                    <h3 className="text-white font-semibold mb-3">Ready to apply?</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Sign in to your freelancer account to submit a proposal for this project.
                    </p>
                    <Link href={`/login?redirectTo=/jobs/${job.id}`} className="btn-primary w-full">
                      Log In to Apply
                    </Link>
                  </CardBody>
                </Card>
              ) : isOwner ? (
                <Card>
                  <CardBody className="p-6 text-center border border-brand-500/20 bg-brand-500/5">
                    <div className="text-3xl mb-3">👔</div>
                    <h1 className="text-white font-semibold mb-1">Owner View</h1>
                    <p className="text-slate-400 text-sm">
                      You posted this job. You can review the {proposals.length} proposal{proposals.length === 1 ? '' : 's'} submitted below.
                    </p>
                    <div className="flex gap-2 justify-center mt-6">
                      <Link href="/dashboard" className="btn-secondary flex-1 text-xs px-2">
                        Dashboard
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ) : profile?.role === 'freelancer' ? (
                <ProposalForm 
                  jobId={job.id} 
                  alreadyApplied={alreadyApplied}
                  budgetType={job.budget_type}
                />
              ) : (
                <Card>
                  <CardBody className="p-6 text-center">
                    <div className="text-3xl mb-3">⚠️</div>
                    <p className="text-slate-400 text-sm">
                      You are logged in as a Client. Switch to a Freelancer account to apply.
                    </p>
                    <Link href="/dashboard" className="btn-secondary w-full mt-6">
                      Go to Dashboard
                    </Link>
                  </CardBody>
                </Card>
              )}

              {/* Client Info Card */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="text-white font-semibold mb-6">About the Client</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 border border-brand-500/20 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-brand-600/10">
                      {(job.profiles?.full_name || 'C')[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{job.profiles?.full_name || 'Anonymous Client'}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <span className="text-emerald-500">●</span> Verified Client
                      </p>
                    </div>
                  </div>
                  
                  {job.profiles?.bio && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                      &quot;{job.profiles.bio}&quot;
                    </p>
                  )}

                  <div className="space-y-3">
                    {job.profiles?.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-lg">📍</span> {job.profiles.location}
                      </div>
                    )}
                    {job.profiles?.website && (
                      <a href={job.profiles.website} target="_blank" className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                        <span className="text-lg">🌐</span> Website
                      </a>
                    )}
                  </div>
                </CardBody>
              </Card>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
