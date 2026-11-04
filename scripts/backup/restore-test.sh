#!/usr/bin/env bash
# Separate TEST restoration procedure — does NOT touch the live project by default.
# Status: procedure authored; end-to-end restore is UNTESTED until an operator runs it.
#
# Preferred drill: restore into a temporary/empty Supabase Free project (or local Postgres),
# never into production. Free tier allows 2 active projects — pause unused ones.
#
# Usage:
#   export TARGET_DB_URL='postgresql://...'   # EMPTY or throwaway target
#   export BACKUP_RUN_DIR=/path/to/daily/YYYYMMDD...-staging
#   ./scripts/backup/restore-test.sh
#
# Optional:
#   EWM_RESTORE_CONFIRM=YES  required to proceed
#   EWM_APPLY_MIGRATIONS_FIRST=1  (document-only reminder; apply via supabase CLI / SQL files)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [[ "${EWM_RESTORE_CONFIRM:-}" != "YES" ]]; then
  cat <<'EOF'
restore-test.sh — DRY DOCUMENTATION MODE (no restore performed)

This script refuses to run until you set:
  EWM_RESTORE_CONFIRM=YES
  TARGET_DB_URL=postgresql://...   # throwaway / empty target only
  BACKUP_RUN_DIR=/path/to/a/backup/run/dir

Recommended drill (UNTESTED until you complete it):
  1. Create or wake a second Free Supabase project (or local Postgres).
  2. Apply Git migrations from supabase/migrations/ in order (source of truth for schema).
  3. pg_restore --no-owner --no-acl --dbname="$TARGET_DB_URL" "$BACKUP_RUN_DIR/database.dump"
     Or for conflicts: restore into empty DB after migrations; truncate app schemas if re-running.
  4. Re-enter Auth Site URL, Redirect URLs, and custom SMTP from AUTH_CONFIG_CHECKLIST.md
     (passwords from ops vault — never from git).
  5. Smoke: login, one authenticated read, admin role present.
  6. Record pass/fail + date in ops vault. Do not claim recovery works until this passes.
  7. Delete/pause the throwaway project when done.

See docs/BACKUP_RECOVERY.md § Test restoration.
EOF
  exit 0
fi

: "${TARGET_DB_URL:?Set TARGET_DB_URL to an EMPTY throwaway database}"
: "${BACKUP_RUN_DIR:?Set BACKUP_RUN_DIR to a daily/weekly run directory}"

DUMP="${BACKUP_RUN_DIR}/database.dump"
[[ -f "${DUMP}" ]] || { echo "Missing ${DUMP}"; exit 1; }

command -v pg_restore >/dev/null 2>&1 || { echo "pg_restore not found"; exit 1; }

echo "WARNING: Restoring into TARGET_DB_URL (ensure this is NOT production)."
echo "Dump: ${DUMP}"
echo "Repo migrations: ${REPO_ROOT}/supabase/migrations"
echo "If EWM_APPLY_MIGRATIONS_FIRST=1, apply migrations yourself before continuing."

if [[ "${EWM_APPLY_MIGRATIONS_FIRST:-}" == "1" ]]; then
  echo "Reminder: apply migrations now (supabase db push or SQL editor), then re-run if needed."
fi

pg_restore --no-owner --no-acl --dbname="${TARGET_DB_URL}" "${DUMP}"
echo "pg_restore finished (check stderr for object conflicts)."
echo "NEXT (manual, UNTESTED until you do them):"
echo "  - Reconfigure Auth URLs + SMTP from checklist"
echo "  - Smoke login on a host pointed at this project"
echo "  - Record result in ops vault"
echo "  - Pause/delete throwaway project"
