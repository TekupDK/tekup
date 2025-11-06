# Environment Files - Quick Summary

## Active Environment Files

| File            | Purpose           | Used When               |
| --------------- | ----------------- | ----------------------- |
| `.env`          | Local development | `pnpm dev`              |
| `.env.prod`     | Production Docker | Docker container        |
| `.env.dev`      | Dev reference     | Can use instead of .env |
| `.env.supabase` | Supabase config   | Reference/backup        |

## Database Connection (All Environments)

```
postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?schema=friday_ai&sslmode=require
```

**Same database for all environments** - Supabase PostgreSQL with `friday_ai` schema

## Which File is Loaded?

### Development (pnpm dev)

- Loads `.env` via dotenv
- NODE_ENV=development

### Production Docker (docker-compose up)

- Loads `.env` via docker-compose (env_file)
- Then `.env.prod` overrides via dotenv in start script
- NODE_ENV=production

## MCP Configuration Fixed

### Problem

- MCP servers couldn't read DATABASE_URL from .env files
- VS Code doesn't load .env automatically for MCP

### Solution

- **HARDCODED** DATABASE_URL directly in MCP configuration files:
  - `.vscode/settings.json`
  - `tekup-ai-v2.code-workspace`
- Now postgres MCP server will work without system env vars

## Files You Can Delete

Safe to remove:

- `.env.supabase.tmp` (temporary)
- `.env.backup` (old backup)
- `.env.test-db` (if not using)
- `.env.test-supabase` (if not using)

Keep all other files!

## See Full Documentation

For complete details, see: `ENV_FILES_COMPLETE_GUIDE.md`
