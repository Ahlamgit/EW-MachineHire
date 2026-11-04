# Staging hosting options (no paid Vercel Pro)

**Assessed:** 2026-11-04 (independent agent probe + public docs).  
**App:** Next.js 15 App Router + Supabase SSR (`@supabase/ssr`), middleware session gate, auth callback route.  
**Constraints:** Vercel account is **Hobby**; user has **not** approved paid hosting. Do **not** purchase plans, change DNS for apex/`www`, touch Titan MX, rewrite the app, or merge without review.

Related: [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md) (Path A Netlify Free click-path) · [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) (host-agnostic Node + Hostinger later) · [`deploy/netlify/README.md`](../deploy/netlify/README.md) (optional Netlify isolation).  
**Zero ongoing fees:** [`PREFERENCES.md`](./PREFERENCES.md) · free-tier fit & limits: [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md).

---

## 1. Company hosting verdict — `https://ew.com.zm`

**Verdict: cannot host this Next.js App Router app on the current public-site stack without a paid Hostinger plan change and/or Node Web Apps feature the probe cannot prove is already included.**

| Probe | Result |
|-------|--------|
| HTTPS response | `HTTP/2 200` |
| `server` | **LiteSpeed** |
| `platform` / `panel` | **hostinger** / **hpanel** |
| Body | Classic static HTML (Bootstrap/jQuery), `last-modified: Thu, 06 Apr 2023` |
| Apex A / AAAA | `82.180.175.43` / `2a02:4780:b:852:0:2b78:fc0a:6` |
| NS (leave alone) | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| MX / SPF (leave alone) | Titan `mx1`/`mx2.titan.email`; `v=spf1 include:spf.titan.email ~all` |
| `www` | CNAME → `ew.com.zm` (same Hostinger site) |
| `machinehire.ew.com.zm` | **NXDOMAIN** (still unused) |
| TLS SAN | `ew.com.zm`, `www.ew.com.zm` only (Let's Encrypt) |

**Interpretation**

- Public site is **shared Hostinger + LiteSpeed + hPanel**, serving a **static marketing site**, not a Node process.
- There is **no** evidence of Node/Next already running for the apex (no Node headers; HTML is flat files under LiteSpeed).
- Hostinger’s managed **Node.js Web Apps** (Next standalone) are documented for **Business Web Hosting / Cloud** plans — not something to assume on whatever plan currently serves this static site. Enabling that path likely means a **paid upgrade** (out of scope) and ops risk next to the live marketing site.
- No independent evidence of an existing company VPS ready for `next start`.

**Preserve email + public site**

- Any staging approach must use **only** a new subdomain record (e.g. `machinehire` CNAME) **or** a host-provided `*.netlify.app` / `*.onrender.com` URL with **zero** DNS changes.
- Never change NS, apex A/AAAA, `www`, MX, SPF/DKIM, or Titan settings.

---

## 2. Comparison — free / trial options (no Vercel Pro)

Costs and limits below are from vendor public docs as of assessment date. They can change; re-check before relying long-term.

| Option | Actual $0 path | Commercial-use eligibility | Next.js 15 App Router fit | Setup effort | Staging suitability |
|--------|----------------|----------------------------|---------------------------|--------------|---------------------|
| **Company Hostinger shared (current)** | Already paid for marketing site; Node apps need higher plan | N/A (wrong runtime today) | **Poor** — static/LiteSpeed shared; Node Web Apps not confirmed | High + plan risk | **No** for this app without upgrade |
| **Vercel Hobby** (existing account) | $0; ~100 GB transfer, 1M invocations, etc. | **No** — Hobby = **non-commercial personal only**; commercial needs Pro/Enterprise ([fair use](https://vercel.com/docs/limits/fair-use-guidelines)) | **Excellent** (native) | Lowest | **Blocked** by policy until Pro approved |
| **Netlify Free** (credit plan) | $0; **300 credits/mo** hard limit (e.g. 15 credits/prod deploy, 2 credits/10k requests, 20 credits/GB bandwidth, 10 credits/GB-hour compute). Site **pauses** when credits exhaust — no surprise bill if you stay on Free. See [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md) for production gaps (credits, org-private Git) | **Yes** — Free allows commercial; usage-capped | **Good** — OpenNext auto (`netlify.toml`); App Router / SSR / middleware / Server Actions | Low (Git import; no app rewrite) | **Best quick path** for staging; **not** confidently “forever prod” alone |
| **Render Free** Web Service | $0 compute; **750 instance-hours/mo**; spins down after **15 min** idle (~**1 min** cold start); bandwidth/build minutes can suspend if exhausted **without** a payment method | **Yes** (no personal-only Free rule; docs say not for production) | **Good** — real Node `npm run build` + `npm start` | Low–medium | Good if demos tolerate cold starts |
| **Cloudflare Workers Free** | $0; **100k req/day**, **10 ms CPU**/invocation | **Yes** (Workers Free allows commercial) | **Fair→Good** with OpenNext (or vinext for newer Next) — **adapter / config**, not zero-config | Medium (deps/config; avoid full rewrite) | Possible later; more friction now |
| **Railway trial → Free** | Trial **$5 once / 30 days**; then **$1/mo** credit. Custom domain: **1 on trial, then 0** on Free | Own business use generally OK; Pro recommended for client/commercial shipping | **Good** — Node runtime | Low during trial | Short trial OK; custom domain weak after trial |
| **Fly.io** | Short trial (**≤2 VM-hours or 7 days**); **no** recurring free tier for new orgs — card required after | Commercial OK once paying | Good (Docker/`next start`) | Medium | **Not** suitable under no-purchase rule |
| **Self-host Node on existing VPS** | $0 if VPS already exists | N/A | Excellent if Node 20+ | High (systemd, TLS, deploys) | Only if a VPS is already owned — **not observed** |

**App needs that matter for hosting**

- Server Components + Route Handlers (`/auth/callback`)
- Middleware (`src/middleware.ts`) with Supabase cookie session refresh
- Not a static `output: 'export'` site — shared PHP/static hosting will not work

---

## 3. Recommendation (quickest suitable, no paid Vercel Pro)

### Choose: **Netlify Free** for customer-test staging

**Why**

1. **Commercial use allowed** on Free (unlike Vercel Hobby).
2. **No app rewrite** — Netlify’s Next.js path uses OpenNext automatically.
3. **Fastest path to a shareable URL:** deploy from GitHub → use `https://<site>.netlify.app` for the customer test **without any DNS change** (public site + Titan email untouched).
4. Hard credit cap → **no purchase required**; if credits run out the site pauses rather than billing (keep auto-recharge **off** / stay on Free).
5. Optional later: add only `machinehire` **CNAME** to Netlify’s target when branding the URL — still leave apex/`www`/MX alone.

### Runner-up: **Render Free**

Use if you prefer a plain Node `next start` process identical to local production. Pre-hit the URL before a live customer call to avoid the ~1 minute cold start.

### Do not use for this staging round (under current constraints)

| Host | Reason |
|------|--------|
| Vercel Hobby | Commercial fair-use restriction |
| Vercel Pro | Requires paid approval |
| Current Hostinger shared | No Node/Next runtime proven |
| Hostinger Node Web Apps | Likely paid plan upgrade |
| Cloudflare Workers | Extra adapter/setup vs Netlify |
| Railway Free (post-trial) | Weak custom-domain story; tiny credit |
| Fly.io | Requires payment after short trial |

---

## 4. Exact next steps for the user (still no purchase)

### Path A — fastest (recommended): Netlify Free + `*.netlify.app`

**Canonical click-path:** [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md) §1.  
Repo root `netlify.toml` is **optional** Netlify staging config (`npm run build`, publish `.next`, Node 20) — documented in [`deploy/netlify/README.md`](../deploy/netlify/README.md). OpenNext is applied automatically by Netlify — do not pin `@netlify/plugin-nextjs` or add OpenNext to `package.json`. Portable Node remains `npm run build` + `npm run start` ([`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md)).

Summary: Free Netlify → GitHub import → branch `cursor/staging-deploy-prep-96e9` → staging env vars → deploy → Supabase Auth URLs for `*.netlify.app` → migration + admin → share Netlify URL. **DNS:** none. Prefer Deploy Previews over frequent production publishes.

**Agent note:** No Netlify token / browser authorize in the Cloud Agent — UI deploy is a **user** action.

### Path B — branded subdomain later (optional, still $0 on Free)

Only after Path A works:

1. Netlify → Domain management → add `machinehire.ew.com.zm`.
2. At the DNS panel for `ew.com.zm`, add **only**:

   | Type | Name | Value | Notes |
   |------|------|-------|--------|
   | CNAME | `machinehire` | *(exact target Netlify shows)* | Do not proxy/CDN-orange if that breaks validation |

3. Do **not** change NS, apex A/AAAA, `www`, or Titan MX/SPF.
4. Update `NEXT_PUBLIC_APP_URL` + Supabase Site URL / redirect to `https://machinehire.ew.com.zm`.

### Path C — Render Free alternative

1. Render → New **Web Service** → connect same repo/branch.
2. Runtime Node; build `npm install && npm run build`; start `npm start`; instance **Free**.
3. Set the same env vars; use the `onrender.com` URL first (no DNS).
4. Before a customer call, open the URL once so the service is warm.

---

## 5. Relationship to staging / portable docs

`STAGING_DEPLOY.md` is the **Path A Netlify Free** runbook (`*.netlify.app`, zero DNS). `PORTABLE_HOSTING.md` keeps Hostinger migration possible without Netlify lock-in (app hosting vs DB/auth = separate later decisions). Vercel remains **deferred** (Hobby non-commercial; Pro unapproved).

---

## 6. Independent verification performed

| Check | How |
|-------|-----|
| Apex/`www` stack | `curl -sI https://ew.com.zm` → LiteSpeed + `platform: hostinger` + `panel: hpanel` |
| Site type | HTML body sniff — static Bootstrap site, last-modified 2023-04-06 |
| DNS / email | `dig` NS, MX, TXT, A, AAAA, www CNAME |
| Subdomain free | `dig` + `host … 8.8.8.8` → NXDOMAIN for `machinehire.ew.com.zm` |
| App runtime needs | Repo: Next 15, `src/middleware.ts`, Supabase SSR, auth route handler |
| Vendor rules | Public docs: Vercel Hobby commercial restriction; Netlify Free commercial + credits; Render Free spin-down; Hostinger Node plan gates; Railway/Fly trial limits |

No purchases, no DNS mutations, no deploys to paid plans, no app rewrite, no merge.
