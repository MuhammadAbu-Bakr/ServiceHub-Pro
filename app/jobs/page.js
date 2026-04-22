import { createClient } from '@/lib/supabase/server';
import JobsClient from './JobsClient';

export const metadata = {
  title: 'Browse Jobs',
  description: 'Find your next freelance project on ServiceHub Pro.',
};

/**
 * Server Component — fetches all open jobs (joined with client profile)
 * and passes them to the interactive JobsClient for search/filtering.
 */
export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      description,
      category,
      type,
      location,
      budget_min,
      budget_max,
      budget_type,
      tags,
      status,
      created_at,
      profiles:client_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Jobs fetch error:', error.message);
  }

  return <JobsClient initialJobs={jobs ?? []} />;
}
