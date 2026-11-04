# Backup & recovery (Supabase Free)

**Audience:** Operators keeping EW Machine Hire on **Supabase Free** under the zero ongoing fees preference ([`PREFERENCES.md`](./PREFERENCES.md)).  
**Assessed:** 2026-11-04  
**Related:** [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md)

Free tier does **not** include automatic backups. This runbook is manual. Do **not** purchase Pro or backup add-ons to satisfy this preference. Do **not** enable paid overages.

---

## 1. What to back up

| Asset | Free path | Notes |
|-------|-----------|-------|
| Postgres schema + data | `pg_dump` / dashboard export | Includes app tables; Auth users live in `auth` schema — dump with sufficient privileges |
| Storage objects | Dashboard download / `storage` API listing + download | **Out of initial scope** while attachments are disabled; revisit before enabling uploads |
| Auth config (URL allow-list, SMTP) | Screenshot / notes in ops vault | Not in `pg_dump` |
| Env vars (Netlify / local) | Already-owned secrets store | Never commit service-role keys |

---

## 2. Manual database backup (`pg_dump`)

### Prerequisites

- Database connection string from Supabase Dashboard → **Project Settings → Database** (use the URI; prefer session mode for dumps).
- Local `pg_dump` matching major version when possible (Postgres 15+ is fine for logical dumps).
- Store the dump on **already-owned** company storage (disk, existing file share). Do not buy new backup SaaS.

### Command (secrets stay in your shell env — do not paste into tickets)

```bash
# Example — replace with your URI; do not commit the URL
export SUPABASE_DB_URL='postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres'

pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="ewm-supabase-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Plain SQL alternative:

```bash
pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl \
  --file="ewm-supabase-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

### Dashboard export

If the project offers a dashboard backup/export on Free, download it on the same monthly cadence and treat it as a second copy. Prefer `pg_dump` as the primary, scriptable method.

### Cadence (Confirmed preference alignment)

| Cadence | Action |
|---------|--------|
| Monthly (minimum) | Full `pg_dump` of staging / production Free project |
| Before risky migrations | Extra dump |
| After restore drill | Keep the successful dump + note the date |

Verify the file is non-empty and store off the laptop that created it when possible.

---

## 3. Restore steps

### Into a fresh Supabase Free project (preferred drill)

1. Create a new Free project (Free allows **2** active projects — pause unused ones).
2. Apply Git migrations from `supabase/migrations/` first (schema source of truth).
3. Restore data:

```bash
# Custom format
pg_restore --no-owner --no-acl --dbname="$TARGET_DB_URL" ewm-supabase-YYYYMMDD.dump

# Or SQL format
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f ewm-supabase-YYYYMMDD.sql
```

4. Re-check Auth URL config, SMTP, and Storage buckets/policies.
5. Point staging/production env vars at the restored project only after smoke tests (`/login`, one authenticated read).
6. Run `node scripts/measure-usage.mjs` with `DATABASE_URL` (or Dashboard → Usage) to confirm sizes.

### Into the same project

Only when intentionally rolling back data. Prefer restoring to a **new** project for drills so the live Free project stays intact.

**Conflicts:** `pg_restore` into a DB that already has rows may fail on primary keys — truncate application schemas or restore to empty DB after migrations.

---

## 4. Inactivity pause & wake (Free)

Supabase Free projects may **pause** after roughly **one week** without sufficient database activity.

| Step | Action |
|------|--------|
| Prevention | Weekly open the app or run a small authenticated query (see maintenance table in [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md)) |
| Warning | Watch for Supabase email ~1 week before pause |
| Wake | Supabase Dashboard → project → **Restore** / unpause (wording may vary) |
| After wake | Confirm Auth, run a login smoke test, confirm Netlify/site still points at the same project URL |

Paused projects do not serve the app. This is an **availability** risk, not a billable overage. Restore window for paused projects is long (vendor docs: on the order of up to ~1 year) — still keep monthly `pg_dump` copies.

---

## 5. Storage / attachments

Initial capacity posture: **no attachments**. When uploads are enabled later:

1. Include Storage objects in the backup checklist.
2. Re-run capacity measurement — Storage **1 GB** Free ceiling becomes a likely limiter.
3. Do not assume DB `pg_dump` alone recovers files.

---

## 6. What this runbook does not do

- Does **not** promise a date when Free quota will fail.
- Does **not** enable or recommend paid overages, Pro upgrades, or backup add-ons.
- Does **not** replace Git migrations — schema continues to live in `supabase/migrations/`.

---

## 7. Related tooling

| Tool | Purpose |
|------|---------|
| `scripts/seed-capacity-demo.mjs` | Local DEMO seed for size measurement |
| `scripts/measure-usage.mjs` | Size / headroom report (no secrets printed) |
| `scripts/capacity/measure-queries.sql` | Raw SQL size queries for linked Free Supabase |
| Settings → Free-tier usage panel | In-app reminder of ceilings + doc links |
