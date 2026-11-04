# Auth & RLS setup (Phase 2)

Private setup steps for a **non-production** Supabase project. Do **not** connect this guide to production until Phase 9. Never put the service-role key in `NEXT_PUBLIC_*` or client code.

---

## 1. Create a Supabase project

1. Create a project in the Supabase dashboard (staging/dev).
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Browser / client key → **either**:
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (classic “anon” / “public” name), **or**
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (newer “publishable” name)
   - The app accepts either name; if both are set to real values, **anon wins**.
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**; see §8)

## 2. Configure local env

```bash
cp .env.example .env.local
# edit .env.local with the values above
```

Optional local-only flag (never enable in production or staging once auth is wired):

```bash
# Allow browsing the shell without a session when Supabase env is missing/incomplete.
# Default when unset: unconfigured environments show the login/setup screen for app routes.
DEV_ALLOW_UNCONFIGURED_SHELL=true
```

When URL + client key are configured, set `DEV_ALLOW_UNCONFIGURED_SHELL=false` (or remove it) so middleware enforces sign-in.

### Presence-only config check (no secret values printed)

On the machine that has `.env.local`:

```bash
node scripts/check-supabase-env.mjs
```

Or:

```bash
npm run check:supabase-env
```

## 3. Apply migrations

From the repo (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the **development** project):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or run the SQL files under `supabase/migrations/` in order in the SQL editor.

Phase 2 migration creates: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, helper functions, RLS policies, and seeds the Proposed roles/permissions from `docs/PERMISSIONS.md`.

File: `supabase/migrations/20261104120000_phase2_auth_rbac.sql`

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

## 5. Run the app locally

```bash
npm install
npm run dev
```

Sign in at `/login`. Protected app routes require a session when Supabase is configured.

## 6. Online staging deployment (non-production)

Do **not** deploy to production (`https://machinehire.ew.com.zm`) from this guide.

1. Choose a staging host (e.g. Vercel / similar) pointed at branch `cursor/phase-2-auth-rbac-f54e` or a dedicated staging branch based on it.
2. Set staging environment variables (names only — paste values in the host UI, never in chat/git):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; if you need admin path / future privileged jobs)
   - `NEXT_PUBLIC_APP_URL` = your staging URL (e.g. `https://your-app-staging.example`)
   - Ensure `DEV_ALLOW_UNCONFIGURED_SHELL` is **unset** or `false`
3. In Supabase Auth settings, add the staging Site URL and redirect URL:  
   `https://YOUR_STAGING_HOST/auth/callback`
4. Confirm the Phase 2 migration is applied on the **same** development/staging Supabase project the staging app uses.
5. Deploy the build (`npm run build` / host pipeline). Smoke-test `/login` and a protected route.
6. Do **not** auto-merge PRs; do **not** point staging secrets at production.

## 7. What remains unverified without credentials on this agent VM

| Check | Status without local `.env.local` on the agent |
|-------|-----------------------------------------------|
| Email/password sign-in | Code present — run check on coordinator `/workspace` |
| Session cookie refresh (middleware) | Code present — verify where `.env.local` exists |
| RLS policies | SQL present — verify after `db push` on the dev project |
| Permission helper / RPC | Code present — verify after admin role assign |
| Service-role admin path | Stub — only if `SUPABASE_SERVICE_ROLE_KEY` is set server-side |

## 8. Is `SUPABASE_SERVICE_ROLE_KEY` required?

**For normal user sign-in, session cookies, and RLS-backed app queries: No.**

**Yes — server-only — when you need:**

- `createSupabaseAdminClient()` in `src/lib/supabase/admin.ts` (bypasses RLS for trusted server jobs)
- Future privileged maintenance / seeding / admin automation that must not use the user JWT
- Some CLI/dashboard workflows outside the Next app (not required just to open `/login`)

Never put the service-role key in `NEXT_PUBLIC_*` or commit it.

## 9. Security reminders

- Rotate any key that was ever committed or shared in chat.
- Production URL later: `https://machinehire.ew.com.zm`
- Support email: `machinehire@ew.com.zm`
