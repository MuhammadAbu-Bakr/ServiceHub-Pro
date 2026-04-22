'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// ── Step 1: Request reset email ──────────────────────────────
function RequestResetForm() {
  const supabase = createClient();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }
    );
    setLoading(false);

    if (error) {
      // Don't reveal whether the email exists — show generic message
      console.warn('Reset password error:', error.message);
    }
    // Always show the success state to prevent email enumeration
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Check your inbox</h2>
        <p className="text-slate-400 text-sm mb-2">
          If <span className="text-brand-300 font-medium">{email}</span> is registered,
          you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-slate-500 text-xs mb-8">
          It may take a minute. Check your spam folder too.
        </p>
        <Link href="/login" className="btn-secondary inline-flex text-sm">
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-2xl mx-auto mb-4">
          🔑
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Forgot your password?</h1>
        <p className="text-slate-400 text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} id="forgot-password-form" className="space-y-5">
        <Input
          id="reset-email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          autoComplete="email"
        />

        <Button id="send-reset-btn" type="submit" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Back to Login
        </Link>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <RequestResetForm />
        </div>
      </div>
    </div>
  );
}
