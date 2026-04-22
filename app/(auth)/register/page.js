'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// ── Friendly error messages ──────────────────────────────────
const AUTH_ERRORS = {
  'User already registered':
    'An account with this email already exists. Try logging in.',
  'Password should be at least 6 characters':
    'Password must be at least 8 characters.',
  'Unable to validate email address: invalid format':
    'Please enter a valid email address.',
  'signup_disabled': 'Sign-ups are currently disabled. Contact support.',
};

function mapError(message = '') {
  for (const [key, friendly] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(key)) return friendly;
  }
  return message || 'Something went wrong. Please try again.';
}

// ── Role selector card ────────────────────────────────────────
function RoleCard({ role, selected, onSelect }) {
  const isClient = role === 'client';
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 w-full text-left
        ${
          selected
            ? 'border-brand-500 bg-brand-600/15 shadow-lg shadow-brand-600/20'
            : 'border-surface-border bg-surface-tertiary hover:border-slate-500'
        }`}
    >
      {/* Check indicator */}
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}

      <span className="text-3xl">{isClient ? '👔' : '💼'}</span>

      <div>
        <p className={`font-semibold text-sm text-center ${selected ? 'text-white' : 'text-slate-300'}`}>
          {isClient ? 'Client' : 'Freelancer'}
        </p>
        <p className="text-slate-500 text-xs text-center mt-0.5">
          {isClient ? 'I want to hire talent' : 'I want to offer services'}
        </p>
      </div>
    </button>
  );
}

// ── Password strength indicator ──────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score] : 'bg-surface-border'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
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

// ── Main Register Page ────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1); // 1 = role, 2 = details
  const [form, setForm] = useState({
    role: 'client',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // email confirmation required

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Validate before submit ──────────────────────────────
  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim())    return 'Email address is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  // ── Insert profile manually (fallback / no-confirm flow) ──
  const insertProfile = async (userId) => {
    const { error } = await supabase.from('profiles').upsert(
      {
        id:        userId,
        email:     form.email.trim().toLowerCase(),
        full_name: form.fullName.trim(),
        role:      form.role,
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('Profile upsert warning:', error.message);
  };

  // ── Submit handler ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        // Pass role + name into user_metadata so the DB trigger picks them up
        data: {
          full_name: form.fullName.trim(),
          role:      form.role,
        },
        // Redirect to callback route after email confirmation
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(mapError(signUpError.message));
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (user) {
      // If session is available immediately (email confirmation disabled),
      // also do a manual upsert as a safety net.
      if (data?.session) {
        await insertProfile(user.id);
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Email confirmation is required — show success state
      setSuccess(true);
    }

    setLoading(false);
  };

  // ── Success screen ──────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="glass rounded-2xl p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
            ✉️
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your inbox!</h2>
          <p className="text-slate-400 mb-2">
            We sent a confirmation link to:
          </p>
          <p className="text-brand-300 font-medium mb-6 break-all">{form.email}</p>
          <p className="text-slate-500 text-sm mb-8">
            Click the link in the email to activate your account. Check your spam
            folder if you don&apos;t see it.
          </p>
          <Link href="/login" className="btn-primary inline-flex mx-auto">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
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
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm">
            {step === 1
              ? 'First, tell us how you plan to use ServiceHub Pro'
              : 'Fill in your details to get started for free'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-tertiary border border-surface-border text-slate-500'
                }`}
              >
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-slate-300' : 'text-slate-600'}`}>
                {s === 1 ? 'Choose role' : 'Your details'}
              </span>
              {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-brand-500/50' : 'bg-surface-border'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {error && (
            <div
              id="register-error-banner"
              className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
            >
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ─ Step 1: Role selection ─ */}
          {step === 1 && (
            <div>
              <p className="text-slate-300 text-sm font-medium mb-4">I am joining as a…</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <RoleCard
                  role="client"
                  selected={form.role === 'client'}
                  onSelect={(r) => setForm((f) => ({ ...f, role: r }))}
                />
                <RoleCard
                  role="freelancer"
                  selected={form.role === 'freelancer'}
                  onSelect={(r) => setForm((f) => ({ ...f, role: r }))}
                />
              </div>

              <div className={`glass rounded-xl px-4 py-3 text-xs mb-6 border ${
                form.role === 'client'
                  ? 'border-brand-500/20 text-brand-300'
                  : 'border-purple-500/20 text-purple-300'
              }`}>
                {form.role === 'client'
                  ? '👔 As a client you can post jobs, review applications, and manage projects.'
                  : '💼 As a freelancer you can browse jobs, submit proposals, and get paid.'}
              </div>

              <Button
                id="step1-next-btn"
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* ─ Step 2: Account details ─ */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
              {/* Selected role badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-xs">Joining as:</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`badge border text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                    form.role === 'client'
                      ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                      : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {form.role === 'client' ? '👔 Client' : '💼 Freelancer'} · Change
                </button>
              </div>

              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Full name"
                placeholder="Jane Doe"
                value={form.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                autoFocus
              />

              <Input
                id="reg-email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />

              <div>
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <PasswordStrength password={form.password} />
              </div>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                error={
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />

              <p className="text-slate-600 text-xs leading-relaxed">
                By creating an account you agree to our{' '}
                <Link href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</Link>.
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="w-1/3"
                >
                  ← Back
                </Button>
                <Button
                  id="register-submit-btn"
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
