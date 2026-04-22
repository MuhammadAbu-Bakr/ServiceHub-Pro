import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SubmissionForm } from '@/components/contracts/SubmissionForm';
import { SubmissionViewer } from '@/components/contracts/SubmissionViewer';
import Card, { CardBody } from '@/components/ui/Card';

export default async function ContractDetailsPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';
  const isClient = role === 'client';

  // Fetch contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      jobs:job_id (title, description),
      client:client_id (full_name),
      freelancer:freelancer_id (full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !contract || (contract.client_id !== user.id && contract.freelancer_id !== user.id)) {
    notFound();
  }

  // Fetch submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('contract_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/dashboard" className="hover:text-brand-300 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-300">Contract Settings</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-2">
            Contract: {contract.jobs?.title}
          </h1>
          <p className="text-slate-400 text-sm">
            {isClient ? `Freelancer: ${contract.freelancer?.full_name}` : `Client: ${contract.client?.full_name}`}
          </p>
        </div>
        <span className={`badge border px-3 py-1.5 ${
          contract.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : contract.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30'
          : 'bg-brand-500/15 text-brand-300 border-brand-500/30'
        }`}>
          {contract.status.toUpperCase()}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Submissions Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Work Submissions</h2>
          
          <SubmissionViewer 
            submissions={submissions || []} 
            isClient={isClient}
          />
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-6">
          <Card>
            <CardBody className="p-6">
              <h3 className="text-white font-semibold mb-4">Contract Details</h3>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex justify-between border-b border-surface-border pb-2">
                  <span>Agreed Price</span>
                  <span className="text-white font-medium">${contract.price}</span>
                </div>
                <div className="flex justify-between border-b border-surface-border pb-2">
                  <span>Start Date</span>
                  <span className="text-white font-medium">{new Date(contract.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>Job Description</span>
                </div>
                <p className="text-xs leading-relaxed bg-surface-tertiary p-3 rounded-lg text-slate-300">
                  {contract.jobs?.description}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Submission Action Box (Only Freelancer can submit, and only if contract is active) */}
          {!isClient && contract.status === 'active' && (
            <SubmissionForm contractId={contract.id} />
          )}

          {isClient && contract.status === 'active' && (
             <div className="glass p-6 rounded-2xl border border-brand-500/20 text-center">
                <h3 className="text-white font-semibold mb-2">Awaiting Deliverables</h3>
                <p className="text-slate-400 text-sm">Review incoming submissions here.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
