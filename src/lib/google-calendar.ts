import { google } from 'googleapis';

interface CalendarInviteInput {
  eventTitle: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
  attendeeEmail: string;
  attendeeName?: string | null;
}

interface CalendarInviteResult {
  created: boolean;
  google_event_id?: string;
  error?: string;
  skipped?: boolean;
}

export function isGoogleCalendarConfigured(): boolean {
  return (
    process.env.GOOGLE_CALENDAR_ENABLED === 'true' &&
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
    Boolean(process.env.GOOGLE_PRIVATE_KEY) &&
    Boolean(process.env.GOOGLE_CALENDAR_ID)
  );
}

export async function createCalendarInvite(
  input: CalendarInviteInput
): Promise<CalendarInviteResult> {
  if (!isGoogleCalendarConfigured()) {
    return { created: false, skipped: true };
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      requestBody: {
        summary: input.eventTitle,
        description: input.description ?? undefined,
        location: input.location ?? undefined,
        start: { dateTime: input.start.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: input.end.toISOString(), timeZone: 'Asia/Kolkata' },
        attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName ?? undefined }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
      sendUpdates: 'all',
    });

    return { created: true, google_event_id: response.data.id ?? undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Calendar error';
    console.error('[calendar] Failed to create invite:', message);
    return { created: false, error: message };
  }
}

export async function deleteCalendarInvite(googleEventId: string): Promise<boolean> {
  if (!isGoogleCalendarConfigured()) return false;

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      eventId: googleEventId,
      sendUpdates: 'all',
    });
    return true;
  } catch (error) {
    console.error('[calendar] Failed to delete invite:', error);
    return false;
  }
}
