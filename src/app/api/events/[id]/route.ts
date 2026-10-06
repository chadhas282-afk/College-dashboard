import { createAdminClient, ServiceRoleMissingError } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export const runtime = 'nodejs';

const VALID_CATEGORIES = ['Workshop', 'Seminar', 'Hackathon'];

function validate(body: any): string | null {
  if (body.title !== undefined && !String(body.title).trim()) return 'Title cannot be empty.';
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return 'Category must be Workshop, Seminar, or Hackathon.';
  }
  if (
    body.capacity !== undefined &&
    (!Number.isInteger(body.capacity) || body.capacity < 1)
  ) {
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const updates: Database['public']['Tables']['events']['Update'] = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.event_date !== undefined) updates.event_date = body.event_date;
  if (body.location !== undefined) updates.location = body.location;
  if (body.capacity !== undefined) updates.capacity = body.capacity;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
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
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    if (e instanceof ServiceRoleMissingError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }

  const { error } = await supabase.from('events').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
