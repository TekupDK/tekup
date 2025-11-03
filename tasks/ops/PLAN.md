# Ops (Backup/Restore/Runbooks) – Plan

Context: `scripts/backup-db.ps1`, rollback workflow.

## Goals

- Easy backups before migrations; reliable rollback.

## Acceptance criteria

- [ ] Backups stored with timestamp naming.
- [ ] Rollback job documented with required secrets.

## Steps (suggested)

- [ ] Fill a short runbook linking to workflows.
- [ ] Add checksum/size check after backup.
