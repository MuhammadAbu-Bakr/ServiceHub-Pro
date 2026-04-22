import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { formatBudget, formatTimeAgo } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard',
  description: 'Manage your jobs, applications, and account.',
};

const roleConfig = {
  client:     { label: 'Client',     color: 'bg-brand-500/15 text-brand-300 border-brand-500/30',   icon: '👔' },
  freelancer: { label: 'Freelancer', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: '💼' },
};

const quickActions = {
  client: [
    { icon: '➕', label: 'Post a new job',     href: '/dashboard/post-job' },
    { icon: '🔍', label: 'Browse experts',     href: '/jobs' },
    { icon: '⚙️', label: 'Account Settings',   href: '/dashboard/profile' },
  ],
  freelancer: [
    { icon: '🔍', label: 'Find work',          href: '/jobs' },
    { icon: '⚙️', label: 'Settings',            href: '/dashboard/profile' },
    { icon: '👤', label: 'View Profile',       href: '/dashboard/profile' },
  ],
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch Profile & Real Stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'client';
  const firstName = (profile?.full_name || user.email || '').split(' ')[0] || 'there';
  const actions = quickActions[role] ?? quickActions.client;
  const rc = roleConfig[role];

  // 3. Fetch Dynamic Content based on role
  let stats = [];
  let activities = [];

  if (role === 'client') {
    // Client view: Their jobs and applications received
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id);

    const { data: recentBids } = await supabase
      .from('proposals')
      .select(`
        id, created_at, cover_letter, bid_amount,
        jobs:job_id(title),
        profiles:freelancer_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    stats = [
      { label: 'Active Jobs', value: jobCount || 0, icon: '💼', change: 'Live listings', positive: true },
      { label: 'Proposals',  value: recentBids?.length || 0, icon: '📥', change: 'New applications', positive: true },
      { label: 'Active Projects', value: '0', icon: '⚡', change: 'In progress', positive: true },
      { label: 'Spent',      value: '$0', icon: '💰', change: 'Total spent', positive: true },
    ];

    activities = (recentBids || []).map(bid => ({
      id: bid.id,
      action: 'New proposal',
      detail: `${bid.profiles?.full_name} applied to "${bid.jobs?.title}"`,
      time: formatTimeAgo(bid.created_at),
      avatar: (bid.profiles?.full_name || 'F')[0]
    }));

  } else {
    // Freelancer view: Their applications
    const { count: proposalCount } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', user.id);

    const { data: myBids } = await supabase
      .from('proposals')
      .select(`
        id, created_at, status, bid_amount,
        jobs:job_id(title, client_id, profiles:client_id(full_name))
      `)
      .eq('freelancer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    stats = [
      { label: 'Applications', value: proposalCount || 0, icon: '📨', change: 'Sent proposals', positive: true },
      { label: 'Invitations',  value: '0', icon: '🔔', change: 'New requests', positive: true },
      { label: 'Active Jobs',  value: '0', icon: '💼', change: 'Working on', positive: true },
      { label: 'Earnings',     value: '$0', icon: '💰', change: 'Total earned', positive: true },
    ];

    activities = (myBids || []).map(bid => ({
      id: bid.id,
      action: bid.status === 'pending' ? 'Application sent' : `Application ${bid.status}`,
      detail: `You applied to "${bid.jobs?.title}" by ${bid.jobs?.profiles?.full_name}`,
      time: formatTimeAgo(bid.created_at),
      avatar: (bid.jobs?.profiles?.full_name || 'C')[0]
    }));
  }

  // Profile completeness calculation
  const profileFields = ['full_name', 'bio', 'location', 'website', 'avatar_url'];
  const filledFields  = profileFields.filter((f) => profile?.[f]);
  const completeness  = Math.round((filledFields.length / profileFields.length) * 100);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-3xl font-bold text-white leading-tight">
                Hey, <span className="gradient-text">{firstName} 👋</span>
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Here&apos;s what&apos;s happening with your {role} account.
              </p>
            </div>
            <span id="role-badge" className={`badge border text-sm px-3 py-1.5 self-start sm:self-auto ${rc.color}`}>
              {rc.icon} {rc.label}
            </span>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 hover:border-brand-500/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className={`text-xs font-medium uppercase tracking-wider ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    {activities.length > 0 && (
                      <button className="text-xs text-brand-400 hover:text-brand-300 transition-colors underline">View all</button>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  {activities.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-slate-500 text-sm italic">No recent activity to show.</p>
                      <Link href={role === 'client' ? '/dashboard/post-job' : '/jobs'} className="text-brand-400 text-xs mt-2 inline-block hover:underline">
                        {role === 'client' ? 'Post your first job' : 'Search for jobs'} →
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {activities.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-tertiary transition-colors border border-transparent hover:border-surface-border"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-brand-300 shadow-inner">
                            {item.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{item.action}</p>
                            <p className="text-slate-400 text-xs mt-0.5 truncate">{item.detail}</p>
                          </div>
                          <span className="text-slate-600 text-[10px] uppercase font-bold flex-shrink-0 mt-1">{item.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
              
              {/* Profile Completeness CTA */}
              {completeness < 100 && (
                <div className="glass rounded-2xl p-6 border border-brand-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-500/10 transition-colors" />
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold mb-1">Boost your visibility</h4>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                        Complete profiles are 4x more likely to be found. Fill out your bio and add an avatar to stand out.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-2xl font-bold gradient-text">{completeness}%</span>
                       <div className="w-24 bg-surface-secondary rounded-full h-1.5">
                         <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${completeness}%` }} />
                       </div>
                    </div>
                    <Link href="/dashboard/profile" className="btn-primary !px-6 !py-2 !text-xs whitespace-nowrap shadow-lg shadow-brand-600/20">
                      Finish Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick actions */}
              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardBody className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {actions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border border-surface-border hover:border-brand-500/40 bg-surface-secondary/30 hover:bg-surface-tertiary transition-all duration-200 group text-center"
                      >
                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-white leading-tight">{action.label}</span>
                      </Link>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Account Overview Sidebar */}
              <Card>
                <CardHeader><CardTitle>Account Overview</CardTitle></CardHeader>
                <CardBody>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-lg shadow-brand-600/10">
                        {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {profile?.full_name || 'ServiceHub User'}
                        </p>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-surface-border">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-500 text-xs">Trust Score</span>
                          <span className="text-white text-xs font-bold">100%</span>
                       </div>
                       <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                         <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                       </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Member since</span>
                        <span className="text-slate-300 font-medium">{new Date(profile?.created_at).getFullYear()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Status</span>
                        <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Active</span>
                      </div>
                    </div>

                    <Link href="/dashboard/profile" className="btn-secondary w-full text-center text-[11px] font-bold uppercase tracking-wider py-2.5">
                      View Public Profile
                    </Link>
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
