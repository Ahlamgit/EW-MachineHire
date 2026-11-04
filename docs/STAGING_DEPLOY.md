# Staging deployment prep (customer test)

**Status:** Ready for human DNS + host account steps. No production secrets in git. Do **not** merge until reviewed. Do **not** change root/www DNS, nameservers, or email/MX.

> **Hosting decision update (2026-11-04):** Independent assessment in [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md). Company site is **Hostinger LiteSpeed shared** (not suitable for this Next.js app as-is). **Vercel Hobby is non-commercial-only** — with no paid Pro approval, prefer **Netlify Free** (or Render Free) for customer testing. This file remains the Vercel-shaped runbook if Pro is later approved.

| Item | Value |
|------|--------|
| **Intended app URL** | `https://machinehire.ew.com.zm` (optional; or host `*.netlify.app` first) |
| **Public company site (preserve)** | `https://ew.com.zm` (root/www) |
| **Email (preserve)** | Titan MX on apex — do not touch MX/nameservers |
| **App branch for staging** | `cursor/phase-2-auth-rbac-f54e` (Phase 2) or a branch based on it |
| **Selected host (default now)** | **Netlify Free** — see [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md) |
| **Selected host (if Pro approved)** | **Vercel** (Next.js App Router native) — steps below |
| **Repo** | `Ahlamgit/EW-MachineHire` |

---

## 1. Subdomain in-use check (agent probe)

Probed on **2026-11-04** from the Cloud Agent environment:

| Check | Result |
|-------|--------|
| `dig` A | No answer |
| `dig` AAAA | No answer |
| `dig` CNAME | No answer |
| `host` / Google `8.8.8.8` | **NXDOMAIN** — hostname not configured |
| `https://` / `http://` curl | Fail: **Could not resolve host** |
| Apex NS (do not change) | `ns1.dns-parking.com` / `ns2.dns-parking.com` |
| Apex MX (do not change) | Titan Email (`mx1.titan.email`, `mx2.titan.email`) |
| `www.ew.com.zm` (preserve) | CNAME → `ew.com.zm` → A `82.180.175.43` |

**Verdict:** `machinehire.ew.com.zm` is **free / unused**. Safe to add a single subdomain record for Vercel without touching root, www, NS, or MX.

---

## 2. Why Vercel *if* Pro is approved

- This app is **Next.js App Router** (`next` 15) — Vercel is the native production host (zero custom server config).
- First-party GitHub integration with preview + production environments.
- Edge/middleware and Server Components work without adapters.
- Custom subdomain via **CNAME only** — preserves existing apex website + Titan email.

**Hobby caveat:** Vercel Fair Use restricts Hobby to **non-commercial personal** use. A paid consultant / company customer-test deployment is commercial → needs **Pro** (not approved). Until then use **Netlify Free** per [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md).

---

## 3. Exact DNS record to add (user action)

Add **one** record at the DNS host that currently serves `ew.com.zm` (zone behind `dns-parking.com` nameservers — typically the registrar/hosting panel where `ew.com.zm` DNS is edited).

### Record (subdomain → Vercel)

| Field | Value |
|-------|--------|
| **Type** | `CNAME` |
| **Name / Host** | `machinehire` *(not the FQDN; some panels want `machinehire.ew.com.zm` — use the subdomain form they document)* |
| **Value / Target / Points to** | **Copy from Vercel** after you add the domain (see §4). Format is project-specific, e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com` or the target shown on the domain card. Do **not** invent a target from another project. |
| **TTL** | `300` (5 minutes) while verifying; raise to `3600` after green |
| **Proxy** | Off / DNS-only if the panel offers a CDN proxy (orange cloud, etc.) |

### Do NOT add or change

| Leave alone | Why |
|-------------|-----|
| Apex `A` / `AAAA` for `ew.com.zm` | Company public site |
| `www` CNAME/A | Company public site |
| Nameservers | Moving NS would risk site + email |
| MX / SPF / DKIM / Titan records | Email must keep working |
| Any record for hosts other than `machinehire` | Out of scope |

### Optional ownership TXT (only if Vercel asks)

If Vercel says the domain needs verification across accounts, it will show a `_vercel` **TXT** on the **apex**. Add **only** that TXT value Vercel displays — still do not change NS/MX.

---

## 4. Account to connect now (user action)

1. **Vercel** account (personal or team that will own EW Machine Hire staging).
2. Connect **GitHub** → authorize repo **`Ahlamgit/EW-MachineHire`**.
3. Import the project from that repo.
4. Set **Production Branch** for this staging project to Phase 2 (`cursor/phase-2-auth-rbac-f54e`) **or** a dedicated staging branch based on it (this staging-prep branch is fine until Phase 2 merges).
5. Add domain **`machinehire.ew.com.zm`** under **Project → Settings → Domains**.
6. Copy the **exact CNAME target** Vercel shows into DNS (§3).
7. Paste **staging** env vars in **Project → Settings → Environment Variables** (checklist below). Never paste secrets into chat or git.

`VERCEL_TOKEN` was **not** available in the agent environment — CLI deploy was skipped. Use the dashboard click-path in §7.

---

## 5. Environment variable checklist (staging)

Set in the **Vercel** UI for **Production** (and Preview if you want PR previews against the same Supabase staging project). Values stay in the host UI only.

| Variable | Required? | Notes |
|----------|-----------|--------|
| `NEXT_PUBLIC_APP_NAME` | Recommended | `EW Machine Hire` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://machinehire.ew.com.zm` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Recommended | `machinehire@ew.com.zm` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Staging/dev Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** (one) | Public client key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional for login | Server-only; needed only for admin client / privileged jobs |
| `DEV_ALLOW_UNCONFIGURED_SHELL` | **Must be unset or `false`** | Never `true` on staging |

**Do not** deploy with production Supabase secrets. Use a **non-production** Supabase project until Phase 9.

Presence-only local check (prints no secrets): `npm run check:supabase-env`.

---

## 6. Supabase Auth redirect URLs (user action)

In the **staging/dev** Supabase project → **Authentication → URL configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://machinehire.ew.com.zm` |
| **Redirect URLs** (add) | `https://machinehire.ew.com.zm/auth/callback` |
| Keep local | `http://localhost:3000/auth/callback` |

Also keep Email provider enabled. Apply Phase 2 migration (`supabase/migrations/20261104120000_phase2_auth_rbac.sql`) on that same project before customer login tests. Assign an `admin` role per `docs/AUTH_SETUP.md`.

App callback route: `src/app/auth/callback/route.ts` (exchanges `code` for session).

---

## 7. Vercel click-path (no CLI token)

1. Open [https://vercel.com/new](https://vercel.com/new).
2. **Import** `Ahlamgit/EW-MachineHire` (connect GitHub if prompted).
3. Framework Preset: **Next.js** (auto).
4. Root Directory: `.` (repo root).
5. Environment Variables: add the checklist from §5 (staging values only).
6. Deploy. Confirm the default `*.vercel.app` URL builds and `/login` loads.
7. **Settings → Domains → Add** `machinehire.ew.com.zm`.
8. Add the shown **CNAME** at your DNS panel (§3). Wait for Vercel to show **Valid**.
9. Smoke-test: `https://machinehire.ew.com.zm/login` → sign-in → a protected shell route.

### Optional CLI (only if you already have a token locally)

```bash
# Do not paste tokens into chat. Use `vercel login` or a local env var.
npx vercel link
npx vercel env pull   # optional local mirror — keep out of git
npx vercel --prod     # only after env + domain are configured
```

Agent note: `VERCEL_TOKEN` / `VERCEL_ORG_ID` were unset here — no CLI deploy attempted.

---

## 8. `vercel.json`

Not required for this Next.js App Router app. Vercel auto-detects Next.js. A committed `vercel.json` was intentionally omitted to avoid locking framework settings prematurely. Revisit only if you need redirects, headers, or cron later.

---

## 9. Preserve checklist (before/after DNS edit)

- [ ] `https://ew.com.zm` still loads (company site)
- [ ] `https://www.ew.com.zm` still loads
- [ ] Company email still receives (Titan MX unchanged)
- [ ] Nameservers still `ns1`/`ns2.dns-parking.com` (unless you already managed DNS elsewhere without changing NS)
- [ ] Only new record is `machinehire` CNAME (+ optional `_vercel` TXT if prompted)

---

## 10. What the agent completed vs what you must do

| Done independently | Needs you |
|--------------------|-----------|
| NXDOMAIN / unused subdomain probe | Add CNAME at DNS panel |
| Chose Vercel + documented exact record shape | Create/login Vercel + link GitHub repo |
| Staging env checklist (no secrets) | Paste staging Supabase values in Vercel |
| Auth callback URL notes | Set Supabase Site URL + redirect URLs |
| Docs: this file, AUTH_SETUP + README staging sections | Confirm customer test users / admin role |
| `npm run build` verification on staging branch | Trigger first deploy from Vercel UI |
| No DNS mutation, no PR merge, no production secrets | Approve / merge when ready |
