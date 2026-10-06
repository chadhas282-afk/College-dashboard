import { createAdminClient, createReadableClient, ServiceRoleMissingError } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface EventPayload {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string;
  location?: string;
  capacity?: number;
}

const VALID_CATEGORIES = ['Workshop', 'Seminar', 'Hackathon'];

function validate(body: EventPayload): string | null {
  if (body.title !== undefined && !body.title.trim()) return 'Title cannot be empty.';
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return 'Category must be Workshop, Seminar, or Hackathon.';
  }
  if (body.capacity !== undefined && (!Number.isInteger(body.capacity) || body.capacity < 1)) {
    return 'Capacity must be a positive integer.';
  }
  if (body.event_date !== undefined && Number.isNaN(new Date(body.event_date).getTime())) {
    return 'event_date must be a valid datetime.';
  }
  return null;
}

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — admin sign-in required.' }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body: EventPayload = await req.json().catch(() => ({}));
  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    if (e instanceof ServiceRoleMissingError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: body.title!.trim(),
      description: body.description ?? null,
      category: body.category!,
      event_date: body.event_date ?? new Date().toISOString(),
      location: body.location ?? null,
      capacity: body.capacity ?? 50,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { supabase } = createReadableClient();
  const { data, error } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .order('event_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []).map((e: any) => ({
    ...e,
    registered_count: e.registrations?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ events });
}
