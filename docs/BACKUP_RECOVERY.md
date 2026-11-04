# Backup & recovery (Supabase Free)

**Audience:** Operators keeping EW Machine Hire on **Supabase Free** under the zero ongoing fees preference ([`PREFERENCES.md`](./PREFERENCES.md)).  
**Assessed:** 2026-11-04 (scheduled export + retention added)  
**Related:** [`EMAIL_SMTP.md`](./EMAIL_SMTP.md) · [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md) · [`PORTABLE_HOSTING.md`](./PORTABLE_HOSTING.md) · [`AUTH_SETUP.md`](./AUTH_SETUP.md)

Free tier does **not** include automatic backups. This runbook is **manual / company-PC scheduled**. Do **not** purchase Pro, PITR, or backup add-ons to satisfy this preference. Do **not** enable paid overages. Do **not** buy backup SaaS.

**Recovery status:** Scripts and procedures are **authored**. End-to-end restore and Auth recovery are **UNTESTED** until an operator completes §7 and records pass/fail. Do **not** claim recovery works until that drill passes.

---

## 1. What to back up

| Asset | How (free path) | Notes |
|-------|-----------------|-------|
| Business data (Postgres `public` + related) | `scripts/backup/export.sh` → `pg_dump` custom format | Primary artefact: `database.dump` |
| Roles / permissions / user↔role map | Same script → `roles-inventory.sql` | Phase 2 RBAC tables |
| Auth user directory (no passwords) | Same script → `auth-users-summary.csv` | From `auth.users` when privileges allow |
| Migrations inventory | Repo file list + checksums + `supabase_migrations.schema_migrations` when readable | Schema source of truth remains Git |
| Auth + host config | `AUTH_CONFIG_CHECKLIST.md` per run (operator fills) | Site URL, redirects, SMTP host/sender — **passwords stay in vault** |
| Env var **names** on Netlify/local | Ops notes | Never commit service-role keys |

Scripts live under [`scripts/backup/`](../scripts/backup/). Credentials file: copy `scripts/backup/backup.env.example` → `scripts/backup/backup.env` (**gitignored**). Prefer writing archives to **`EWM_BACKUP_ROOT` outside the git checkout**.

---

## 2. Scheduled export on an existing company computer

No new servers and no paid schedulers. Use the PC already used for ops.

### 2.1 One-time setup

1. Install **PostgreSQL client tools** (`pg_dump`, `pg_restore`, `psql`) matching major version when possible.
2. On Linux/macOS: `bash` is enough. On Windows: **Git Bash** or WSL + use `scripts/backup/export.ps1` from Task Scheduler.
3. Clone/pull this repo to a stable path on that computer.
4. Copy `scripts/backup/backup.env.example` → `scripts/backup/backup.env`.
5. Set:
   - `SUPABASE_DB_URL` — Database URI from Supabase → **Project Settings → Database** (prefer session/direct if pooler fails dumps). **Do not paste into chat.**
   - `EWM_BACKUP_ROOT` — e.g. `D:\Backups\EW-MachineHire` or `/var/backups/ew-machine-hire` (company disk / existing share).
   - Optional: `EWM_BACKUP_PROJECT=staging`, retention overrides (defaults **7** daily / **4** weekly).
6. Manual dry run:

```bash
cd /path/to/EW-MachineHire
chmod +x scripts/backup/export.sh scripts/backup/prune.sh scripts/backup/restore-test.sh
./scripts/backup/export.sh
```

Confirm a new folder under `$EWM_BACKUP_ROOT/daily/` with `database.dump`, inventories, and `logs/LAST_SUCCESS.txt`.

### 2.2 Linux / macOS — cron

Edit crontab on the company computer (`crontab -e`). Example: daily 02:15 local time:

```cron
15 2 * * * cd /path/to/EW-MachineHire && /bin/bash scripts/backup/export.sh >> /path/to/backups/logs/cron.log 2>&1
```

Ensure `backup.env` is loadable (script auto-sources `scripts/backup/backup.env` if present). Use absolute paths.

### 2.3 Windows — Task Scheduler

1. Open **Task Scheduler** → Create Basic Task → name `EWM-Supabase-Backup`.
2. Trigger: **Daily** (pick off-hours).
3. Action: **Start a program**
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\path\to\EW-MachineHire\scripts\backup\export.ps1"`
   - Start in: `C:\path\to\EW-MachineHire`
4. Run whether user is logged on or not (company policy); store the Windows credential for that service account in IT’s usual way — **not in git**.
5. On failure, open `%EWM_BACKUP_ROOT%\logs\LAST_FAILURE.txt` (path from `backup.env`).

Weekly copies: `export.sh` **promotes** the Sunday UTC daily run into `weekly/` automatically; no second purchase or cloud job required.

### 2.4 Retention (Confirmed preference alignment)

| Class | Keep | Location |
|-------|------|----------|
| Daily | **7** newest directories | `$EWM_BACKUP_ROOT/daily/` |
| Weekly | **4** newest epochs | `$EWM_BACKUP_ROOT/weekly/` (Sunday UTC promotion) |

Implemented by `scripts/backup/prune.sh` (invoked at end of `export.sh`). Override with `EWM_BACKUP_RETENTION_DAILY` / `EWM_BACKUP_RETENTION_WEEKLY`.

Also keep an extra dump **before risky migrations** outside the rotating folders if needed.

---

## 3. What each export contains

| File / dir | Purpose |
|------------|---------|
| `database.dump` | Logical `pg_dump` (custom) of the database URI you configured |
| `roles-inventory.sql` | Query output for `roles`, `permissions`, `role_permissions`, `user_roles` |
| `auth-users-summary.csv` | Auth directory without password hashes |
| `migrations-inventory/` | Repo migration filenames, sha256 (if available), applied versions when readable |
| `AUTH_CONFIG_CHECKLIST.md` | Operator checklist for Auth URLs + SMTP (no secrets) |
| `MANIFEST.txt` | Run metadata |
| `$EWM_BACKUP_ROOT/logs/` | Per-run logs, `LAST_SUCCESS.txt`, `LAST_FAILURE.txt` |

---

## 4. Failure reporting

| Signal | Meaning |
|--------|---------|
| Exit code ≠ 0 from `export.sh` / Task Scheduler last-run result | Backup failed |
| `$EWM_BACKUP_ROOT/logs/LAST_FAILURE.txt` | Timestamp, run dir, message |
| `$EWM_BACKUP_ROOT/logs/LAST_SUCCESS.txt` | Cleared failure flag on success; last good run |
| Optional `EWM_BACKUP_FAILURE_HOOK` | Local shell snippet only (e.g. append to a watched ops file). **No paid notification SaaS.** |

**Ops habit:** Check `LAST_SUCCESS` age at least weekly (same cadence as Free inactivity prevention). If older than ~36 hours on a daily schedule, investigate.

In-app Free-tier usage panel and Auth email remain separate concerns — backup failure is **file-based** on the company PC by design (zero new fees).

---

## 5. Manual one-off `pg_dump` (alternative)

If scripts are unavailable:

```bash
export SUPABASE_DB_URL='postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres'

pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="ewm-supabase-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Store off the creating laptop when possible. Prefer the scheduled script for inventories + retention.

---

## 6. Restore into a fresh project (production-shaped recovery)

**Preferred recovery target:** a **new** Free project (or local Postgres), not an overwrite of the only live DB.

1. Create Free project (remember: **2** active Free projects — pause unused).
2. Apply Git migrations from `supabase/migrations/` first (schema source of truth).
3. Restore data:

```bash
pg_restore --no-owner --no-acl --dbname="$TARGET_DB_URL" path/to/database.dump
```

4. Re-apply Auth Site URL, Redirect URLs, and **custom SMTP** from the checklist + ops vault ([`EMAIL_SMTP.md`](./EMAIL_SMTP.md)). Passwords are **not** in the dump artefacts.
5. Point staging/production env vars at the restored project only after smoke tests (`/login`, one authenticated read).
6. Re-assign admin role if needed ([`AUTH_SETUP.md`](./AUTH_SETUP.md)).
7. Run `node scripts/measure-usage.mjs` with a DB URL (or Dashboard → Usage).

**Same-project restore:** only for intentional rollback; prefer a throwaway project for drills. Primary-key conflicts are expected if the DB is not empty.

---

## 7. Test restoration procedure (separate from live backup)

Use [`scripts/backup/restore-test.sh`](../scripts/backup/restore-test.sh).

Without confirmation it only prints the drill (safe default):

```bash
./scripts/backup/restore-test.sh
```

To actually restore into a **throwaway** database:

```bash
export EWM_RESTORE_CONFIRM=YES
export TARGET_DB_URL='postgresql://...'   # EMPTY non-production only
export BACKUP_RUN_DIR='/path/to/backups/daily/YYYYMMDDT...-staging'
./scripts/backup/restore-test.sh
```

Then complete Auth/SMTP re-entry and smoke tests manually. **Record:**

| Check | Result | Date | Operator |
|-------|--------|------|----------|
| `pg_restore` into throwaway | ☐ Pass / ☐ Fail / **UNTESTED** | | |
| Migrations + data consistency smoke | ☐ Pass / ☐ Fail / **UNTESTED** | | |
| Auth login after URL+SMTP reconfig | ☐ Pass / ☐ Fail / **UNTESTED** | | |
| Admin role / RBAC visible | ☐ Pass / ☐ Fail / **UNTESTED** | | |

Until this table has a recorded Pass, recovery remains **UNTESTED**.

---

## 8. Inactivity pause & wake (Free)

Supabase Free projects may **pause** after roughly **one week** without sufficient database activity.

| Step | Action |
|------|--------|
| Prevention | Weekly open the app or run a small authenticated query ([`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md)) |
| Warning | Watch for Supabase email ~1 week before pause |
| Wake | Dashboard → project → **Restore** / unpause |
| After wake | Confirm Auth, login smoke test, confirm host still points at the same project URL |

Paused ≠ deleted, but the app is down. Keep rotating `pg_dump` copies anyway.

---

## 9. Storage / attachments

Initial posture: **no attachments**. When uploads are enabled:

1. Add Storage object download to the backup checklist.
2. Re-run capacity measurement — Storage **1 GB** Free ceiling.
3. Do not assume `pg_dump` recovers files.

---

## 10. What is **not** covered by this backup

Explicit exclusions (do not assume these are restored from `database.dump` alone):

| Not covered | Why / where instead |
|-------------|---------------------|
| Supabase Auth **SMTP password** and other dashboard secrets | Never dumped; ops vault / Supabase Dashboard only |
| Full Auth **config JSON** automation | Checklist + screenshots; re-enter manually |
| Password hashes / session secrets as a portable “login pack” | Users re-invite / reset after disaster if Auth rebuild needed |
| Netlify / host **env var values** | Host UI + vault — not in DB dump |
| Titan **mailbox contents** (inbox/sent) | Titan’s service; out of app backup scope |
| DNS / MX / SPF / DKIM at the registrar | Leave alone; preserve `ew.com.zm` + Titan ([`EMAIL_SMTP.md`](./EMAIL_SMTP.md)) |
| Git history / source code | Remains on GitHub; migrations also inventoried in each run |
| Storage **blobs** / uploaded files | Out of initial scope; not in `pg_dump` |
| Real-time PITR / point-in-time to the minute | Free tier does not include; not purchased |
| Guaranteed vendor Free-tier permanence | See [`PREFERENCES.md`](./PREFERENCES.md) |
| Backup failure email/SMS alerts | File markers on company PC only unless you add a **local** hook |

---

## 11. Secrets & Git

| Path | Tracked? |
|------|----------|
| `scripts/backup/*.sh`, `export.ps1`, `backup.env.example` | Yes |
| `scripts/backup/backup.env` | **No** (gitignored) |
| `$EWM_BACKUP_ROOT/**` dumps and logs | **No** — keep outside repo; patterns also gitignored |
| `*.dump`, local `backups/` | **No** |

Never commit database URLs with passwords, SMTP passwords, or service-role keys.

---

## 12. Related tooling

| Tool | Purpose |
|------|---------|
| `scripts/backup/export.sh` | Scheduled logical export + inventories |
| `scripts/backup/prune.sh` | 7 daily + 4 weekly retention |
| `scripts/backup/restore-test.sh` | Separate restore drill helper |
| `scripts/backup/export.ps1` | Windows Task Scheduler wrapper |
| `scripts/seed-capacity-demo.mjs` | DEMO size measurement only |
| `scripts/measure-usage.mjs` | Size / headroom report (no secrets printed) |
| Settings → Free-tier usage panel | In-app ceiling reminders |
