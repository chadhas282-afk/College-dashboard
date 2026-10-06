'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm({
  eventId,
  disabled,
}: {
  eventId: string;
  disabled: boolean;
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [calendarSkipped, setCalendarSkipped] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setCalendarSkipped(false);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          email,
          full_name: fullName || undefined,
          department: department || undefined,
          year_of_study: year ? parseInt(year, 10) : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setCalendarSkipped(Boolean(data.calendar?.skipped));
        if (data.calendar?.created) {
          setMessage('Registered. Check your email for the Google Calendar invite.');
        } else if (data.calendar?.error && !data.calendar?.skipped) {
          setMessage(
            'Registered, but the calendar invite could not be sent — please note the date and location.'
          );
        } else {
          setMessage('Registered. See you there!');
        }
        router.refresh();
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-center backdrop-blur"
        role="status"
      >
        <span
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-void-950 shadow-neon"
          aria-hidden
        >
          <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="mt-3 font-display text-sm font-semibold text-white">{message}</p>
        {calendarSkipped && (
          <p className="mt-1.5 text-xs text-slate-400">
            Calendar invites are not enabled on this deployment.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setEmail('');
            setFullName('');
            setDepartment('');
            setYear('');
          }}
          className="mt-4 font-mono text-xs uppercase tracking-widest text-cyan-300 transition hover:text-cyan-200"
        >
          Register another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
      <div>
        <label htmlFor="reg-email" className="field-label">
          College email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="reg-name" className="field-label">
          Full name
        </label>
        <input
          id="reg-name"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="field"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-dept" className="field-label">
            Department
          </label>
          <input
            id="reg-dept"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="CSE"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="reg-year" className="field-label">
            Year
          </label>
          <select
            id="reg-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="field"
          >
            <option value="">Select</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'error' && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200"
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={disabled || status === 'loading'} className="btn-primary btn-md w-full">
        {disabled ? 'Event is full' : status === 'loading' ? 'Registering…' : 'Register — it’s free'}
      </button>
    </form>
  );
}