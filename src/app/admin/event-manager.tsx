'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AdminEvent } from './event-types';
import EventFormModal from './event-form-modal';

export default function EventManager({ events }: { events: AdminEvent[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setEditing(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(e: AdminEvent) {
    setEditing(e);
    setShowForm(true);
    setError(null);
  }

  async function handleDelete(e: AdminEvent) {
    if (
      !confirm(
        `Delete "${e.title}"? This also removes its ${e.registered_count} registration(s).`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${e.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to delete event.');
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-white">Manage events</h2>
        <button type="button" onClick={startCreate} className="btn-primary btn-md">
          <span aria-hidden>+</span> New event
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-200"
        >
          {error}
        </p>
      )}

      <div className="glass-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left font-mono text-[10px] font-medium uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {events.map((e) => (
                <tr key={e.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.location || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{e.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                    {formatDateSafe(e.event_date)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-300">{e.capacity}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium tabular-nums text-white">{e.registered_count}</span>
                    <span className="tabular-nums text-slate-500">/{e.capacity}</span>
                    <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          e.registered_count >= e.capacity
                            ? 'from-rose-500 to-rose-400'
                            : 'from-cyan-400 to-fuchsia-400'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((e.registered_count / e.capacity) * 100))}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="rounded-md px-2.5 py-1.5 font-mono text-xs text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      disabled={busy}
                      className="ml-1 rounded-md px-2.5 py-1.5 font-mono text-xs text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    No events yet — create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <EventFormModal event={editing} onClose={() => setShowForm(false)} />}
    </section>
  );
}

function formatDateSafe(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}