'use client';

import { useMemo, useState } from 'react';
import type { RegistrationRow } from '@/types/database';

export default function RegistrationsPanel({
  registrations,
}: {
  registrations: RegistrationRow[];
}) {
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [busy, setBusy] = useState(false);

  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    registrations.forEach((r) => map.set(r.event_id, r.event_title));
    return Array.from(map.entries());
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter((r) => {
      if (eventFilter && r.event_id !== eventFilter) return false;
      if (
        q &&
        !`${r.student_name} ${r.student_email} ${r.event_title} ${r.department ?? ''}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [registrations, search, eventFilter]);

  function exportCsv() {
    setBusy(true);
    try {
      const headers = [
        'Student Name',
        'Email',
        'Department',
        'Year',
        'Event',
        'Event Date',
        'Registered At',
        'Calendar Invite Sent',
      ];
      const escape = (v: unknown) => {
        const s = String(v ?? '');
        const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
        return `"${safe.replace(/"/g, '""')}"`;
      };
      const rows = filtered.map((r) =>
        [
          r.student_name,
          r.student_email,
          r.department,
          r.year_of_study,
          r.event_title,
          r.event_date,
          r.registered_at,
          r.google_event_id ? 'Yes' : 'No',
        ]
          .map(escape)
          .join(',')
      );
      const csv = '\uFEFF' + [headers.map(escape).join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-white">
          Registrations
          <span className="ml-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-cyan-300">
            {filtered.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            aria-label="Search registrations by student"
            className="field w-48 py-2"
          />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            aria-label="Filter registrations by event"
            className="field w-auto py-2"
          >
            <option value="">All events</option>
            {eventOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={busy || filtered.length === 0}
            className="btn-secondary btn-md"
          >
            <span aria-hidden>⬇</span> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left font-mono text-[10px] font-medium uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Dept / Year</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Invite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map((r) => (
                <tr key={r.registration_id} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{r.student_name}</p>
                    <p className="font-mono text-xs text-cyan-400/70">{r.student_email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                    {r.department ?? '—'}
                    {r.year_of_study ? ` · Yr ${r.year_of_study}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-100">{r.event_title}</p>
                    <p className="font-mono text-xs text-slate-500">{r.event_category}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                    {formatDt(r.registered_at)}
                  </td>
                  <td className="px-4 py-3">
                    {r.google_event_id ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-emerald-300">
                        sent
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-slate-500">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    {registrations.length === 0
                      ? 'No registrations yet.'
                      : 'No registrations match these filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatDt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}