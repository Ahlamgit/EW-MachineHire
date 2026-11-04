# Free-tier constraints (Netlify Free + Supabase Free)

**Assessed:** 2026-11-04  
**Preference:** Zero ongoing service fees for the new app — see [`PREFERENCES.md`](./PREFERENCES.md).  
**Stack under review:** Netlify Free (credit-based) for Next.js hosting + Supabase Free for Postgres, Auth, Storage.  
**Sources:** Vendor public pricing/docs as of assessment date. Limits change; re-verify before claiming ongoing fitness.  
**Do not purchase** plans, credits, or add-ons. Do **not** promise permanent free availability from third parties.

Related: [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md), [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md), [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) Q12/Q13.

---

## 1. Fit verdict (honest)

| Use case | Verdict |
|----------|---------|
| **Customer-test / staging** on `*.netlify.app` + staging Supabase Free | **Suitable** under current free allowances, with manual setup (no agent deploy credentials) and credit/inactivity awareness. |
| **Ongoing company production** under zero ongoing fees | **Not confidently suitable** as a long-term production posture without material gaps. Light internal use *may* fit **only if** scale stays small, document storage is tightly controlled, Auth uses free custom SMTP (not default 2/hr), notifications stay in-app (or free SMTP), operators accept pause/restrict risk, and someone performs manual maintenance (below). |

**Bottom line:** Prefer Netlify Free + Supabase Free for **staging** and early demos. Do **not** claim the pair is proven for ongoing company production until Q12 scale is answered and the gaps in §5 are closed or accepted in writing.

---

## 2. Workload assumptions (scale is Open)

[`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) **Q12** (machines/users order of magnitude) and **Q13** (email notifications) are still **Open**. No stated production scale exists in project docs.

**Bounded assumptions used for this assessment** (not Confirmed — replace when Q12/Q13 are answered):

| Dimension | Low (demo / tiny ops) | Mid (plausible SMB fleet) | High (growth / heavy docs) |
|-----------|------------------------|---------------------------|----------------------------|
| Machines | ≤30 | 30–150 | 150+ |
| Internal users (MAU) | ≤15 | 15–50 | 50–200 |
| Concurrent staff on app | 1–5 | 5–15 | 15+ |
| Compliance / machine docs | Few PDFs, compressed | Current docs only (~1–3 files/machine) | Full history + photos/scans |
| App traffic | Staging / occasional demos | Daily office use, modest SSR | Always-on field + office + large downloads |
| Email | Auth only, rare | Auth + occasional ops mail | Compliance/hire notification volume |

Assessment compares free ceilings mainly against **Low → Mid**. High doc volume or continuous high SSR traffic breaks free storage/egress/credits first.

---

## 3. Limit tables

### 3.1 Netlify Free (credit-based, new accounts since 2025-09-04)

Commercial projects are allowed on Free. Free has a **hard credit limit** and **no auto-recharge** — preferred under the zero-fee preference (stop, don’t charge).

| Item | Free allowance / rule | When exceeded |
|------|------------------------|---------------|
| Monthly price | $0 | — |
| Monthly credits | **300** / month (hard limit) | All sites on the team **pause** (“Site not available”) until next billing cycle or upgrade |
| Auto-recharge / buy credits | **Not available** on Free | Stay paused or upgrade (do **not** upgrade under current preference) |
| Production deploy | **15 credits** each | Consumes monthly pool |
| Bandwidth | **20 credits / GB** | Consumes monthly pool |
| Web requests | **2 credits / 10,000** requests | Consumes monthly pool |
| Functions compute | **10 credits / GB-hour** | Consumes monthly pool (SSR / route handlers / Server Actions matter for this Next app) |
| Deploy Previews / branch deploys / failed deploys | **Not** credit-metered (per Netlify docs) | Prefer these over frequent production deploys |
| Concurrent builds | 1 | Queue; no purchase |
| Custom domain + SSL | Included | Optional later; Path A uses `*.netlify.app` with **zero DNS** |
| Org-owned **private** GitHub repos | **Pro-only** | This repo is currently **public** → Free Git deploy OK. If the repo becomes org-private, Free Git linking breaks without Pro or workaround |
| Collaboration / audit logs / shared env / password protection | Limited / Pro features | Single Team Owner on Free |

**Illustrative credit budget (300 credits):**

| Mix | Rough spend |
|-----|-------------|
| 8 production deploys | 120 credits |
| 5 GB bandwidth | 100 credits |
| 200k web requests | 40 credits |
| 4 GB-hours SSR compute | 40 credits |
| **Total** | **300** (at the ceiling) |

A quiet staging site with few production publishes can stay under budget. Aggressive prod redeploys, large media via Netlify, or heavy SSR can pause the site mid-month.

**Legacy Free** (accounts created before 2025-09-04) may still show older metrics (e.g. 100 GB bandwidth / 300 build minutes). New accounts for this project should assume **credit-based Free**.

### 3.2 Supabase Free

Free plan is usable for commercial/internal apps subject to Supabase Terms / AUP. Free does **not** charge overages; continued over-quota usage leads to **Fair Use restrictions** (preferred vs auto-bill). Spend Cap is a Pro concept — Free simply does not bill usage.

| Item | Free allowance / rule | When exceeded / inactivity |
|------|------------------------|----------------------------|
| Monthly price | $0 | — |
| Active projects | **2** (paused projects don’t count) | Cannot keep a 3rd active without pausing another or upgrading |
| Database size | **500 MB** / project (Shared CPU · 500 MB RAM) | Notify → grace → Fair Use (e.g. read-only / restrict / 402). Size enforcement uses **billing-period averages** — deleting data mid-cycle may not immediately clear restriction |
| File storage | **1 GB** | Same Fair Use path; averaged storage metrics apply |
| Egress (uncached / cached) | **5 GB / 5 GB** org quota | Cumulative in-cycle; cannot undo served bytes. Notify → grace → restrict |
| API requests | Unlimited (within Fair Use) | — |
| MAUs | **50,000** | Far above expected staff count |
| Auth (email/password) | Included | Built-in SMTP: **2 emails/hour**, team-only destinations, **non-production** intent. Production Auth needs **custom SMTP** (can be existing company mail if already paid — out of scope fee) |
| SSO (SAML) | Not on Free | N/A until Open SSO decision |
| Automatic backups | **Not included** | Manual `pg_dump` / export required |
| Inactivity pause | **~1 week** insufficient DB activity → project **paused** | Warning email ~1 week before; restore from dashboard (restore window up to ~1 year). Paid plans do not auto-pause |
| Over-quota billing | **No** charges on Free | Restrictions / pause / 402 — not a surprise invoice |

**Auth email gap:** Default Supabase SMTP is unsuitable for company login/recovery at scale. Wire free/existing SMTP before relying on production Auth email.

---

## 4. Mapping to EW Machine Hire workload

| Concern | Free path | Fit at Low–Mid assumption | First breakage |
|---------|-----------|---------------------------|----------------|
| Next.js App Router SSR / middleware | Netlify OpenNext (auto) | Staging: good. Prod: OK if credits conserved | Compute + prod deploys burn credits → site pause |
| Postgres (machines, hires, events, audit) | Supabase Free 500 MB | Likely OK for small/mid metadata | Large audit/history tables; unrestricted attachments in DB |
| Compliance / machine document files | Supabase Storage 1 GB | **Tight** even at Mid if PDFs/photos accumulate | **Storage** is the primary production gap |
| Auth for staff | Supabase Auth + custom SMTP | User count fine; email delivery constrained without SMTP | Default 2 emails/hour |
| Bandwidth / downloads | Netlify credits + Supabase egress | Staging OK; prod fragile if docs downloaded often | Supabase 5 GB egress; Netlify bandwidth credits |
| Notifications | In-app only (email Open Q13) | In-app stays $0 | Paid email/SMS providers conflict with preference |
| Uptime / weekends | Supabase activity required | Daily ops usually enough; idle staging can pause | 7-day pause |
| Disaster recovery | Manual exports | Extra ops burden | No automatic backups on Free |
| Team multi-admin on Netlify | Free = 1 Team Owner | Fine for solo deploy admin | Multi-admin wants Pro features |

---

## 5. Gaps before claiming ongoing company use

Do **not** claim “fits ongoing company production on free tiers” until these are resolved or explicitly accepted:

1. **Document storage (1 GB)** — compliance + machine docs will dominate. Need retention/compression rules, external already-owned storage, or a scale answer showing tiny doc volume.
2. **Supabase inactivity pause** — unacceptable surprise for a live ops tool if the project goes quiet (holiday, staging-only). Needs activity discipline or accepted restore process.
3. **No automatic backups** — ops must schedule manual backups and restore drills.
4. **Auth email** — custom SMTP required for real user invites/resets; default provider is not a production mail path.
5. **Email notifications (Q13)** — if Confirmed, need a $0 delivery path (existing mail SMTP / in-app only). Do not adopt paid notification SaaS as the long-term solution.
6. **Netlify credit ceiling** — mid-month pause if prod deploys + SSR + bandwidth overrun 300 credits; Free cannot buy more.
7. **Vendor policy risk** — free tiers can change; org-private GitHub would break Free Netlify Git linking; no permanence promise.
8. **Scale unknown (Q12)** — without machine/user counts, production fit is an assumption, not a measurement.
9. **Shared Free compute** — 500 MB RAM / shared CPU may feel slow under concurrent ops; not a fee issue but a reliability issue.

---

## 6. Manual maintenance (required if staying free)

| Cadence | Action |
|---------|--------|
| Weekly | Open the live app (or run a small authenticated query) so Supabase sees DB activity; confirm project not paused |
| Weekly | Check Netlify **Usage & billing** credits (warn at 50/75/90%) and Supabase org **Usage** (DB, storage, egress) |
| Before prod push | Prefer Deploy Preview / branch deploy; batch production publishes to save 15 credits each |
| Monthly | Manual Postgres backup (`pg_dump` or dashboard backup export if offered) stored on already-owned company storage |
| Monthly | Review Storage size; purge or archive superseded compliance scans per retention policy (once Confirmed) |
| On Auth setup | Configure **custom SMTP** using existing company mail if available; never rely on default 2/hr sender for staff |
| Ongoing | Keep Netlify on **Free**; do **not** enable auto-recharge (N/A on Free anyway) or upgrade “just in case” |
| Ongoing | Re-read Netlify + Supabase pricing/fair-use pages when planning go-live; update this doc’s date |

---

## 7. Behavior summary: stop/restrict vs charge

| Vendor | Free over-limit behavior | Aligns with zero-fee preference? |
|--------|--------------------------|----------------------------------|
| **Netlify Free** | Sites **pause**; no credit purchase on Free | **Yes** (stop, don’t charge) |
| **Supabase Free** | Notify → grace → Fair Use **restrict** (pause / read-only / 402); **no** overage invoice | **Yes** (restrict, don’t charge) |
| Paid plans with auto-recharge / spend-cap off | Can bill | **Avoid** under current preference |

---

## 8. Staging prep status (this branch)

| Item | Status |
|------|--------|
| Preference documented | `docs/PREFERENCES.md` |
| This constraints doc | Added |
| `netlify.toml` | Added (OpenNext auto; do not pin legacy plugin) |
| Exact Free staging steps | [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md) §4 Path A + § below |
| Agent deploy | **Not done** — no Netlify/Supabase credentials in environment |
| DNS | **None required** for `*.netlify.app`; do not touch apex/`www`/MX |

### Exact user steps — Netlify Free staging (no purchase)

1. Create/login a **Netlify Free** account. Stay on Free. Do not enable paid plans or auto-recharge.
2. **Add new site → Import from Git** → `Ahlamgit/EW-MachineHire` (public repo; Free Git OK).
3. Branch: `cursor/staging-deploy-prep-96e9` (or Phase 2 / agreed staging branch).
4. Build settings (auto / from `netlify.toml`): command `npm run build`, publish `.next`. Do **not** set static `out/`. Do **not** pin `@netlify/plugin-nextjs` unless debugging.
5. **Environment variables** (staging Supabase only):
   - `NEXT_PUBLIC_APP_URL` = `https://<site-name>.netlify.app`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Optional: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`
   - Leave `DEV_ALLOW_UNCONFIGURED_SHELL` unset/`false`
   - Keep `SUPABASE_SERVICE_ROLE_KEY` out of the client; only add if a server-only admin path needs it
6. Deploy → open `/login` on the Netlify URL.
7. Staging Supabase → Auth URL config: Site URL = Netlify URL; Redirect `https://<site-name>.netlify.app/auth/callback`.
8. Apply Phase 2 migration; assign `admin` per [`AUTH_SETUP.md`](./AUTH_SETUP.md). Prefer custom SMTP even on staging if testing invites/resets for non-team emails.
9. Share `*.netlify.app` for customer test. **No DNS** for Path A. Optional later: CNAME-only `machinehire` per hosting options doc — never change NS/apex/`www`/Titan MX.

---

## 9. Related documents

- [`PREFERENCES.md`](./PREFERENCES.md) — zero ongoing fees
- [`STAGING_HOSTING_OPTIONS.md`](./STAGING_HOSTING_OPTIONS.md) — host comparison + Path A/B/C
- [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md) — Vercel-shaped runbook (deferred while Hobby-only)
- [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — Q12 scale, Q13 email
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — stack topology
