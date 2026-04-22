'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// ── Map Supabase error messages to user-friendly text ────────
const ERROR_MAP = {
  'Invalid login credentials':
    'Incorrect email or password. Please try again.',
  'Email not confirmed':
    'Your email address has not been confirmed yet. Check your inbox.',
  'User not found':
    'No account found with this email. Try registering instead.',
  'Too many requests':
    'Too many login attempts. Please wait a moment and try again.',
  'User is banned':
    'This account has been suspended. Please contact support.',
  'signup_disabled':
    'Account sign-in is currently unavailable. Try again later.',
};

function mapError(message = '') {
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return friendly;
  }
  // Return any URL-encoded message from the callback
  if (message.startsWith('http')) return 'Authentication failed. Please try again.';
  return message || 'Something went wrong. Please try again.';
}

// ── Divider ───────────────────────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center gap-4 my-5">
      <div className="flex-1 h-px bg-surface-border" />
      <span className="text-slate-600 text-xs font-medium">or continue with</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────
function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Pull error / redirectTo from URL params (set by middleware or callback)
  const redirectTo  = searchParams.get('redirectTo') || '/dashboard';
  const urlError    = searchParams.get('error');

  useEffect(() => {
    if (urlError) setError(mapError(decodeURIComponent(urlError)));
  }, [urlError]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Email / Password login ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim())    { setError('Please enter your email.'); return; }
    if (!form.password)        { setError('Please enter your password.'); return; }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      setError(mapError(signInError.message));
      return;
    }

    // Verify we actually got a session back
    if (!data?.session) {
      setError('Login succeeded but no session was returned. Please try again.');
      return;
    }

    // Push to the intended destination (or dashboard)
    router.push(redirectTo);
    router.refresh(); // Re-run Server Components with the new session
  };

  // ── Google OAuth login ──────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) setError(mapError(error.message));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/40 group-hover:shadow-brand-600/60 transition-shadow">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">
            Sign in to your ServiceHub Pro account
          </p>
        </div>

        {/* Redirect hint */}
        {redirectTo !== '/dashboard' && !urlError && (
          <div className="glass rounded-xl px-4 py-3 mb-5 border border-brand-500/20 text-brand-300 text-xs text-center">
            🔒 Sign in to access that page
          </div>
        )}

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Error banner */}
          {error && (
            <div
              id="login-error-banner"
              role="alert"
              className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
            >
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       bg-surface-tertiary border border-surface-border text-slate-300 text-sm font-medium
                       hover:bg-surface-secondary hover:border-slate-500 hover:text-white
                       transition-all duration-200 mb-1"
          >
            {/* Google icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <Divider />

          {/* Email / password form */}
          <form onSubmit={handleSubmit} id="login-form" className="space-y-5" noValidate>
            <Input
              id="login-email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              autoFocus
            />

            {/* Password with show/hide toggle */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Create one free →
            </Link>
          </p>
        </div>

        {/* Security note */}
        <p className="text-center text-slate-600 text-xs mt-5">
          🔒 Secured by Supabase Auth · End-to-end encrypted sessions
        </p>
      </div>
    </div>
  );
}

// NextJS requirements for client-side search params boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center text-slate-500">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
