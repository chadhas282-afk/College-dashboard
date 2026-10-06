import { createAnonClient } from '@/lib/supabase/anon';
import { createAdminClient, hasServiceRoleKey } from '@/lib/supabase/admin';
import { createCalendarInvite } from '@/lib/google-calendar';

export interface RegisterStudentParams {
  email: string;
  fullName?: string;
  department?: string;
  yearOfStudy?: number;
  eventId: string;
}

export interface RegisterStudentResult {
  success: boolean;
  error?: 'ALREADY_REGISTERED' | 'EVENT_FULL' | 'EVENT_PAST' | 'EVENT_NOT_FOUND' | 'INVALID_INPUT' | 'DB_ERROR';
  message?: string;
  registration?: { id: string; student_id: string };
  calendar?: { created: boolean; google_event_id?: string; error?: string; skipped?: boolean };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterRpcResult {
  ok?: boolean;
  error?: string;
  registration_id?: string;
  student_id?: string;
}

/**
 * Shared registration pipeline used by both the UI form and the AI agent.
 * 1. Calls the atomic RPC (handles upsert-student, capacity, duplicates).
 * 2. On success, creates a Google Calendar invite with the student as attendee.
 */
export async function registerStudent({
  email,
  fullName,
  department,
  yearOfStudy,
  eventId,
}: RegisterStudentParams): Promise<RegisterStudentResult> {
  if (!EMAIL_RE.test(email) || !eventId) {
    return { success: false, error: 'INVALID_INPUT', message: 'A valid email and event are required.' };
  }

  // Public path: the SECURITY DEFINER RPC handles student upsert, capacity
  // and duplicates atomically — no service role needed.
  const supabase = createAnonClient();

  const { data: rpcData, error } = await supabase.rpc('register_student_for_event', {
    p_email: email.toLowerCase(),
    p_full_name: fullName ?? null,
    p_department: department ?? null,
    p_year: yearOfStudy ?? null,
    p_event_id: eventId,
  });

  const data = rpcData as RegisterRpcResult | null;

  if (error) {
    const raw = error.message || '';
    let mapped: RegisterStudentResult['error'] = 'DB_ERROR';
    if (raw.includes('Event is full')) mapped = 'EVENT_FULL';
    else if (raw.includes('already taken place')) mapped = 'EVENT_PAST';
    else if (raw.includes('Event not found')) mapped = 'EVENT_NOT_FOUND';

    return { success: false, error: mapped, message: raw };
  }

  if (!data?.ok) {
    return {
      success: false,
      error: (data?.error as RegisterStudentResult['error']) ?? 'ALREADY_REGISTERED',
      message: 'You are already registered for this event.',
    };
  }

  // Best-effort calendar invite — never block registration on it.
  // Calls createCalendarInvite() directly rather than POSTing to
  // /api/calendar/add-event: same handler the route exposes for external
  // callers, minus an HTTP round-trip back into this app.
  let calendar: RegisterStudentResult['calendar'] = { created: false };
  try {
    const { data: event } = await supabase
      .from('events')
      .select('title, description, location, event_date')
      .eq('id', eventId)
      .single();

    if (event) {
      const start = new Date(event.event_date);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // assume 2h duration

      const invite = await createCalendarInvite({
        eventTitle: event.title,
        description: event.description,
        location: event.location,
        start,
        end,
        attendeeEmail: email.toLowerCase(),
        attendeeName: fullName,
      });

      calendar = invite;
      if (invite.created && invite.google_event_id && hasServiceRoleKey()) {
        // Persisting google_event_id is an RLS-protected write — service role only.
        await createAdminClient()
          .from('registrations')
          .update({ google_event_id: invite.google_event_id })
          .eq('id', data!.registration_id!);
      }
    }
  } catch (e) {
    console.error('[register] calendar step failed:', e);
  }

  return {
    success: true,
    registration: { id: data!.registration_id!, student_id: data!.student_id! },
    calendar,
  };
}
