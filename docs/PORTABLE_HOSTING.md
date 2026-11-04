# Portable hosting runbook

**Status:** Selected direction for host-agnostic ops (2026-11-04).  
**Preference:** Zero ongoing app service fees — [`PREFERENCES.md`](./PREFERENCES.md).  
**Staging today:** Netlify Free Path A (`*.netlify.app`) — [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md).  
**Netlify bits:** Optional / isolated — [`deploy/netlify/README.md`](../deploy/netlify/README.md).

This app is a standard **Next.js App Router** project. Business data lives in **Supabase**, not on the web host. You can change app hosts without rewriting the product, as long as you keep `npm run build` / `npm run start` and the same env + Auth URL pattern.

---

## 1. Non-negotiables

| Rule | Detail |
|------|--------|
| Standard Node deploy | Always support `npm run build` then `npm run start` (`next start`). Do not require a paid host-specific runtime as the only path. |
| Netlify / OpenNext optional | Root `netlify.toml` and Netlify’s auto OpenNext are **staging conveniences**. No OpenNext packages in `package.json`. Deleting `netlify.toml` must not break Node hosts. |
| Business data in Supabase | Postgres, Auth users, RLS, and (later) Storage objects stay in Supabase. **Do not** store hire/compliance/machine records as hosting-local files, SQLite on the VPS, or Netlify Blobs. |
| No paid / unnecessary provider services | No purchase for this preference. Prefer free tiers that pause/restrict over auto-charge. No host-specific paid add-ons (queues, KV, edge DB) unless Confirmed. |
| Preserve company site + email | Leave `ew.com.zm` / `www`, nameservers, Titan MX untouched. Staging uses host `*.netlify.app` first; `machinehire` CNAME is **optional later only**. |
| Separate decisions later | **App hosting** (where Next runs) vs **DB/Auth** (Supabase vs elsewhere) are **independent**. Do not couple them. |

---

## 2. Build & start (any Node host)

```bash
npm ci          # or npm install
npm run build   # next build
npm run start   # next start — listens on PORT (default 3000)
```

| Item | Value |
|------|--------|
| Node | **20+** (22 recommended; Netlify staging pins 20 via `netlify.toml`) |
| Build | `npm run build` |
| Start | `npm run start` |
| Health smoke | `GET /login` then sign-in → a protected shell route |

**Do not** set `output: 'export'` (static export). Middleware, auth callback, and SSR require a Node (or compatible) server.

**Optional later (Hostinger / VPS only):** `output: 'standalone'` in `next.config.ts` can shrink the deploy artifact for process managers. **Do not enable it for Netlify OpenNext staging** without re-validating that host. Treat standalone as a Hostinger/VPS checklist item, not a default.

---

## 3. Environment variables (host-agnostic)

Set these in the host’s env UI (or systemd / `.env` on a VPS). Never commit real values. Presence-only check: `npm run check:supabase-env`.

| Variable | Required? | Notes |
|----------|-----------|--------|
| `NEXT_PUBLIC_APP_NAME` | Recommended | `EW Machine Hire` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Exact public origin, e.g. `https://<site>.netlify.app` (Path A) or later branded URL |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Recommended | `machinehire@ew.com.zm` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Non-production Supabase project until Phase 9 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** (one) | Public client key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional for login | Server-only; admin/privileged jobs |
| `DEV_ALLOW_UNCONFIGURED_SHELL` | **Must be unset or `false` on staging/prod** | Local shell preview only |

Same names on Netlify, Render, Hostinger Node, or bare `next start`. Changing host = update values, not invent new variable families.

---

## 4. Database migrations

Schema source of truth: `supabase/migrations/`.

```bash
# Linked CLI (preferred)
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste migration SQL in order in the Supabase SQL editor.  
Phase 2 file: `supabase/migrations/20261104120000_phase2_auth_rbac.sql`.

Apply migrations on the **same** Supabase project the app’s `NEXT_PUBLIC_SUPABASE_*` points at. Assign `admin` per [`AUTH_SETUP.md`](./AUTH_SETUP.md).

---

## 5. Auth URL settings (every new origin)

In the **staging/dev** Supabase project → **Authentication → URL configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | Same as `NEXT_PUBLIC_APP_URL` |
| **Redirect URLs** | `<APP_URL>/auth/callback` |
| Keep local | `http://localhost:3000/auth/callback` |

App callback: `src/app/auth/callback/route.ts`.  
When you move from `*.netlify.app` → branded subdomain → Hostinger hostname, **update these three** (env APP_URL + Site URL + redirect) together.

Prefer custom SMTP before non-team invite/reset tests (default Auth SMTP ≈ 2 emails/hour).

---

## 6. Backups

Free Supabase has **no** automatic backups. Manual `pg_dump` / restore / inactivity wake: [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md).

- Store dumps on **already-owned** company storage.
- Do not buy backup SaaS for this preference.
- Hosting provider snapshots are **not** a substitute for Postgres dumps (business data is not on the web host disk).

---

## 7. Data placement (Confirmed direction)

| Data | Where |
|------|--------|
| Machines, hires, compliance metadata, users/roles, audit | **Supabase Postgres** (+ Auth) |
| Uploaded docs/photos (when enabled) | **Supabase Storage** |
| Static brand assets (logo) | Repo `public/brand/` (immutable assets, not business records) |
| DEMO / capacity harness | Local scripts only — not production data |

**Do not** write business records to Netlify Blobs, host `uploads/` folders, or SQLite beside `next start`.

---

## 8. Hostinger later (separate decisions)

Company marketing site today: **Hostinger LiteSpeed shared** + Titan email — suitable for static `ew.com.zm`, **not** proven for this Next.js app ([`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md)).

### Decision A — App hosting (verify separately)

Before moving the Next process onto Hostinger:

1. Confirm the plan includes **Node.js Web Apps** (or an already-owned VPS) with Node **20+**.
2. Confirm you can run `npm run build` + `npm run start` (or standalone) with a persistent process and HTTPS.
3. Confirm cold-start / memory limits fit SSR + middleware.
4. **Do not purchase** upgrades solely for this preference without a new stakeholder decision if that implies new ongoing fees.

This verification is **out of scope for current staging** — Path A stays on Netlify Free `*.netlify.app`.

### Decision B — DB / Auth (independent)

- Keeping **Supabase Free** for Postgres + Auth while the app runs on Hostinger Node is a valid architecture.
- Migrating DB/Auth off Supabase (e.g. self-hosted Postgres on Hostinger) is a **different** project: dumps, Auth replacement, RLS, SMTP, downtime plan.
- Do **not** treat “move app to Hostinger” as automatically “move database to Hostinger”.

### Preserve always

- Apex/`www` marketing site and Titan MX stay as-is unless ops explicitly owns a coordinated change.
- Prefer a **new** app hostname or process, not overwriting the LiteSpeed static site root.

---

## 9. Staging vs optional branded DNS

| Path | DNS | When |
|------|-----|------|
| **A — `*.netlify.app`** | **None** | Default customer-test staging now |
| **B — `machinehire.ew.com.zm` CNAME** | One subdomain CNAME only | Optional later, after Path A works |
| Hostinger Node hostname | TBD after Decision A | Later; still leave Titan MX alone |

Exact Path A clicks: [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md).  
Free-tier limits: [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md).

---

## 10. Agent / credentials note

Cloud agents often lack Netlify and Supabase tokens. Prep = configs + docs + user click-path. **Do not** paste secrets into chat. **Do not** change DNS or merge without review. **Do not** deploy if credentials are unavailable — document the exact UI steps instead.
