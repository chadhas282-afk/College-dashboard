import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void-950/70 backdrop-blur-xl">
      
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-xl
                       bg-gradient-to-br from-cyan-400/25 to-fuchsia-500/25 text-base
                       ring-1 ring-cyan-400/40 backdrop-blur transition duration-300
                       group-hover:shadow-neon"
            aria-hidden
          >
            🎓
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold tracking-tight text-white">
              College Event Hub
            </span>
            <span className="overline block text-[9px]">campus network</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link href="/" className="btn-ghost btn-sm">
            Events
          </Link>
          <Link href="/admin" className="btn-secondary btn-sm">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}