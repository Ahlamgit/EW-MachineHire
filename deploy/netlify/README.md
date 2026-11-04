# Netlify deploy bits (optional / isolated)

**Status:** Optional staging host only. Not required to build or run the app.

This folder documents Netlify-specific staging. The runtime config Netlify Git reads is the **repo-root** [`netlify.toml`](../../netlify.toml) (Netlify only auto-loads that path). Nothing under `package.json` depends on Netlify or OpenNext packages.

## What is Netlify-specific

| Artefact | Role |
|----------|------|
| `/netlify.toml` | Build command, publish dir, Node version for **Netlify Free** Git deploys |
| OpenNext (Netlify runtime) | Applied **automatically** by Netlify for Next.js 13.5+ — **not** a repo dependency |
| `@netlify/plugin-nextjs` | **Do not pin** in `netlify.toml` or `package.json` unless debugging a specific adapter version |

## What is portable (host-agnostic)

| Artefact | Role |
|----------|------|
| `npm run build` / `npm run start` (`next build` / `next start`) | Standard Node production path |
| `.env.example` / host env UI | Same variable names on any host |
| `supabase/migrations/` | Schema source of truth (Supabase) |
| App business data | **Supabase only** — never hosting-local files |

Full portable runbook: [`docs/PORTABLE_HOSTING.md`](../../docs/PORTABLE_HOSTING.md).  
Customer-test Path A (`*.netlify.app`, zero DNS): [`docs/STAGING_DEPLOY.md`](../../docs/STAGING_DEPLOY.md).

## Removing Netlify later

1. Delete `/netlify.toml` (and this folder if unused).
2. Deploy with `npm run build` + `npm run start` (or Hostinger Node Web Apps / VPS — verify separately).
3. Keep Supabase URL/keys and Auth redirect URLs; update only `NEXT_PUBLIC_APP_URL` + Supabase Site URL / redirect to the new origin.
4. **Do not** move Postgres/Auth into the web host as part of an app-hosting change — treat **app hosting** vs **DB/auth** as separate decisions ([`PORTABLE_HOSTING.md`](../../docs/PORTABLE_HOSTING.md) § Hostinger).

## Constraints (do not violate)

- Stay on **Netlify Free** (hard credit limit; sites pause — no auto-recharge).
- Prefer Deploy Previews / branch deploys over frequent production publishes (15 credits each).
- Path A uses `https://<site>.netlify.app` — **no DNS**. Optional `machinehire` CNAME later only.
- Preserve `ew.com.zm` / `www`, nameservers, Titan MX.
- Zero ongoing app fees preference: [`docs/PREFERENCES.md`](../../docs/PREFERENCES.md).
