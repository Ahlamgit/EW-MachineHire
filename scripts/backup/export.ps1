# EW Machine Hire — Windows wrapper for export.sh (company PC / Task Scheduler).
# Requires: Git Bash or WSL with bash + PostgreSQL client tools (pg_dump, psql).
# Do not store passwords in this file — use backup.env (gitignored) next to export.sh.
#
# Example Task Scheduler action:
#   Program: powershell.exe
#   Arguments: -NoProfile -ExecutionPolicy Bypass -File "C:\path\to\repo\scripts\backup\export.ps1"
#   Start in: C:\path\to\repo

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportSh = Join-Path $ScriptDir "export.sh"

if (-not (Test-Path $ExportSh)) {
  Write-Error "export.sh not found at $ExportSh"
}

# Prefer Git Bash if present
$bashCandidates = @(
  "C:\Program Files\Git\bin\bash.exe",
  "C:\Program Files (x86)\Git\bin\bash.exe",
  "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe"
)
$bash = $bashCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $bash) {
  # Fall back to bash on PATH (WSL interop or manual install)
  $bash = "bash"
}

& $bash $ExportSh
if ($LASTEXITCODE -ne 0) {
  Write-Error "export.sh failed with exit code $LASTEXITCODE — see EWM_BACKUP_ROOT\logs\LAST_FAILURE.txt"
  exit $LASTEXITCODE
}
Write-Host "Backup finished OK"
