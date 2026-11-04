#!/usr/bin/env bash
# Retain 7 newest daily + 4 newest weekly backup directories under EWM_BACKUP_ROOT.
# Safe to run after export.sh or standalone.
set -euo pipefail

: "${EWM_BACKUP_ROOT:?Set EWM_BACKUP_ROOT}"
DAILY_DIR="${EWM_BACKUP_ROOT}/daily"
WEEKLY_DIR="${EWM_BACKUP_ROOT}/weekly"
KEEP_DAILY="${EWM_BACKUP_RETENTION_DAILY:-7}"
KEEP_WEEKLY="${EWM_BACKUP_RETENTION_WEEKLY:-4}"

prune_dir() {
  local dir="$1"
  local keep="$2"
  local label="$3"
  if [[ ! -d "${dir}" ]]; then
    echo "prune: ${label} dir missing — skip"
    return 0
  fi
  # Directories sorted by name (UTC stamps sort lexicographically)
  mapfile -t entries < <(find "${dir}" -mindepth 1 -maxdepth 1 -type d | sort -r)
  local i=0
  for entry in "${entries[@]:-}"; do
    i=$((i + 1))
    if [[ "${i}" -gt "${keep}" ]]; then
      echo "prune: removing ${label} ${entry}"
      rm -rf "${entry}"
    fi
  done
  echo "prune: kept up to ${keep} ${label} directories (${#entries[@]} present before prune)"
}

prune_dir "${DAILY_DIR}" "${KEEP_DAILY}" "daily"
prune_dir "${WEEKLY_DIR}" "${KEEP_WEEKLY}" "weekly"
