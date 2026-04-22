'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const navLinks = [
  { href: '/',          label: 'Home' },
  { href: '/jobs',      label: 'Jobs' },
  { href: '/dashboard', label: 'Dashboard', authOnly: true },
];

const roleConfig = {
  client:     { label: 'Client',     color: 'bg-brand-500/15 text-brand-300 border-brand-500/30' },
  freelancer: { label: 'Freelancer', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
};

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const visibleLinks = user
    ? navLinks
    : navLinks.filter((l) => !l.authOnly);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/80 backdrop-blur-xl border-b border-surface-border shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/40 group-hover:shadow-brand-600/60 transition-shadow">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Service<span className="gradient-text">Hub</span> Pro
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-tertiary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Role badge */}
                {profile?.role && (
                  <span className={`badge border text-xs ${roleConfig[profile.role]?.color}`}>
                    {profile.role === 'client' ? '👔' : '💼'} {roleConfig[profile.role]?.label}
                  </span>
                )}

                {/* Avatar dropdown trigger */}
                <div className="relative group">
                  <button
                    id="user-menu-btn"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-tertiary transition-colors"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 hidden lg:block max-w-[120px] truncate">
                      {profile?.full_name || user.email}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-52 glass rounded-xl border border-surface-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <div className="px-4 py-3 border-b border-surface-border">
                      <p className="text-white text-sm font-medium truncate">
                        {profile?.full_name || 'Your Account'}
                      </p>
                      <p className="text-slate-500 text-xs truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-tertiary transition-colors">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-tertiary transition-colors">
                        <span>👤</span> My Profile
                      </Link>
                      <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-tertiary transition-colors">
                        <span>⚙️</span> Settings
                      </Link>
                    </div>
                    <div className="border-t border-surface-border py-1">
                      <button
                        id="navbar-signout-btn"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login"    className="btn-secondary !px-4 !py-2 !text-xs">Log In</Link>
                <Link href="/register" className="btn-primary  !px-4 !py-2 !text-xs">Get Started</Link>
              </>
            )}
          </div>

          {/* ── Mobile Menu Button ── */}
          <button
            id="mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-tertiary transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-surface-border space-y-1 pt-3 animate-fade-in">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-brand-600/20 text-brand-300'
                    : 'text-slate-400 hover:text-white hover:bg-surface-tertiary'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <div className="px-4 py-3 flex items-center gap-3 border-t border-surface-border mt-2 pt-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'Account'}</p>
                    <p className="text-slate-500 text-xs truncate">{user.email}</p>
                  </div>
                  {profile?.role && (
                    <span className={`badge border text-xs ml-auto ${roleConfig[profile.role]?.color}`}>
                      {roleConfig[profile.role]?.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-3 border-t border-surface-border mt-2">
                <Link href="/login"    className="btn-secondary text-center">Log In</Link>
                <Link href="/register" className="btn-primary  text-center">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
