# Security – Changelog

## 2025-11-05

- Added new task: Auto-Approve Preferences Migration (localStorage → server)
- Added new task: Google Service Account Security Audit
- Updated PLAN.md and STATUS.md with detailed implementation steps

## 2025-11-04

- incident: Discovered `.env.prod` in repo with live Supabase credentials and API keys.
- action: Added plan/status tasks to rotate secrets, purge file from history, and move to managed secret storage.
