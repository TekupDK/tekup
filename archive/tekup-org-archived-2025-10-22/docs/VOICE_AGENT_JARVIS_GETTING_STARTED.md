# Voice-Agent — Jarvis Pilot: Getting Started (Mock/Real)

This guide shows how to start the Voice-Agent with the new Jarvis integration in a safe way. Default mode is `mock`, which requires no external AI services and is best for quick testing.

## Prerequisites
- Node.js 22.x (use `.nvmrc` if available)
- pnpm via Corepack
  - corepack enable
  - corepack prepare pnpm@9.9.0 --activate
- Windows tips: Enable Developer Mode, avoid OneDrive paths, exclude repo from Defender, close VS Code/node before install.

## One-time setup
1) Install dependencies (workspace):
   - pnpm install
   - If you only want to work with Voice-Agent and encounter workspace issues, try a clean install and ensure registry access is OK. You can also run: `pnpm install --filter @tekup/voice-agent...`
2) Generate env files:
   - pnpm run env:auto

## Start in Mock mode (recommended for pilot)
- Using package script (works on all platforms):
  - pnpm --filter @tekup/voice-agent dev:jarvis:mock
- Alternatively (Windows PowerShell helper):
  - .\\scripts\\start-voice-agent-mock.ps1

What you get in mock mode:
- Deterministic responses from the Jarvis mock service
- Screen analysis UI toggles available; actual analysis is simulated
- No need for external AI model setup

## Start in Real mode (experimental)
- pnpm --filter @tekup/voice-agent dev:jarvis:real

Notes:
- Real mode dynamically imports the real JarvisVoiceService and attempts to initialize MiniCPM-based capabilities if available. Ensure related AI packages are built and any required model/runtime prerequisites are met. If initialization fails, the component falls back gracefully.

## Disable Jarvis entirely (off)
- pnpm --filter @tekup/voice-agent dev:jarvis:off

This runs the app with mock wiring but disables screen analysis features.

## Feature flag variable
- NEXT_PUBLIC_VOICE_AGENT_JARVIS_MODE: `real` | `mock` | `off` (default: `mock`)

## Quick smoke-test checklist
1. App loads without console errors
2. Start/stop recording works
3. Voice command produces a text response
4. (Optional) Screen capture works and returns simulated insights (mock)
5. Health indicator shows green when mock service initialized

Use apps/voice-agent/TEST_REPORT_TEMPLATE.md to record your test results.

## Troubleshooting
- If `next` is not found when building, ensure pnpm install completed successfully.
- If workspace install fails due to a different app’s dependency, try re-running install or focus on Voice-Agent after cleaning node_modules and store. Example:
  - pnpm store prune
  - Remove node_modules in the affected app
  - Re-run `pnpm install`
- On Windows, run PowerShell as Administrator if you hit permissions issues.
