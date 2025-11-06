# Expose localhost:3000 via a public URL

This guide shows the fastest options to make your local dev site reachable from ChatGPT/Claude tools for reviews and live testing.

## ⭐ Recommended: Auto-start Dev + Tunnel

The easiest way to get started:

```bash
pnpm run dev:tunnel
```

This automatically:

- Starts the dev server (or reuses existing)
- Waits for server to be ready
- Launches ngrok tunnel pointing to your dev server
- Prints the public URL

## Alternative: Manual Scripts

If you prefer manual control, we provide these scripts:

- LocalTunnel (quick, no account): `pnpm run tunnel:lt`
- ngrok CLI (stable, recommended): Run `ngrok http 3000` directly
- ⚠️ DEPRECATED: `pnpm run tunnel:ngrok` (npm package has compatibility issues)

All scripts print a public URL and save it to `tmp/tunnel-url.txt`.

## 1) LocalTunnel (recommended for quick sharing)

Pros:

- No account or signup
- Simple and fast

Cons:

- URL may change and can be slower/less reliable at peak times

Run:

```bash
pnpm run tunnel:lt
```

Optional env vars:

- `PORT=3000` (defaults to 3000)
- `LT_SUBDOMAIN=my-preferred-subdomain` (may not always be available)

## 2) ngrok (recommended for reliability)

Pros:

- More robust/stable
- Better performance
- Integrated in `dev:tunnel` for best experience

Cons:

- Requires an ngrok account + auth token

**Recommended approach:**

```bash
# Install ngrok CLI (Windows)
winget install Ngrok.Ngrok

# Authenticate (one-time setup)
ngrok config add-authtoken <your-token>

# Use with dev:tunnel (automatic)
pnpm run dev:tunnel

# Or run ngrok CLI directly
ngrok http 3000
```

**⚠️ DEPRECATED:** The `pnpm run tunnel:ngrok` command (using npm package) is deprecated due to compatibility issues with ngrok CLI v3. Use `dev:tunnel` or ngrok CLI directly instead.

## 3) Cloudflare Tunnel (alternative)

Cloudflare Tunnel is excellent for production-grade stability but requires installing `cloudflared` and connecting to a Cloudflare account. If you want this, add it later (see Cloudflare docs) — our quick scripts above are enough for AI tooling sessions.

## Using with ChatGPT / Claude

- Share the printed https URL (e.g., `https://abcd-1234.loca.lt` or `https://xxxx.ngrok-free.app`).
- Keep the tunnel process running as long as you need external access.
- If the app requires login, external tools won’t have your local cookies. Consider using a dev/demo login path if available. You can also temporarily allow a demo route for reviews.

## Where to find the URL again

The scripts also write the current URL to:

```text
tmp/tunnel-url.txt
```

## Troubleshooting

- If the URL doesn’t open, ensure the dev server is running on `http://localhost:3000`.
- Firewalls/VPNs can block tunnels; try pausing or switching networks.
- If LocalTunnel is unstable, use ngrok.
