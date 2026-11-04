# Backup scripts (company PC)

Zero new fees — run on an **existing** company computer. Full runbook: [`docs/BACKUP_RECOVERY.md`](../../docs/BACKUP_RECOVERY.md).

| Script | Purpose |
|--------|---------|
| `export.sh` | `pg_dump` + roles + auth summary + migrations inventory + checklist |
| `prune.sh` | Keep **7** daily + **4** weekly |
| `restore-test.sh` | Separate restore drill (refuses without `EWM_RESTORE_CONFIRM=YES`) |
| `export.ps1` | Windows Task Scheduler wrapper (Git Bash / WSL) |
| `backup.env.example` | Copy to `backup.env` (**gitignored**) |

```bash
cp scripts/backup/backup.env.example scripts/backup/backup.env
# edit backup.env — never paste secrets into chat
chmod +x scripts/backup/*.sh
npm run backup:export
```

**UNTESTED:** end-to-end restore and Auth recovery until an operator completes the drill in the runbook.
