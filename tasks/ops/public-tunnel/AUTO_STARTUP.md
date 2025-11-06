# Automatic Dev + Tunnel Startup

## Problem

Previously required manual steps:

1. Start dev server: `pnpm run dev`
2. Wait for server to be ready
3. Start ngrok tunnel: `ngrok http 3000`
4. Copy URL from ngrok output

This was tedious for frequent AI review sessions.

## Solution

Created `scripts/dev-with-tunnel.mjs` that:

1. Starts dev server automatically
2. Waits for server to be ready and auto-detects the port (uses PORT env or scans 3000–3010)
3. Automatically starts ngrok tunnel on the detected port
4. Displays both outputs in single terminal
5. Handles cleanup on exit (Ctrl+C kills both processes)

## Usage

```bash
pnpm run dev:tunnel
```

This replaces the need for:

- Running separate terminals
- Manual timing coordination
- Remembering to start both processes

## How It Works

### 1. Start Dev Server

```javascript
const devServer = spawn("pnpm", ["run", "dev"], {
  stdio: "inherit",
  shell: isWindows,
});
```

### 2. Health Check + Port Detection

```javascript
// Probe a port fast via HEAD
async function probePort(port) {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(800),
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

// Detect dev port: use PORT env or scan 3000–3010
async function detectDevPort() {
  const base = Number(process.env.PORT || 3000);
  for (let port = base; port <= base + 10; port++) {
    if (await probePort(port)) return port;
  }
  return null;
}

// Wait for server and return detected port
async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const port = await detectDevPort();
    if (port) return port;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return null;
}
```

### 3. Start ngrok

After server is ready (and the port is detected):

```javascript
const ngrokProcess = spawn("ngrok", ["http", String(detectedPort)], {
  stdio: "inherit",
  shell: isWindows,
});
```

### 4. Cleanup Handler

```javascript
const cleanup = () => {
  log("[CLEANUP]", colors.yellow, "Stopping processes...");
  ngrokProcess.kill();
  devServer.kill();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
```

## Benefits

✅ One command to start everything
✅ Automatic coordination between processes
✅ Proper cleanup on exit
✅ Colored output for easy distinction
✅ Error handling and user-friendly messages

## VS Code Task Integration

You can create a VS Code task for this:

```json
{
  "label": "Start Dev Server + Tunnel",
  "type": "npm",
  "script": "dev:tunnel",
  "isBackground": true,
  "group": {
    "kind": "build",
    "isDefault": true
  }
}
```

## Fallback

If ngrok is not installed or fails:

- Script shows clear error message
- Dev server continues running
- User can manually start tunnel later

## Output Example

```text
[DEV] Starting dev server...
[TUNNEL] Waiting for dev server to be ready...
[TUNNEL] Dev server ready! Starting ngrok tunnel...

ngrok                                                   (Ctrl+C to quit)

Session Status                online
Account                       Jonas Abde (Plan: Free)
Forwarding                    https://xxx.ngrok-free.dev -> http://localhost:<detectedPort>
```

## Requirements

- ngrok CLI installed globally (`winget install Ngrok.Ngrok`)
- ngrok authenticated (`ngrok config add-authtoken <token>`)
- Dev server typically uses port 3000; script auto-detects PORT or scans 3000–3010

## Troubleshooting

**Problem**: ngrok not found

**Solution**: Install ngrok CLI:

```powershell
winget install Ngrok.Ngrok
```

**Problem**: Server takes too long to start

**Solution**: Script waits up to 30 seconds. Adjust `maxRetries` in script if needed.

**Problem**: Want to use a different port

**Solution**: Update both:

- Server port in `.env.dev` (PORT)
- The script will auto-detect via PORT or scan 3000–3010; no manual change needed for ngrok
