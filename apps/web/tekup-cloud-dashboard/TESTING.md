Tekup Cloud Dashboard — Testing Guide

Overview

- Test runner: Vitest (jsdom)
- Utilities: Testing Library (React), jest-dom matchers
- Location: tests live alongside components in `src/**/__tests__/*.{test,spec}.tsx`

Install

- From `apps/web/tekup-cloud-dashboard`:
  - `npm install` (workspace will install added devDeps)

Scripts

- `npm run test` — run tests once in CI mode
- `npm run test:watch` — watch mode during development
- `npm run typecheck` — strict TS check for app sources
- `npm run lint` — lint project sources
- `npm run build` — production build

Configuration

- `vitest.config.ts` sets `environment: 'jsdom'` and includes `vitest.setup.ts` to enable jest-dom matchers.

Component Coverage (initial)

- UI primitives: Button, Input, Select, Modal, Skeleton
- Dashboard/Layout: ActivityFeed, Sidebar, TopNav

Authoring Tips

- Prefer role- or text-based queries from Testing Library
- Avoid implementation details (classes) unless absolutely necessary
- Use `user-event` for realistic interactions
