import Link from 'next/link';
import { createReadableClient } from '@/lib/supabase/admin';
import { CATEGORY_ACCENTS, type EventCategory } from '@/types/database';
import StatsCards from './stats-cards';
import EventManager from './event-manager';
import RegistrationsPanel from './registrations-panel';
import SignOutButton from './sign-out-button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin dashboard',
};

export default async function AdminPage() {
  const { supabase, readOnly } = createReadableClient();

  const [eventsRes, regsRes] = await Promise.all([
    supabase
      .from('events')
      .select('*, registrations(count)')
      .order('event_date', { ascending: true }),
    supabase
      .from('registrations')
      .select(`
        registration_id: id,
        registered_at,
        google_event_id,
        student: students ( id, full_name, email, department, year_of_study ),
        event: events ( id, title, category, event_date )
      `)
      .order('registered_at', { ascending: false })
      .limit(500),
  ]);

  if (eventsRes.error || regsRes.error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-xl font-semibold text-rose-300">Database error</h1>
        <p className="mt-2 text-sm text-slate-400">
          {eventsRes.error?.message ?? regsRes.error?.message}
        </p>
      </main>
    );
  }

  const events = (eventsRes.data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    category: e.category,
    event_date: e.event_date,
    location: e.location ?? '',
    capacity: e.capacity,
    registered_count: e.registrations?.[0]?.count ?? 0,
  }));

  const registrations = (regsRes.data ?? []).map((r: any) => ({
    registration_id: r.registration_id,
    registered_at: r.registered_at,
    google_event_id: r.google_event_id,
    student_id: r.student?.id ?? '',
    student_name: r.student?.full_name ?? '',
    student_email: r.student?.email ?? '',
    department: r.student?.department,
    year_of_study: r.student?.year_of_study,
    event_id: r.event?.id ?? '',
    event_title: r.event?.title ?? '',
    event_category: r.event?.category ?? '',
    event_date: r.event?.event_date ?? '',
  }));

  const totalRegistrations = registrations.length;
  const upcoming = events.filter((e) => new Date(e.event_date) >= new Date());
  const totalCapacity = upcoming.reduce((s, e) => s + e.capacity, 0);
  const popular = [...events]
    .sort((a, b) => b.registered_count - a.registered_count)
    .slice(0, 3)
    .map((e) => ({
      ...e,
      fill_rate: e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0,
    }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-void-950/70 backdrop-blur-xl">
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
          aria-hidden
        />
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/15 text-base backdrop-blur"
              aria-hidden
            >
              ⚙️
            </span>
            <div className="leading-tight">
              <h1 className="font-display text-sm font-bold text-white">Admin Dashboard</h1>
              <p className="overline text-[9px]">event operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost btn-sm">
              Public site <span aria-hidden>↗</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {readOnly && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
          >
            <span className="text-base leading-none" aria-hidden>
              ⚠️
            </span>
            <div>
              <p className="font-medium">Read-only mode</p>
              <p className="mt-0.5 text-xs text-amber-200/80">
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> is not configured, so
                the dashboard is reading through the public RLS policies. Creating, editing, and
                deleting events will fail until you add a real service role key to{' '}
                <code className="font-mono">.env.local</code>.
              </p>
            </div>
          </div>
        )}

        <StatsCards
          totalEvents={events.length}
          upcomingEvents={upcoming.length}
          totalRegistrations={totalRegistrations}
          totalCapacity={totalCapacity}
        />

        
        {popular.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-base font-semibold text-white">Popular events</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((e) => {
                const accent =
                  CATEGORY_ACCENTS[e.category as EventCategory] ?? CATEGORY_ACCENTS.Workshop;
                return (
                  <div key={e.id} className="glass-card p-5 transition hover:border-cyan-400/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="overline text-[10px]">
                          <span aria-hidden>{accent.icon}</span> {e.category}
                        </p>
                        <p className="mt-1.5 font-display text-sm font-semibold leading-snug text-white">
                          {e.title}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
                          e.fill_rate >= 100
                            ? 'bg-rose-500/15 text-rose-300'
                            : e.fill_rate >= 60
                              ? 'bg-amber-400/15 text-amber-300'
                              : 'bg-cyan-400/15 text-cyan-300'
                        }`}
                      >
                        {e.fill_rate}%
                      </span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          e.fill_rate >= 100
                            ? 'from-rose-500 to-rose-400'
                            : 'from-cyan-400 to-fuchsia-400'
                        }`}
                        style={{ width: `${Math.min(100, e.fill_rate)}%` }}
                      />
                    </div>
                    <p className="mt-2 font-mono text-xs text-slate-500">
                      {e.registered_count}/{e.capacity} registered
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <EventManager events={events} />

        <RegistrationsPanel registrations={registrations} />
      </main>
    </div>
  );
}