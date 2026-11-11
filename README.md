# ABL
# ABL - AI Learning Builder

Option 1: a quiz and activity builder for teachers. ABL uses fixed, tested templates and asks Gemini for structured JSON content only.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and set:

```env
USE_FAKE_MODE=true
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use fake mode while working on the interface. Set `USE_FAKE_MODE=false` only when a valid Gemini key is configured. Never commit `.env.local`.

## Database

Run `supabase/migrations/0001_initial.sql` in the Supabase SQL Editor. It creates teacher profiles, activities, RLS policies, public published access, and timestamp triggers.

## Tests

```powershell
npm test
```

## Main routes

- `/login` - teacher signup and sign in
- `/dashboard` - generate, edit, save, publish, and delete activities
- `/a/[id]` - public student activity view
- `/api/generate` - server-only Gemini generation route

## Security rules

- Gemini keys stay server-side in environment variables.
- Generated content is rendered as React text and structured data, never raw HTML.
- Supabase RLS limits teacher records to the owning teacher.
- Only published activities are accessible through public links.
