import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { EventWithSeats } from '@/types/database';
import EventCard from '@/components/event-card';
import SiteHeader from '@/components/site-header';
import EventFilters from './event-filters';
import ChatAssistant from '@/components/chat/chat-assistant';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Upcoming events',
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const category = searchParams.category ?? '';

  const supabase = createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });

  const events: EventWithSeats[] = (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    event_date: e.event_date,
    location: e.location,
    capacity: e.capacity,
    created_at: e.created_at,
    registered_count: e.registrations?.[0]?.count ?? 0,
    seats_left: e.capacity - (e.registrations?.[0]?.count ?? 0),
  }));

  const filtered = events.filter((e) => {
    if (category && e.category !== category) return false;
    if (q) {
      const hay = `${e.title} ${e.description ?? ''} ${e.location ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const openSeats = filtered.reduce((sum, e) => sum + Math.max(0, e.seats_left), 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <header className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-void-900 to-cyan-950/40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-grid-bright bg-grid opacity-40" aria-hidden />

        <div
          className="absolute -bottom-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-[100%] bg-gradient-to-t from-fuchsia-500/25 via-indigo-500/15 to-transparent blur-2xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-[100%] border-t-2 border-cyan-300/40"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <span className="chip border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
          </span>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            <span className="neon-text-gradient animate-shimmer">What&apos;s happening</span>
            <br />
            <span className="text-white">on campus</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Workshops, seminars, and hackathons. Browse and register in one click, get a calendar
            invite automatically — or just ask the assistant.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#events" className="btn-primary btn-md px-6 py-3 text-base">
              Browse events
            </a>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
              {openSeats > 0
                ? `${openSeats} seat${openSeats === 1 ? '' : 's'} open`
                : 'All events full'}
            </p>
          </div>
        </div>
      </header>

      <main id="events" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6">
        <div className="-mt-7">
          <EventFilters initialQuery={q} initialCategory={category} />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          >
            <span aria-hidden>⚠️</span>
            <div>
              <p className="font-semibold">Could not load events</p>
              <p className="mt-0.5 text-rose-200/80">{error.message}</p>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-sm font-semibold text-white">
            <span className="font-mono text-cyan-400">{String(filtered.length).padStart(2, '0')}</span>{' '}
            {filtered.length === 1 ? 'event' : 'events'}
            {category && <span className="text-slate-400"> in {category}</span>}
          </h2>
          {(q || category) && (
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-cyan-300 transition hover:text-cyan-200"
            >
              Reset view
            </Link>
          )}
        </div>

        {filtered.length === 0 && !error ? (
          <div className="glass-card neon-ring mt-4 px-6 py-20 text-center">
            <p className="text-5xl" aria-hidden>
              🛰️
            </p>
            <p className="mt-5 font-display font-semibold text-white">No events on this frequency</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              Nothing matches those filters. Try a different keyword or category — or ask the
              assistant at the bottom-right.
            </p>
            <Link href="/" className="btn-secondary btn-md mt-6">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <ChatAssistant />
    </div>
  );
}