# AI Review Session Checklist (ChatGPT / Claude)

Use this checklist to run a quick external AI review of the local app.

## Prerequisites

### Option 1: Separat (Recommended)

**Terminal 1:**

```bash
pnpm run dev
```

**Terminal 2 (når server er klar):**

```bash
ngrok http 3000
```

✅ Hurtigere, mere fleksibelt, sikrere

### Option 2: Automatisk (convenience)

```bash
pnpm run dev:tunnel
```

Starter både dev server og ngrok tunnel automatisk.

⚠️ Langsommere startup, mindre fleksibelt

### Option 3: Manuel med scripts

- Dev server running at `http://localhost:3000` (use VS Code task: Start Dev Server)
- Public tunnel started:
  - Quick: `pnpm run tunnel:lt`
  - Or: `pnpm run tunnel:ngrok` (requires NGROK_AUTHTOKEN)
  - Or: `ngrok http 3000` (if installed globally)
- Copy the public URL from terminal or `tmp/tunnel-url.txt`

## Share with the AI tool

- Paste the public URL into ChatGPT or Claude (tools/browse must be enabled)
- Brief context to send:
  - Product name: Tekup AI v2
  - Goal of the session: quick UX and functionality sanity check
  - Areas to focus on (choose 2–3): navigation, forms, performance, errors, accessibility

### Suggested prompt

```text
Please open this URL and explore for 5–10 minutes: <PUBLIC_URL>
- Note broken links, console errors, and layout issues
- Attempt a simple user flow (e.g., login, create a record, filter, etc.)
- Suggest top 5 improvements (UX, performance, accessibility)
- Provide screenshots if possible
```

## Live Updates (HMR)

✅ **Yes, changes are visible in real-time!**

- Dev server runs with Vite HMR (Hot Module Replacement)
- File changes trigger automatic browser updates
- Both frontend (React) and backend (tsx watch) reload on changes
- AI tool will see updates without manual refresh (if browser supports HMR websockets through tunnel)

**How it works:**

1. You edit a file (e.g., `client/src/components/Dashboard.tsx`)
2. Vite detects the change and triggers HMR
3. Browser connected through ngrok receives the update via websocket
4. Component re-renders automatically
5. ChatGPT/Claude sees the new version immediately

**Note:** HMR websocket connections work through ngrok, so live updates should propagate. If HMR fails through the tunnel, the AI tool can manually refresh the page to see changes.

## Notes about auth

- External tools do not have your local cookies or accounts. If the app needs login, provide a temporary demo route or shared credentials.
- Avoid exposing real production data. This is for dev/testing only.

## Wrap-up

- Save the findings (copy/paste into repo docs or issues)
- Stop the tunnel when done (Ctrl+C in the tunnel terminal)
- Optional: commit any follow-up tasks in `tasks/` or create GitHub issues
