import { createAnonClient } from '@/lib/supabase/anon';
import { registerStudent, type RegisterStudentResult } from '@/lib/register';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import type { EventWithSeats } from '@/types/database';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the College Event Assistant. Help students find workshops/seminars and register them directly. Be concise, friendly, and helpful.

Guidelines:
- Today's date is ${new Date().toISOString().slice(0, 10)}.
- Use the list_events tool to find upcoming events. Pass category only when the student specifies one.
- Use check_availability before registering when seats matter or the student asks.
- Confirm the event title and date back to the student, and get their email address (ask if unknown) before calling register_student. Only register the email they give you.
- After a successful registration, check the tool result: if calendar_invite_sent is true, tell them a Google Calendar invite is on its way to their inbox; if it is false, just confirm the registration without mentioning the calendar.
- If a tool returns an error (event full, already registered), explain kindly and suggest alternatives with list_events.
- Never invent events, dates, or seat counts — always use tools.`;

// Serialize parallel duplicate registrations for the same email+event within one turn.
const inFlight = new Map<string, Promise<RegisterStudentResult>>();

async function fetchEventsWithSeats(category?: string, date?: string) {
  const supabase = createAnonClient();

  let query = supabase
    .from('events')
    .select('*, registrations(count)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte('event_date', start.toISOString()).lt('event_date', end.toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(`Database error: ${error.message}`);

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

  return events;
}

export async function POST(req: Request) {
  const isSet = (v?: string) => Boolean(v && v.trim() && !v.startsWith('PENDING'));
  const hasOpenAI = isSet(process.env.OPENAI_API_KEY);
  const hasGoogle = isSet(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  if (!hasOpenAI && !hasGoogle) {
    return new Response(
      JSON.stringify({
        error:
          'No AI provider configured. Add an OPENAI_API_KEY, or a free GOOGLE_GENERATIVE_AI_API_KEY (aistudio.google.com/apikey), to .env.local.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Primary provider per spec: gpt-4o-mini. Falls back to the free Gemini tier
  // when no OpenAI key is present.
  const model = hasOpenAI
    ? openai(process.env.OPENAI_MODEL || 'gpt-4o-mini')
    : google(process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash');

  const { messages } = await req.json();

  const result = await streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      list_events: tool({
        description: 'List upcoming college events, optionally filtered by category or date. Always call this before recommending events.',
        parameters: z.object({
          category: z
            .enum(['Workshop', 'Seminar', 'Hackathon'])
            .optional()
            .describe('Filter by category'),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe('Filter to events on this date (YYYY-MM-DD)'),
        }),
        execute: async ({ category, date }) => {
          const events = await fetchEventsWithSeats(category, date);
          return {
            count: events.length,
            events: events.map((e) => ({
              id: e.id,
              title: e.title,
              category: e.category,
              date: e.event_date,
              location: e.location,
              seats_left: e.seats_left,
              capacity: e.capacity,
            })),
          };
        },
      }),

      check_availability: tool({
        description: 'Check remaining seats for a specific event by its ID.',
        parameters: z.object({
          event_id: z.string().uuid().describe('The event UUID'),
        }),
        execute: async ({ event_id }) => {
          const supabase = createAnonClient();
          const { data, error } = await supabase
            .from('events')
            .select('id, title, capacity, event_date, registrations(count)')
            .eq('id', event_id)
            .single();

          if (error || !data) {
            return { error: 'Event not found.' };
          }

          const registered = (data as any).registrations?.[0]?.count ?? 0;
          return {
            event_id: data.id,
            title: data.title,
            date: data.event_date,
            capacity: data.capacity,
            registered,
            seats_left: data.capacity - registered,
            available: data.capacity - registered > 0,
          };
        },
      }),

      register_student: tool({
        description: 'Register a student for an event. Requires the student’s email and the event UUID. Fails if the event is full or the student is already registered.',
        parameters: z.object({
          student_email: z.string().email().describe('The student’s college email'),
          event_id: z.string().uuid().describe('The event UUID'),
        }),
        execute: async ({ student_email, event_id }) => {
          // Dedupe concurrent identical registrations in this request.
          const key = `${student_email}:${event_id}`;
          let promise = inFlight.get(key);
          if (!promise) {
            promise = registerStudent({ email: student_email, eventId: event_id }).finally(() => {
              inFlight.delete(key);
            });
            inFlight.set(key, promise);
          }

          const result = await promise;
          return {
            success: result.success,
            error: result.error,
            message: result.message,
            calendar_invite_sent: result.calendar?.created ?? false,
          };
        },
      }),
    },
    maxSteps: 5, // allow multi-step tool chains (list → availability → register)
  });

  return result.toDataStreamResponse();
}
