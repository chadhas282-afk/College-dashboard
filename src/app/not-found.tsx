import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid" aria-hidden />

      <div className="relative text-center">
        <p className="neon-text-gradient font-display text-7xl font-bold tracking-tight">404</p>
        <h1 className="mt-4 font-display text-xl font-semibold text-white">Signal lost</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          This event may have been removed by an administrator, or the link is incorrect.
        </p>
        <Link href="/" className="btn-primary btn-md mt-7">
          Browse all events
        </Link>
      </div>
    </main>
  );
}