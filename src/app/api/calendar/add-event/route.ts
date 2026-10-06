import { NextResponse } from 'next/server';
import { createCalendarInvite, isGoogleCalendarConfigured } from '@/lib/google-calendar';
import { createAnonClient } from '@/lib/supabase/anon';
import { getAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';

interface AddEventBody {
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end?: string;
  attendee_email: string;
  attendee_name?: string;
}

async function authorize(body: AddEventBody): Promise<NextResponse | null> {
  const adminSession = await getAdminSession().catch(() => null);
  if (adminSession) return null;

  const email = body.attendee_email.toLowerCase();
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('registrations')
    .select('id, student: students ( email ), event: events ( title, event_date )')
    .order('registered_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startMs = new Date(body.start).getTime();
  const matched = (data ?? []).some((r: any) => {
    if ((r.student?.email ?? '').toLowerCase() !== email) return false;
    if (r.event?.title !== body.title) return false;
    return Math.abs(new Date(r.event?.event_date ?? body.start).getTime() - startMs) < 60_000;
  });

  if (!matched) {
    return NextResponse.json(
      { error: 'Not authorized to send an invite for this attendee/event. Register first, or sign in as admin.' },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(req: Request) {
  let body: AddEventBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { title, description, location, start, end, attendee_email, attendee_name } = body ?? {};

  if (!title || !start || !attendee_email) {
    return NextResponse.json(
      { error: 'title, start, and attendee_email are required.' },
      { status: 400 }
    );
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar is not configured. Set GOOGLE_CALENDAR_ENABLED=true and provide service-account credentials.' },
      { status: 503 }
    );
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'start must be a valid ISO datetime.' }, { status: 400 });
  }

  const authError = await authorize(body);
  if (authError) return authError;

  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const result = await createCalendarInvite({
    eventTitle: title,
    description: description ?? null,
    location: location ?? null,
    start: startDate,
    end: endDate,
    attendeeEmail: attendee_email,
    attendeeName: attendee_name,
  });

  return NextResponse.json(result, { status: result.created ? 200 : 500 });
}
