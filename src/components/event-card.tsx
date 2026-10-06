import Link from 'next/link';
import { CATEGORY_ACCENTS, CATEGORY_STYLES, type EventWithSeats } from '@/types/database';

const CATEGORY_STYLE: Record<string, { chip: string; accent: string; icon: string; glow: string; ring: string }> = {
  Workshop: { chip: CATEGORY_STYLES.Workshop, ...CATEGORY_ACCENTS.Workshop },
  Seminar: { chip: CATEGORY_STYLES.Seminar, ...CATEGORY_ACCENTS.Seminar },
  Hackathon: { chip: CATEGORY_STYLES.Hackathon, ...CATEGORY_ACCENTS.Hackathon },
};

function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric' });
}

function monthOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EventCard({ event }: { event: EventWithSeats }) {
  const style = CATEGORY_STYLE[event.category] ?? CATEGORY_STYLE.Workshop;
  const fillPercent = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));
  const isFull = event.seats_left <= 0;
  const isUrgent = !isFull && event.seats_left <= Math.max(3, Math.ceil(event.capacity * 0.1));

  const barColor = isFull
    ? 'from-rose-500 to-rose-400'
    : isUrgent
      ? 'from-amber-400 to-amber-300'
      : 'from-cyan-400 to-fuchsia-400';

  return (
    <article
      className={`group glass-card relative flex flex-col overflow-hidden
                  transition duration-300 hover:-translate-y-1.5 hover:border-white/20
                  ${style.ring}`}
    >
      {/* Neon banner — doubles as the category signal */}
      <Link
        href={`/events/${event.id}`}
        className={`relative flex h-32 items-center justify-center overflow-hidden ${style.glow}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${style.accent} opacity-80`} aria-hidden />
        <div className="absolute inset-0 bg-void-950/45" aria-hidden />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />
        {/* Orbiting ring */}
        <div
          className="absolute h-24 w-24 rounded-full border border-white/25 animate-spin-slow"
          aria-hidden
        />
        <span className="relative text-4xl drop-shadow-[0_0_14px_rgba(255,255,255,0.75)]" aria-hidden>
          {style.icon}
        </span>

        <span className={`chip absolute left-3 top-3 backdrop-blur ${style.chip}`}>
          {event.category}
        </span>

        {isFull && (
          <span className="chip absolute right-3 top-3 border border-rose-400/40 bg-rose-500/20 text-rose-100 backdrop-blur">
            Full
          </span>
        )}
        {isUrgent && (
          <span className="chip absolute right-3 top-3 border border-amber-300/50 bg-amber-400/20 text-amber-100 backdrop-blur">
            Almost full
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div
            className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-cyan-400/25
                       bg-cyan-400/10 py-1.5 backdrop-blur"
          >
            <span className="font-mono text-[10px] font-semibold leading-none tracking-wider text-cyan-300">
              {monthOf(event.event_date)}
            </span>
            <span className="font-display text-lg font-bold leading-tight text-white">
              {dayOf(event.event_date)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <Link href={`/events/${event.id}`}>
              <h3 className="font-display font-semibold leading-snug text-white transition group-hover:text-cyan-300">
                {event.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-xs text-slate-400">
              <span className="font-mono text-cyan-400/80">{timeOf(event.event_date)}</span>
              {' · '}
              {event.location ?? 'Location TBA'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span
              className={
                isFull ? 'text-rose-300' : isUrgent ? 'text-amber-300' : 'text-slate-400'
              }
            >
              {isFull ? 'No seats left' : `${event.seats_left} of ${event.capacity} seats left`}
            </span>
            <span className="font-mono tabular-nums text-slate-500">{fillPercent}% full</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 pt-1">
          <Link href={`/events/${event.id}`} className="btn-primary btn-md w-full">
            {isFull ? 'View details' : 'View & register'}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="h-32 animate-pulse bg-white/[0.05]" />
      <div className="space-y-3 p-5">
        <div className="flex gap-3">
          <div className="h-11 w-12 shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
        <div className="h-1.5 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.05]" />
      </div>
    </div>
  );
}

export { CATEGORY_STYLE, CATEGORY_ACCENTS };