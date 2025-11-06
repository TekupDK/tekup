# Public Tunnel Setup

## Goal

Enable external access to localhost:3000 for AI tool reviews (ChatGPT, Claude) and remote collaboration.

## Rationale

- AI tools with browser capabilities can visit and analyze the live app.
- Quick demos and testing without deploying to staging.
- Faster feedback loops for UX and functionality checks.

## Solution

Implement two tunnel options:

1. **LocalTunnel** (quick, no account required)
   - Fast setup, free
   - May have stability issues during peak times

2. **ngrok** (reliable, requires auth token)
   - More stable and performant
   - Requires free account + authtoken
   - Recommended for longer sessions

3. **Cloudflare Tunnel** (optional, for always-on)
   - Production-grade stability
   - Requires cloudflared + Cloudflare account
   - Can be added later if needed

## Implementation

### Scripts added

- `pnpm run tunnel:lt` — starts localtunnel
- `pnpm run tunnel:ngrok` — starts ngrok (requires NGROK_AUTHTOKEN)

### Files created

- `scripts/tunnel-localtunnel.mjs` — localtunnel starter script
- `scripts/tunnel-ngrok.mjs` — ngrok starter script
- `tasks/EXPOSE_LOCALHOST.md` — setup guide
- `tasks/AI_REVIEW_SESSION.md` — AI review checklist

### Dependencies added

- `localtunnel@^2.0.2` (devDependency)
- `ngrok@5.0.0-beta.2` (devDependency)

### ngrok CLI installed

- Installed via winget (Windows)
- Authenticated with authtoken
- Available globally as `ngrok` command

## Benefits

- ✅ No manual port forwarding or cloud deploys needed
- ✅ Public HTTPS URL in seconds
- ✅ Works with AI tools and external testers
- ✅ URL saved to `tmp/tunnel-url.txt` for easy access
- ✅ Clean shutdown with Ctrl+C

## Non-goals

- Not for production use
- Not a replacement for staging environments
- Temporary URLs only (localtunnel changes per session)

## Acceptance Criteria

- [x] Add npm scripts for tunnel:lt and tunnel:ngrok
- [x] Create tunnel starter scripts
- [x] Install localtunnel and ngrok packages
- [x] Add documentation in tasks/EXPOSE_LOCALHOST.md
- [x] Add AI review checklist in tasks/AI_REVIEW_SESSION.md
- [x] Install and authenticate ngrok CLI
- [x] Test tunnel and confirm public URL works
- [x] Add task to tasks/README.md index

## Rollout

✅ **Complete** - All scripts and docs in place. Tunnel tested and working.

Public URL: <https://arythmical-chanel-organographic.ngrok-free.dev>
