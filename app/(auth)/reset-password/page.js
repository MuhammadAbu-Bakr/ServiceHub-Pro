'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score  = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-surface-border'}`} />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map((c) => (
            <span key={c.label} className={`text-xs ${c.pass ? 'text-emerald-400' : 'text-slate-600'}`}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-medium ${colors[score].replace('bg-', 'text-')}`}>
            {labels[score]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check we actually have an active recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
      else setError('This reset link is invalid or has already been used.');
    });
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message || 'Failed to update password. The link may have expired.');
      return;
    }

    setSuccess(true);
    // Sign out all other sessions for security
    await supabase.auth.signOut({ scope: 'others' });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="glass rounded-2xl p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Password updated!</h2>
          <p className="text-slate-400 mb-8">
            Your password has been changed successfully. You can now sign in
            with your new password.
          </p>
          <Link href="/login" className="btn-primary inline-flex">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
          <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <span>{error}</span>
                {!hasSession && (
                  <div className="mt-2">
                    <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 underline text-xs">
                      Request a new reset link →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasSession && (
            <form onSubmit={handleSubmit} id="reset-password-form" className="space-y-5">
              <div>
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  label="New password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                />
                <PasswordStrength password={password} />
              </div>

              <Input
                id="confirm-password"
                name="confirm"
                type="password"
                label="Confirm new password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                error={confirm && password !== confirm ? 'Passwords do not match' : ''}
              />

              <Button
                id="update-password-btn"
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!hasSession}
              >
                Update Password
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
