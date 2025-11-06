# Docker + Live Edit (HMR) — Status & Checklist

Dato: 4. november 2025
Owner: Ops/Platform
Status: [~] In progress (planning complete, ready to execute)

## Milestones

- [ ] A. Dev-mode HMR in containers
  - [ ] A1. Add docker-compose.override.yml (bind mounts, pnpm dev, polling)
  - [ ] A2. Adjust Vite config: server.watch.usePolling + HMR host/clientPort (Windows)
  - [ ] A3. Validate HMR: edit client/src/components/\*\* → live update in browser via container
  - [ ] A4. Document quick commands (docker-compose up with override) in DOCKER_SETUP.md

- [ ] B. Production image optimization
  - [ ] B1. Replace Dockerfile with multi-stage build (builder + non-root runner)
  - [ ] B2. Add .dockerignore (smaller build context)
  - [ ] B3. Smoke test: docker-compose up -d --build → healthcheck PASS
  - [ ] B4. Record image size improvement and boot time delta

- [ ] C. Compose hygiene & security
  - [ ] C1. Move sensitive defaults from compose into env_file (prod/supabase)
  - [ ] C2. Add profiles: ["legacy-mysql"] for db/adminer (not started by default)
  - [ ] C3. Sanity check logs (friday-ai, orchestrator, db/adminer under profile)

- [ ] D. Developer experience (optional)
  - [ ] D1. Add vite-plugin-restart for tasks/\*_/_ full reload (no server restart)
  - [ ] D2. Add test:watch and test:ui scripts (Vitest rapid loop)
  - [ ] D3. (Optional) Storybook init for isolated component dev

## Acceptance Criteria

- [ ] HMR works inside containers for component edits (client/src/components/\*\*)
- [ ] Server restarts automatically in dev (tsx watch via pnpm dev)
- [ ] Production image builds and runs as non-root; size reduced vs. current
- [ ] Compose uses env files; legacy services gated behind profile
- [ ] Documented workflows for both dev and prod flows

## Notes

- If HMR is flaky in Windows Docker, switch HMR host to host.docker.internal.
- Keep /app/node_modules as container volume to avoid conflicts with bind mount.
