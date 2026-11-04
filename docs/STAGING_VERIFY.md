# Post-Netlify-connect verification checklist

**Status:** Prepare-only until a human connects Netlify Free + staging Supabase.  
**Agent note:** No Netlify credentials in the Cloud Agent — deploy/connect is **blocked** until you click Path A in [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md).  
**Hard rules:** No purchase · no DNS for Path A · no merge · preserve `ew.com.zm` / Titan MX · email delivery + backup restore stay **explicitly UNTESTED** until their own checks pass · Titan login issues must not block other steps.

Use this **after** the first green Netlify deploy on branch `cursor/staging-deploy-prep-96e9` (or the agreed staging branch).

---

## 0. Preconditions

- [ ] Netlify site exists (Free plan; no upgrade; no auto-recharge)
- [ ] GitHub repo linked; branch deploy succeeded (`npm run build`)
- [ ] Staging Supabase project (non-production) created
- [ ] Env vars set in Netlify (see §1 table in [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md))
- [ ] `DEV_ALLOW_UNCONFIGURED_SHELL` unset or `false`

---

## 1. Deploy smoke

| Step | Action | Pass criteria |
|------|--------|----------------|
| 1.1 | Open `https://<site>.netlify.app/login` | Login page loads (not 500) |
| 1.2 | `GET /api/health/ready` | JSON `ok: true`; `supabase.configured: true`; `allowUnconfiguredShell: false` |
| 1.3 | Optional: `npm run smoke:auth -- --url https://<site>.netlify.app` | Exit 0; login + ready probes OK |
| 1.4 | Netlify build log | Node 20; command `npm run build`; no static `out/` export |

---

## 2. Migrations

| Step | Action | Pass criteria |
|------|--------|----------------|
| 2.1 | `npm run check:migrations` (local/CI) | Phase 2 SQL file listed |
| 2.2 | Apply `supabase/migrations/20261104120000_phase2_auth_rbac.sql` (`db push` or SQL editor) | Tables `profiles`, `roles`, `permissions`, `user_roles` exist |
| 2.3 | Seed/admin SQL from [`AUTH_SETUP.md`](./AUTH_SETUP.md) §4 | Test user has `admin` in `user_roles` |

---

## 3. Admin login & Auth URLs

| Step | Action | Pass criteria |
|------|--------|----------------|
| 3.1 | Supabase Auth → Site URL = `https://<site>.netlify.app` | Saved |
| 3.2 | Redirect URLs include `/auth/callback` for that origin (+ localhost) | Saved |
| 3.3 | Sign in at `/login` with email/password | Lands on protected shell (`/`) |
| 3.4 | Header shows email + roles (not “Local preview”) | Session live |
| 3.5 | Sign out | Returns to unauthenticated state |

**Still UNTESTED by default:** invite email, password-reset email (Titan SMTP) — mark separately in [`EMAIL_SMTP.md`](./EMAIL_SMTP.md). Do **not** treat login success as email delivery proof.

---

## 4. Permissions / RBAC

| Step | Action | Pass criteria |
|------|--------|----------------|
| 4.1 | Open `/users` while signed in as admin | Badge **Live RBAC read**; roles/permissions from Supabase |
| 4.2 | Dashboard **Session & RBAC status** | Shows email, roles, live catalogue counts |
| 4.3 | Open `/settings` as admin | Free-tier panel loads; profile count if service-role set |
| 4.4 | Non-admin user (if available) | Cannot see admin usage details; forbidden on `GET /api/admin/usage` |

---

## 5. Core customer workflow (honest scope)

Customer-test today is **auth shell + DEMO fleet UI**, not live hiring.

| Step | Action | Pass criteria |
|------|--------|----------------|
| 5.1 | Dashboard | Auth strip **live**; fleet cards clearly **DEMO** |
| 5.2 | `/machines` and a DEMO machine detail | DEMO rows only; banner visible |
| 5.3 | `/compliance`, `/hire-agreements`, `/customers`, etc. | **DEMO scaffold — no Supabase data** badges |
| 5.4 | Confirm verbally with customer | No expectation of live machine/hire CRUD yet (Phases 3–5) |

Do **not** invent hire/compliance rules during this smoke.

---

## 6. Preserve + free-tier hygiene

- [ ] `https://ew.com.zm` / `www` still load (unchanged)
- [ ] Company email still receives (Titan MX untouched)
- [ ] No new DNS for Path A
- [ ] Netlify plan still Free; Usage credits noted
- [ ] Supabase Free project activity (avoid 7-day pause)
- [ ] Backup restore drill still **UNTESTED** until [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) §7

---

## 7. What the agent cannot do without you

| Item | Why |
|------|-----|
| Connect Netlify / trigger production deploy | No `NETLIFY_AUTH_TOKEN` / browser login |
| Paste Supabase secrets into Netlify | Secrets stay on your machine/UI |
| Prove Titan invite/reset email | Explicitly UNTESTED |
| Prove backup restore | Explicitly UNTESTED |
| Merge PR / change DNS / purchase | Hard-disallowed |

When §1–§5 pass, Path A customer-test URL is ready to share: `https://<site>.netlify.app`.
