'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === 'Email not confirmed'
          ? 'This account has not been confirmed yet. Check with the event office.'
          : error.message === 'Invalid login credentials'
            ? 'That email and password combination did not match.'
            : error.message
      );
      setLoading(false);
      return;
    }

    router.push(searchParams.get('next') || '/admin');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="admin@admin.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200"
        >
          <span aria-hidden>⚠️</span>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
        {loading ? 'Authenticating…' : 'Sign in'}
      </button>

      <p className="text-center font-mono text-xs text-slate-500">
        restricted ·{' '}
        <Link href="/" className="text-cyan-300 transition hover:text-cyan-200">
          ← back to events
        </Link>
      </p>
    </form>
  );
}