# Morning Development Startup

Automated workflow to start your development day.

## Execution (All in parallel where possible)

### Phase 1: Git Sync (Parallel)

1. `git pull --rebase origin {current-branch}`
2. `git submodule update --remote --recursive`
3. Check for conflicts → resolve or alert

### Phase 2: Dependencies (Parallel per service)

4. Backend: `cd apps/rendetalje/services/backend-nestjs && npm install`
5. Frontend: `cd apps/rendetalje/services/frontend-nextjs && npm install`
6. Mobile: `cd apps/rendetalje/services/mobile && npm install`

### Phase 3: Services (Sequential)

7. Start Docker: `docker-compose up -d`
8. Wait for health checks (PostgreSQL, Redis)
9. Run database migrations if needed

### Phase 4: Status Report

10. Generate "Daily Dev Status":
    - New commits since yesterday
    - Open PRs needing review
    - Failed CI/CD runs (use gh CLI)
    - TODOs in codebase (grep for TODO/FIXME)
    - Current branch status

### Phase 5: Dev Servers (Background)

11. Start backend: `npm run start:dev` (run in background)
12. Start frontend: `npm run dev` (run in background)

## Output

```markdown
# Morning Sync Complete ✅

## Git Status
- Branch: {branch}
- Commits pulled: X
- Submodules synced: Y/Z

## Services Status
✅ PostgreSQL: Running
✅ Redis: Running
✅ Backend: http://localhost:3001
✅ Frontend: http://localhost:3002

## Today's Focus
- Open PRs: X
- Failed CI runs: Y
- Active TODOs: Z

Ready to code! 🚀
```

## Knowledge Search

Check setup_guides category in KNOWLEDGE_INDEX.json for any updated startup procedures.
