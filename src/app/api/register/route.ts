import { NextResponse } from 'next/server';
import { registerStudent } from '@/lib/register';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_INPUT', message: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    event_id: eventId,
    email,
    full_name: fullName,
    department,
    year_of_study: yearOfStudy,
  } = body ?? {};
  if (!eventId || !email) {
    return NextResponse.json(
      { success: false, error: 'INVALID_INPUT', message: 'event_id and email are required.' },
      { status: 400 }
    );
  }

  const result = await registerStudent({
    email,
    fullName,
    department,
    yearOfStudy,
    eventId,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
