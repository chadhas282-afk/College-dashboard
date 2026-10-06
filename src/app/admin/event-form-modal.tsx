'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_OPTIONS, toDatetimeLocal } from '@/types/database';
import type { AdminEvent } from './event-types';

export default function EventFormModal({
  event,
  onClose,
}: {
  event: AdminEvent | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultDate = toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const rawDate = String(fd.get('event_date') ?? '');
    const dateValue = new Date(rawDate);

    const payload = {
      title: String(fd.get('title') ?? '').trim(),
      description: String(fd.get('description') ?? '').trim(),
      category: String(fd.get('category') ?? ''),
      event_date: dateValue.toISOString(),
      location: String(fd.get('location') ?? '').trim(),
      capacity: parseInt(String(fd.get('capacity') ?? ''), 10),
    };

    if (!payload.title || !payload.category || Number.isNaN(dateValue.getTime())) {
      setError('Please fill all required fields correctly.');
      setBusy(false);
      return;
    }
    if (Number.isNaN(payload.capacity) || payload.capacity < 1) {
      setError('Capacity must be a positive number.');
      setBusy(false);
      return;
    }

    const res = await fetch(event ? `/api/events/${event.id}` : '/api/events', {
      method: event ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save event.');
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/80 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        className="glass-strong neon-ring nice-scroll max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 id="event-form-title" className="font-display text-lg font-bold text-white">
              {event ? 'Edit event' : 'New event'}
            </h3>
            <p className="overline mt-0.5 text-[10px]">
              {event ? 'update transmission' : 'create transmission'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-sm"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="field-label">
              Title *
            </label>
            <input
              id="title"
              name="title"
              required
              autoFocus
              defaultValue={event?.title}
              className="field"
              placeholder="e.g. Intro to React & Next.js Workshop"
            />
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={event?.description}
              className="field resize-none"
              placeholder="What will participants learn or do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="field-label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue={event?.category ?? ''}
                className="field"
              >
                <option value="" disabled>
                  Choose…
                </option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="capacity" className="field-label">
                Capacity *
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={event?.capacity ?? 50}
                className="field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event_date" className="field-label">
                Date & time *
              </label>
              <input
                id="event_date"
                name="event_date"
                type="datetime-local"
                required
                defaultValue={event ? toDatetimeLocal(new Date(event.event_date)) : defaultDate}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="location" className="field-label">
                Location
              </label>
              <input
                id="location"
                name="location"
                defaultValue={event?.location}
                className="field"
                placeholder="Auditorium A"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-200"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary btn-md">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary btn-md">
              {busy ? 'Saving…' : event ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}