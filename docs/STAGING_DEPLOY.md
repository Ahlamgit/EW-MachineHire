# Staging deployment (customer test) — Path A

**Status:** Ready for **human** Netlify Free + Supabase Free steps. No production secrets in git. Do **not** merge until reviewed. Do **not** change root/www DNS, nameservers, or email/MX. Do **not** purchase plans.

| Item | Value |
|------|--------|
| **Staging URL (Path A — default)** | `https://<site-name>.netlify.app` (**zero DNS**) |
| **Branded URL** | `https://machinehire.ew.com.zm` — **optional later only** (Path B) |
| **Public company site (preserve)** | `https://ew.com.zm` / `www` |
| **Email (preserve)** | Titan MX on apex — do not touch MX/nameservers |
| **App branch** | `cursor/staging-deploy-prep-96e9` (or Phase 2 / agreed staging branch) |
| **Selected host** | **Netlify Free** (commercial OK; hard credit pause) |
| **Data / Auth** | **Supabase Free** (non-production project) |
| **Portable Node path** | `npm run build` + `npm run start` — [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) |
| **Netlify isolation** | Optional bits — [`deploy/netlify/README.md`](../deploy/netlify/README.md) |
| **Repo** | `Ahlamgit/EW-MachineHire` |

**Related:** [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md) · [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md) · [`PREFERENCES.md`](./PREFERENCES.md) · [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) · [`EMAIL_SMTP.md`](./EMAIL_SMTP.md) · [`AUTH_SETUP.md`](./AUTH_SETUP.md)

> Company Hostinger LiteSpeed shared hosts the **marketing** site only today — not this Next.js app. Later Hostinger Node support is a **separate verification**; app hosting vs DB/auth migration are **separate decisions** ([`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §8). Vercel Hobby is non-commercial; Pro is unapproved — deferred (§9).

---

## 1. What you must click (Path A — Free Netlify staging)

No DNS. No purchase. Stay on **Free** (sites pause at 300 credits — preferred over auto-charge).

### A. Netlify account + site

1. Open [https://app.netlify.com/signup](https://app.netlify.com/signup) (or login). Choose **Free** / Starter — do **not** upgrade; do **not** enable credit auto-recharge (N/A on Free).
2. **Add new site** → **Import an existing project** → **GitHub**.
3. Authorize GitHub if prompted; select **`Ahlamgit/EW-MachineHire`** (public → Free Git OK).
4. Branch to deploy: **`cursor/staging-deploy-prep-96e9`** (or Phase 2 / staging branch you intend to test).
5. Build settings (should match root `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node:** 20 (from `netlify.toml`)
   - Do **not** set static `out/`. Do **not** pin `@netlify/plugin-nextjs`.
6. **Site configuration → Environment variables** — add staging values only (never paste into chat/git):

| Variable | Required? | Example / note |
|----------|-----------|----------------|
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://<site-name>.netlify.app` (copy after first deploy if name unknown — set before auth smoke) |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** (one) | Public client key |
| `NEXT_PUBLIC_APP_NAME` | Recommended | `EW Machine Hire` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Recommended | `machinehire@ew.com.zm` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only; not needed for normal login |
| `DEV_ALLOW_UNCONFIGURED_SHELL` | **Omit or `false`** | Never `true` on staging |

7. **Deploy site**. Wait for green build.
8. Open `https://<site-name>.netlify.app/login`.

### B. Supabase (staging/dev project)

9. Confirm Phase 2 migration is applied (`supabase/migrations/20261104120000_phase2_auth_rbac.sql`) — CLI `db push` or SQL editor ([`AUTH_SETUP.md`](./AUTH_SETUP.md)).
10. **Authentication → URL configuration:**
    - **Site URL:** `https://<site-name>.netlify.app`
    - **Redirect URLs:** add `https://<site-name>.netlify.app/auth/callback`
    - Keep: `http://localhost:3000/auth/callback`
11. Create/invite a test user; assign `admin` role (SQL in `AUTH_SETUP.md`). Prefer Titan custom SMTP if testing non-team invites (default ≈ 2 emails/hour) — [`EMAIL_SMTP.md`](./EMAIL_SMTP.md). Mark invite/reset **UNTESTED** until those checks pass.
12. Keep the Free project **active** (≥ weekly DB use) so inactivity pause does not hit mid-test.

### C. Smoke + share

13. Sign in on the Netlify URL → open a protected shell route.
14. Share **`https://<site-name>.netlify.app`** with the customer.
15. Prefer **Deploy Previews / branch deploys** over many production publishes (15 credits each). Check **Usage** credits weekly.

**DNS for Path A:** none. Preserve apex/`www`/NS/Titan MX.

---

## 2. Subdomain probe (optional Path B later)

Probed **2026-11-04** — `machinehire.ew.com.zm` was **NXDOMAIN** (unused). Apex NS `dns-parking.com`; MX Titan. Evidence: store `media/staging/`.

**Do not add DNS for Path A.** Path B (only after Path A works):

1. Netlify → Domain management → add `machinehire.ew.com.zm`.
2. At the DNS panel, add **only** CNAME `machinehire` → exact target Netlify shows.
3. Do **not** change NS, apex A/AAAA, `www`, or Titan MX/SPF.
4. Update `NEXT_PUBLIC_APP_URL` + Supabase Site URL + redirect to `https://machinehire.ew.com.zm`.

---

## 3. Migrations, backups, portable Node

| Topic | Doc / command |
|-------|----------------|
| Env vars (all hosts) | [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §3 · `.env.example` |
| Migrations | `npx supabase db push` or SQL editor — [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §4 |
| Backups | Company-PC scheduled export (`scripts/backup/`) — [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) (**restore UNTESTED**) |
| Auth email | Titan → Supabase custom SMTP — [`EMAIL_SMTP.md`](./EMAIL_SMTP.md) (**delivery UNTESTED**) |
| Auth URLs | [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §5 |
| Business data | Supabase only — [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §7 |
| Remove Netlify later | Delete `netlify.toml`; keep `npm run build` / `npm start` — [`deploy/netlify/README.md`](../deploy/netlify/README.md) |

Local production-mode check (no Netlify required):

```bash
npm ci
npm run build
npm run start
```

---

## 4. Netlify CLI (optional — user machine)

Agent Cloud VM: CLI present but **not logged in**. `netlify login` opens a browser authorize URL and waits — **no deploy without your authorization**. Do not paste tokens into chat.

On your laptop (secrets stay local):

```bash
npx netlify login          # browser approve — do not share the ticket URL in tickets with secrets
npx netlify status
npx netlify sites:create   # or link existing
# Prefer Git UI deploy for Path A; CLI only if you already use it locally
```

If login/authorize is inconvenient, use the **dashboard click-path in §1** only.

---

## 5. Preserve checklist

- [ ] `https://ew.com.zm` and `https://www.ew.com.zm` still load
- [ ] Company email still receives (Titan MX unchanged)
- [ ] Nameservers unchanged
- [ ] Path A: **no** new DNS records
- [ ] Path B (if ever): only `machinehire` CNAME (+ Netlify verification TXT if shown)
- [ ] Staging Supabase ≠ production secrets
- [ ] Netlify plan stays **Free**; no paid upgrades for this preference

---

## 5b. After first green deploy — verification

Full checklist (deploy, migrations, admin login, permissions, honest customer workflow): **[`STAGING_VERIFY.md`](./STAGING_VERIFY.md)**.

Quick probes:

```bash
curl -sS https://<site>.netlify.app/api/health/ready
npm run smoke:auth -- --url https://<site>.netlify.app
npm run check:migrations
```

Live vs DEMO honesty matrix: **[`LIVE_VS_DEMO.md`](./LIVE_VS_DEMO.md)**.

---

## 6. Done independently vs needs you

| Done on this branch | Needs you |
|---------------------|-----------|
| Path A runbook + portable hosting doc | Netlify Free signup / Git import / deploy |
| Isolated Netlify docs (`deploy/netlify/`, optional `netlify.toml`) | Paste staging Supabase env in Netlify UI |
| Env / migration / backup / Auth URL documentation | Supabase Auth URLs + migration + admin role |
| `npm run build` portable path unchanged | Browser authorize if using CLI; or dashboard-only |
| Post-connect verify checklist + live-vs-DEMO matrix | Run [`STAGING_VERIFY.md`](./STAGING_VERIFY.md) in browser |
| Auth/RBAC live reads on dashboard + `/users`; DEMO labels clarified | Share `*.netlify.app` for customer test |
| `check:migrations` / `smoke:auth` / `/api/health/ready` helpers | Complete §1 clicks |
| No DNS mutation, no merge, no purchase | — |
| Netlify CLI login attempted in agent — **blocked** on browser auth | — |

---

## 7. Hostinger / Vercel notes (not Path A)

| Host | Staging now? | Note |
|------|--------------|------|
| **Netlify Free `*.netlify.app`** | **Yes (default)** | This document |
| Hostinger shared LiteSpeed | No | Marketing site only; Node Web Apps **verify later**, separately from DB/auth |
| Hostinger Node / VPS | Later | [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) §8 — Decisions A vs B |
| Render Free | Alternative | Plain `next start`; cold starts — [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md) Path C |
| Vercel Hobby | No | Commercial fair-use restriction |
| Vercel Pro | Deferred | Requires paid approval — not part of zero-fee Path A |

### Deferred Vercel click-path (only if Pro later approved)

1. [vercel.com/new](https://vercel.com/new) → import same repo → Next.js preset.
2. Same env checklist as §1; `NEXT_PUBLIC_APP_URL` = Vercel or branded URL.
3. Custom domain only via CNAME for `machinehire` — never touch apex/`www`/MX.
4. No committed `vercel.json` required (Next auto-detect).
