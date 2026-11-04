# Auth & RLS setup (Phase 2)

Private setup steps for a **non-production** Supabase project. Do **not** connect this guide to production until Phase 9. Never put the service-role key in `NEXT_PUBLIC_*` or client code.

---

## 1. Create a Supabase project

1. Create a project in the Supabase dashboard (staging/dev).
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)

## 2. Configure local env

```bash
cp .env.example .env.local
# edit .env.local with the values above
```

Optional local-only flag (never enable in production):

```bash
# Allow browsing the shell without a session when Supabase env is missing/incomplete.
# Default when unset: unconfigured environments show the login/setup screen for app routes.
DEV_ALLOW_UNCONFIGURED_SHELL=true
```

## 3. Apply migrations

From the repo (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the project):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or run the SQL files under `supabase/migrations/` in order in the SQL editor.

Phase 2 migration creates: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, helper functions, RLS policies, and seeds the Proposed roles/permissions from `docs/PERMISSIONS.md`.

## 4. Enable Email auth

1. Authentication → Providers → Email enabled.
2. Configure Site URL / redirect URLs for local (`http://localhost:3000/auth/callback`) and staging.
3. Create the first user (dashboard or invite).
4. In SQL, ensure a `profiles` row exists (trigger on `auth.users` insert handles new users) and assign `admin`:

```sql
insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
cross join public.roles r
where p.email = 'YOUR_ADMIN_EMAIL'
  and r.key = 'admin'
on conflict do nothing;
```

## 5. Run the app

```bash
npm install
npm run dev
```

Sign in at `/login`. Protected app routes require a session when Supabase is configured.

## 6. What remains unverified without credentials

| Check | Status without live Supabase |
|-------|------------------------------|
| Email/password sign-in | Code present — **not live-verified** |
| Session cookie refresh (middleware) | Code present — **not live-verified** |
| RLS policies denying anon/cross-user writes | SQL present — **not live-verified** |
| Permission helper against real `user_roles` | Code present — **not live-verified** |
| Service-role admin path | Stub only — **not exercised** |

## 7. Security reminders

- Rotate any key that was ever committed or shared in chat.
- Production URL later: `https://machinehire.ew.com.zm`
- Support email: `machinehire@ew.com.zm`
