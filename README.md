# 🎓 College Event Hub

An AI-powered college event management system built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth)**, **OpenAI (Vercel AI SDK)**, and **Google Calendar**.

## Features

### Student view (`/`)
- Browse upcoming events with debounced search + category filters (Workshop / Seminar / Hackathon)
- Event detail pages with live seat counts and one-click registration
- **AI Chat Assistant** (bottom-right drawer) that can list events, check seat availability, and register you directly via function calling

### Admin view (`/admin`, login required)
- Dashboard stats: total events, upcoming events, total registrations, capacity fill rate
- Popular events with fill-rate bars
- Create / edit / delete events via modal form
- Registrations table with search, event filter, and **CSV export**

### Google Calendar integration
- On every successful registration (UI **or** AI chat), the app creates a Google Calendar event with the student as an attendee — Google emails them the invite
- `google_event_id` is stored back on the registration row

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of [`supabase/migrations/20250101000000_init.sql`](supabase/migrations/20250101000000_init.sql) → **Run**.
   This creates the `students`, `events`, and `registrations` tables, the atomic `register_student_for_event` function, RLS policies, and seeds **5 realistic college events**.
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. **Create the admin user:** go to **Authentication → Users → Add user → Create new user**, using:
   - Email: `admin@admin.com` (must match `ADMIN_EMAIL` in `.env.local`)
   - Password: your choice
   - ✅ Auto-confirm user (required — unconfirmed accounts get "Email not confirmed" at sign-in)

## 2. AI model

The chat assistant runs on **`gpt-4o-mini`** via the Vercel AI SDK:

1. Create a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Set `OPENAI_API_KEY` in `.env.local`. Override the model with `OPENAI_MODEL`.

No OpenAI key? The app falls back to the **free Google Gemini tier** so it still runs
without a credit card:

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** → sign in → **Create API key** → copy (`AIza...`).
2. Set `GOOGLE_GENERATIVE_AI_API_KEY`. Model defaults to `gemini-2.5-flash`; override with `GOOGLE_AI_MODEL`.

Provider choice is made at request time in `/api/chat`: OpenAI when its key is set,
otherwise Gemini. Both support the three tools below.

## 3. Environment variables

```bash
cp .env.example .env.local
# then fill in the values
```

## 4. Google Calendar service account setup

The invite sender uses a **Google Cloud service account** with **domain-wide delegation not required** — the service account owns its own calendar.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create (or pick) a project.
2. **APIs & Services → Library** → search **Google Calendar API** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account**:
   - Name: `college-event-calendar`
   - Skip role grant → **Done**.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A JSON file downloads.
5. From that JSON file extract:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep the `\n` escapes when pasting into `.env.local`)
6. **Create a calendar the service account owns:**
   - Easiest path: in the JSON you have the service account's email (looks like `...@...iam.gserviceaccount.com`). While signed into any Google account, visit [calendar.google.com](https://calendar.google.com) → Settings → **Add calendar → Create new calendar** named e.g. `College Events`, then in the calendar's **Share with specific people** add the service-account email with **Make changes to events** permission.
   - Copy the calendar's **Integrate calendar → Calendar ID** → `GOOGLE_CALENDAR_ID`
7. Set `GOOGLE_CALENDAR_ENABLED=true`.

> Until `GOOGLE_CALENDAR_ENABLED=true` and credentials are present, registrations still work — invites are skipped with a log warning, and the UI shows "Registered!" without the calendar line.

## 5. Run

```bash
npm install
npm run dev
```

- Student site: http://localhost:3000
- Admin: http://localhost:3000/admin → sign in with the admin user you created
- Calendar API: `POST /api/calendar/add-event`
- Chat API: `POST /api/chat`

---

## 6. Deploy to Vercel

The app is a standard Next.js App Router project, so Vercel needs no custom build settings.

### First deploy

```bash
npm i -g vercel
vercel            # preview deploy
vercel --prod     # production
```

Or import the repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Next.js; leave the build command as `next build` and the output as the default.

### Environment variables

Set these in **Project → Settings → Environment Variables**. Do **not** commit `.env.local` — it is already in `.gitignore`.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Inlined into the client bundle at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | RLS-limited; safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Bypasses RLS. Server-only — admin writes and `google_event_id` persistence |
| `ADMIN_EMAIL` | Secret | The single email allowed into `/admin` |
| `OPENAI_API_KEY` | **Secret** | Enables `gpt-4o-mini`; omit to fall back to Gemini |
| `OPENAI_MODEL` | Secret | Defaults to `gpt-4o-mini` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Secret | Fallback provider when no OpenAI key |
| `GOOGLE_AI_MODEL` | Secret | e.g. `gemini-2.5-flash` |
| `GOOGLE_CALENDAR_ENABLED` | Secret | `true` only once all three Calendar values are set |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | **Secret** | Service-account address |
| `GOOGLE_PRIVATE_KEY` | **Secret** | Paste the whole PEM block, newlines included |
| `GOOGLE_CALENDAR_ID` | Secret | Target calendar ID |

Production behaviour without the optional keys:

- No `SUPABASE_SERVICE_ROLE_KEY` → the admin dashboard still renders (RLS permits reads) in an amber read-only mode, and event create/edit/delete return `503` with setup instructions.
- No `OPENAI_API_KEY` → chat uses the Gemini fallback, if that key is present. With neither key, `/api/chat` errors.
- No Calendar values → registrations succeed and simply skip the invite; students see a neutral "Calendar invites are not enabled" note rather than an error.

### After deploying

1. Supabase → **Authentication → URL Configuration**: set the Site URL to your production domain and add it to the redirect allow-list.
2. Confirm the admin user exists in Supabase Auth and that `ADMIN_EMAIL` matches exactly.
3. `vercel env ls` to confirm the secret set, then `vercel logs` and exercise `/`, `/login`, `/admin`, and one registration.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                     # Student dashboard (browse/search/filter)
│   ├── events/[id]/                 # Event detail + register form
│   ├── login/                       # Admin login
│   ├── admin/                       # Stats, event CRUD, registrations + CSV
│   └── api/
│       ├── chat/route.ts            # AI model + tools (list_events, check_availability, register_student)
│       ├── register/route.ts        # Registration endpoint (UI)
│       ├── calendar/add-event/      # Google Calendar invite creation
│       └── events/[...]             # Admin event CRUD (auth-guarded)
├── components/chat/chat-assistant.tsx  # Floating AI drawer (useChat from ai/react)
├── lib/
│   ├── supabase/                    # server / client / admin (service-role) clients
│   ├── register.ts                  # Shared registration pipeline (DB + calendar)
│   ├── google-calendar.ts           # googleapis service-account client
│   └── auth.ts                      # Admin session helpers
├── middleware.ts                    # Session refresh + /admin guard
└── types/database.ts                # Hand-written Database types + UI helpers
```

### Design notes

- **Capacity races:** registration calls a `SECURITY DEFINER` Postgres function that locks the event row (`FOR UPDATE`), counts registrations, and inserts — so concurrent requests can never overbook. Duplicate `(student, event)` pairs are rejected by a unique constraint.
- **AI tools:** implemented with the Vercel AI SDK's `streamText` + `tool()`; `maxSteps: 5` lets the model chain list → availability → register in one turn. Tool outputs are JSON the model can quote back. Provider is chosen at runtime: `gpt-4o-mini` when `OPENAI_API_KEY` is set, else free Google Gemini.
- **Shared pipeline:** the UI and the AI agent both call `registerStudent()`, so capacity rules, dedup, and calendar behavior are identical everywhere.
- **Security:** `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-only; event mutations are guarded by an admin session check; RLS allows public reads only. The admin address comes from `ADMIN_EMAIL` and is enforced server-side in `getAdminSession()` — signing in as any other user still gets bounced from `/admin`.
- **AI SDK version:** pinned to `ai@3.4.33` + `@ai-sdk/openai@0.0.72` to match the spec's `useChat` from `ai/react` API (v4/v5 renamed these APIs).
