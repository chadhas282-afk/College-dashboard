import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_ACCENTS, CATEGORY_STYLES, type EventCategory } from '@/types/database';
import RegisterForm from './register-form';
import SiteHeader from '@/components/site-header';
import ChatAssistant from '@/components/chat/chat-assistant';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('events')
    .select('title, description')
    .eq('id', params.id)
    .single();

  if (!data) return { title: 'Event not found' };

  return {
    title: data.title,
    description: (data.description ?? '').slice(0, 155),
  };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .eq('id', params.id)
    .single();

  if (!event) notFound();

  const ev = event as any;
  const registeredCount = ev.registrations?.[0]?.count ?? 0;
  const seatsLeft = event.capacity - registeredCount;
  const isFull = seatsLeft <= 0;
  const fillPercent = Math.min(100, Math.round((registeredCount / event.capacity) * 100));
  const accent = CATEGORY_ACCENTS[ev.category as EventCategory] ?? CATEGORY_ACCENTS.Workshop;

  const { data: related } = await supabase
    .from('events')
    .select('id, title, category, event_date')
    .gte('event_date', new Date().toISOString())
    .neq('id', params.id)
    .order('event_date', { ascending: true })
    .limit(3);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-slate-400 transition hover:text-cyan-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.56l2.22 2.22a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5a.75.75 0 111.06 1.06L5.56 9.25h10.69A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            All events
          </Link>
        </nav>

        <article className="glass-card neon-ring overflow-hidden">
          {/* Neon banner */}
          <div className={`relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12 ${accent.glow}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.accent} opacity-30`} aria-hidden />
            <div className="absolute inset-0 bg-void-950/70" aria-hidden />
            <div className="absolute inset-0 bg-grid-bright bg-grid opacity-30" aria-hidden />
            <div
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/15 animate-spin-slow"
              aria-hidden
            />

            <div className="relative">
              <span className={`chip backdrop-blur ${CATEGORY_STYLES[ev.category as EventCategory]}`}>
                <span aria-hidden>{accent.icon}</span>
                {ev.category}
              </span>

              <h1 className="mt-4 max-w-2xl font-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {event.title}
              </h1>

              <dl className="mt-7 grid gap-5 sm:grid-cols-3">
                <Detail icon="🕒" label="When" value={formatFullDate(event.event_date)} />
                <Detail icon="📍" label="Where" value={event.location ?? 'Location TBA'} />
                <Detail
                  icon="🎟️"
                  label="Seats left"
                  value={isFull ? 'Event is full' : `${seatsLeft} of ${event.capacity}`}
                  highlight={isFull ? 'text-rose-300' : 'text-cyan-300'}
                />
              </dl>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_300px]">
            <div>
              <h2 className="overline">about this event</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-300">
                {event.description ?? 'No description provided.'}
              </p>

              <div className="glass mt-7 rounded-xl p-5">
                <p className="font-display text-sm font-semibold text-white">Good to know</p>
                <ul className="mt-3 space-y-2.5 text-sm text-slate-300">
                  {[
                    'Registration includes an automatic Google Calendar invite by email.',
                    'Seats are confirmed instantly, first-come first-served.',
                    'Bring your college ID — check-in opens 30 minutes before start.',
                  ].map((tip) => (
                    <li key={tip} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-neon-sm" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Registration panel */}
            <aside className="h-fit md:sticky md:top-24">
              <div className="glass-strong neon-ring rounded-2xl p-6">
                <p className="font-display text-4xl font-bold text-glow text-white">{seatsLeft}</p>
                <p className="mt-0.5 text-sm text-slate-400">of {event.capacity} seats available</p>

                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]"
                  role="img"
                  aria-label={`${registeredCount} of ${event.capacity} seats taken (${fillPercent}%)`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                      isFull ? 'from-rose-500 to-rose-400' : 'from-cyan-400 to-fuchsia-400'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {registeredCount} student{registeredCount === 1 ? '' : 's'} registered
                </p>

                <RegisterForm eventId={event.id} disabled={isFull} />
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                Prefer to chat? Ask the assistant at the bottom-right to register you.
              </p>
            </aside>
          </div>
        </article>

        {related && related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-base font-semibold text-white">More upcoming events</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/events/${r.id}`}
                  className="group glass-card p-4 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-neon-sm"
                >
                  <span className={`chip ${CATEGORY_STYLES[r.category as EventCategory]}`}>
                    {r.category}
                  </span>
                  <p className="mt-2.5 font-display text-sm font-medium leading-snug text-slate-100 transition group-hover:text-cyan-300">
                    {r.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {formatShortDate(r.event_date)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <ChatAssistant />
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  highlight = 'text-white',
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div>
      <dt className="overline flex items-center gap-1.5 text-[10px]">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className={`mt-1.5 text-sm font-semibold ${highlight}`}>{value}</dd>
    </div>
  );
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}