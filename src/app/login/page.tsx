import { Suspense } from 'react';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin sign in',
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-bright bg-grid opacity-50"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <span
            className="ring-conic mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl
                       bg-gradient-to-br from-cyan-400/25 to-fuchsia-500/25 text-3xl backdrop-blur"
            aria-hidden
          >
            <span className="bg-void-950 px-1">🎓</span>
          </span>
          <h1 className="font-display text-2xl font-bold text-white">
            <span className="neon-text-gradient">Admin access</span>
          </h1>
          <p className="overline mt-2">event operations console</p>
        </div>

        <div className="glass-card neon-ring p-8">
          <Suspense
            fallback={<div className="h-72 animate-pulse rounded-xl bg-white/[0.05]" aria-hidden />}
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}