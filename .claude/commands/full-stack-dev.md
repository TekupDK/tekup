# Full-Stack Feature Development

Develop a feature across backend, frontend, and mobile simultaneously using parallel agents.

## Arguments
- `feature`: Feature name/description (required)

## Multi-Agent Strategy

Launch 3 parallel agents (Task tool with subagent_type=general-purpose):

### Agent 1: Backend Development
```
Implement {feature} backend API:
1. Create NestJS controller + service + DTOs
2. Add Supabase database queries
3. Write unit tests (Jest)
4. Add API documentation (Swagger)
5. Commit when complete

Path: apps/rendetalje/services/backend-nestjs
```

### Agent 2: Frontend Development  
```
Implement {feature} frontend UI:
1. Create Next.js page/component
2. Add Zustand store if needed
3. Connect to backend API
4. Write component tests (RTL)
5. Add Playwright E2E test
6. Commit when complete

Path: apps/rendetalje/services/frontend-nextjs
```

### Agent 3: Mobile Development
```
Implement {feature} mobile screen:
1. Create React Native component
2. Add navigation routing
3. Connect to backend API  
4. Style with modern UI/UX
5. Commit when complete

Path: apps/rendetalje/services/mobile
```

## Coordination

Main Claude orchestrates:
1. Launch all 3 agents in parallel
2. Monitor progress
3. Resolve integration issues
4. Create integration tests
5. Merge all work into cohesive commits
6. Run `/test-all` to verify
7. Create PR with `/create-pr`

## Knowledge Integration

Before starting, search KNOWLEDGE_INDEX.json for:
- Similar features implemented before
- Architecture patterns to follow
- Common integration issues

Apply learnings to guide agents.

## Expected Timeline

- Serial development: 6-8 hours
- Parallel with agents: 2-3 hours (3x faster!)
