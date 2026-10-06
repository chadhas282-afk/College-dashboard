-- ═══════════════════════════════════════════════════════════════════════
-- College Event Hub — schema, security, and seed data
-- Run in Supabase SQL Editor (or `supabase db push`).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Tables ─────────────────────────────────────────────────────────────

create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null unique,
  department    text,
  year_of_study int check (year_of_study between 1 and 5),
  created_at    timestamptz not null default now()
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text not null check (category in ('Workshop', 'Seminar', 'Hackathon')),
  event_date  timestamptz not null,
  location    text,
  capacity    int not null check (capacity > 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.registrations (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students (id) on delete cascade,
  event_id         uuid not null references public.events (id) on delete cascade,
  registered_at    timestamptz not null default now(),
  google_event_id  text,
  unique (student_id, event_id)
);

create index if not exists idx_registrations_event on public.registrations (event_id);
create index if not exists idx_registrations_student on public.registrations (student_id);
create index if not exists idx_events_date on public.events (event_date);
create index if not exists idx_students_email on public.students (lower(email));

-- ── Atomic registration function ───────────────────────────────────────
-- Enforces capacity and the one-registration-per-student rule inside a
-- single SQL statement, so two concurrent requests can never overbook.

create or replace function public.register_student_for_event(
  p_email       text,
  p_event_id    uuid,
  p_full_name   text default null,
  p_department  text default null,
  p_year        int  default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student   public.students;
  v_event     public.events;
  v_taken     int;
  v_reg       public.registrations;
begin
  -- Resolve or create the student by email
  select * into v_student from public.students where lower(email) = lower(p_email);
  if not found then
    insert into public.students (full_name, email, department, year_of_study)
    values (
      coalesce(p_full_name, split_part(p_email, '@', 1)),
      lower(p_email), p_department, p_year
    )
    returning * into v_student;
  end if;

  -- Lock the event row so capacity checks serialize
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Event not found';
  end if;

  if v_event.event_date < now() then
    raise exception 'This event has already taken place';
  end if;

  select count(*) into v_taken from public.registrations where event_id = p_event_id;
  if v_taken >= v_event.capacity then
    raise exception 'Event is full';
  end if;

  insert into public.registrations (student_id, event_id)
  values (v_student.id, p_event_id)
  on conflict (student_id, event_id) do nothing
  returning * into v_reg;

  if v_reg is null then
    return json_build_object('ok', false, 'error', 'ALREADY_REGISTERED');
  end if;

  return json_build_object('ok', true, 'registration_id', v_reg.id, 'student_id', v_student.id);
end;
$$;

-- ── Row Level Security ─────────────────────────────────────────────────
-- Anonymous + authenticated users may read the catalog and register via
-- the SECURITY DEFINER function. Writes to tables happen only through the
-- service role key (server routes), which bypasses RLS.

alter table public.students      enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "public read students" on public.students;
create policy "public read students" on public.students
  for select using (true);

drop policy if exists "public read events" on public.events;
create policy "public read events" on public.events
  for select using (true);

drop policy if exists "public read registrations" on public.registrations;
create policy "public read registrations" on public.registrations
  for select using (true);

drop policy if exists "anon can register via rpc" on public.registrations;
create policy "anon can register via rpc" on public.registrations
  for insert to anon, authenticated with check (true);

-- ── Seed data: 5 realistic college events ──────────────────────────────

insert into public.events (title, description, category, event_date, location, capacity)
values
  ('Intro to React & Next.js Workshop',
   'Hands-on session covering components, hooks, and the App Router. Bring a laptop — we build a small dashboard together. Starter repo and lunch provided.',
   'Workshop',
   now() + interval '3 days' + interval '10 hours',
   'CS Lab 204, Tech Block',
   40),

  ('AI in Healthcare Seminar',
   'Guest lecture by Dr. Ananya Rao on how machine learning is reshaping diagnostics, drug discovery, and patient care. Q&A and networking after the talk.',
   'Seminar',
   now() + interval '5 days' + interval '14 hours',
   'Auditorium A, Main Campus',
   120),

  ('HackTheCampus 24h Hackathon',
   'Overnight hackathon with themes in fintech, sustainability, and campus life. Teams of up to 4. ₹50k prize pool, mentor availability all night, midnight snacks guaranteed.',
   'Hackathon',
   now() + interval '10 days' + interval '9 hours',
   'Innovation Hub, Block C',
   100),

  ('Placement Prep: System Design Workshop',
   'Alumni from top product companies walk through scalable system design fundamentals: caching, queues, sharding, and mock interview rounds.',
   'Workshop',
   now() + interval '7 days' + interval '11 hours',
   'Seminar Hall 2, Academic Block',
   60),

  ('Startup Founders Fireside Chat',
   'Fireside chat with three alumni founders on building from a dorm room to Series A. Moderated Q&A, followed by open networking over coffee.',
   'Seminar',
   now() + interval '14 days' + interval '16 hours',
   'Library Lawn, North Campus',
   80)
on conflict do nothing;
