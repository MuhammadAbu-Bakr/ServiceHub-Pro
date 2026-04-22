import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const features = [
  {
    icon: '⚡',
    title: 'Instant Matching',
    description:
      'Our smart algorithm matches you with the right talent in seconds — no lengthy sourcing needed.',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    description:
      'Funds are held in escrow and released only when you approve the delivered work.',
  },
  {
    icon: '⭐',
    title: 'Vetted Talent',
    description:
      'Every freelancer is reviewed and rated by real clients so you always hire with confidence.',
  },
  {
    icon: '📊',
    title: 'Real-time Dashboard',
    description:
      'Track active projects, payments, and messages from a powerful unified dashboard.',
  },
  {
    icon: '🌍',
    title: 'Global Network',
    description:
      'Access a diverse pool of 50,000+ professionals across 120 countries and every timezone.',
  },
  {
    icon: '💬',
    title: 'Built-in Messaging',
    description:
      'Communicate directly with freelancers without leaving the platform — all in one place.',
  },
];

const stats = [
  { value: '50K+', label: 'Freelancers' },
  { value: '12K+', label: 'Companies' },
  { value: '98%', label: 'Satisfaction' },
  { value: '$4M+', label: 'Paid Out' },
];

const categories = [
  { icon: '💻', title: 'Development', count: '4,210 jobs' },
  { icon: '🎨', title: 'Design', count: '2,850 jobs' },
  { icon: '✍️', title: 'Writing', count: '1,940 jobs' },
  { icon: '📈', title: 'Marketing', count: '1,620 jobs' },
  { icon: '🎬', title: 'Video & Audio', count: '980 jobs' },
  { icon: '🤖', title: 'AI / ML', count: '760 jobs' },
];

export const metadata = {
  title: 'ServiceHub Pro — Find & Hire Top Freelancers',
  description:
    'Connect with top-rated freelancers. Post jobs, find talent, and grow your business.',
};

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-glow pt-16">
          {/* Decorative blobs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-xs font-medium text-brand-300 mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
              Now with AI-powered job matching
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 animate-slide-up">
              Hire the best.
              <br />
              <span className="gradient-text">Fast & reliably.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-slide-up animate-delay-100">
              ServiceHub Pro connects growing businesses with world-class
              freelancers. From code to design — get it done.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animate-delay-200">
              <Link href="/jobs" className="btn-primary text-base px-8 py-4">
                Browse Jobs
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/register" className="btn-secondary text-base px-8 py-4">
                Post a Job — It&apos;s Free
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fade-in animate-delay-300">
              {stats.map((s) => (
                <div key={s.label} className="glass rounded-2xl px-6 py-5">
                  <div className="text-3xl font-extrabold gradient-text">{s.value}</div>
                  <div className="text-slate-500 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="py-24 bg-surface-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Explore by <span className="gradient-text">Category</span>
              </h2>
              <p className="text-slate-400">Find the right skill set for your project.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.title}
                  href="/jobs"
                  className="glass rounded-2xl p-5 text-center group hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <div className="text-white font-semibold text-sm mb-1">{cat.title}</div>
                  <div className="text-slate-500 text-xs">{cat.count}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Everything you need to{' '}
                <span className="gradient-text">ship faster</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                A full-featured platform built for modern teams who move fast and
                need reliable results.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="glass rounded-2xl p-6 hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 bg-surface-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass rounded-3xl p-12 border border-brand-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to get started?
                </h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Join thousands of businesses already building with ServiceHub Pro.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="btn-primary text-base px-8 py-4">
                    Create Free Account
                  </Link>
                  <Link href="/jobs" className="btn-secondary text-base px-8 py-4">
                    Browse Jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
