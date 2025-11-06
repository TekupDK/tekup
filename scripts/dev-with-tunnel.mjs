#!/usr/bin/env node
// Start dev server and ngrok tunnel concurrently
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const isWindows = process.platform === "win32";

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(prefix, color, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

// Try to detect if a dev server is already running on a known port
async function isServerUp() {
  const port = await detectDevPort();
  return Boolean(port);
}

let devServer = null;

async function startDevServerIfNeeded() {
  const alreadyUp = await isServerUp();
  if (alreadyUp) {
    log("[DEV]", colors.green, "Detected existing dev server — will reuse it");
    return;
  }

  // Start dev server
  // On Windows, prefer shell-based invocation to avoid spawn EINVAL and .cmd PATH quirks
  const devCmd = isWindows ? "pnpm" : "pnpm";
  const devArgs = ["run", "dev"];

  log("[DEV]", colors.cyan, "Starting dev server...");
  devServer = spawn(devCmd, devArgs, {
    stdio: "inherit",
    shell: isWindows, // use shell on Windows to resolve pnpm properly
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  // Handle dev server exit
  devServer.on("exit", code => {
    if (code !== 0 && code !== null) {
      log("[DEV]", colors.red, `Dev server exited with code ${code}`);
    }
    process.exit(code || 0);
  });

  devServer.on("error", err => {
    log("[DEV]", colors.red, `Failed to start dev server: ${err.message}`);
    process.exit(1);
  });
}

// Probe a port with a quick HEAD request
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

// Detect the actual dev server port (defaults to 3000, scans up to 3010)
async function detectDevPort() {
  const base = Number(process.env.PORT || 3000);
  for (let port = base; port <= base + 10; port++) {
    if (await probePort(port)) return port;
  }
  return null;
}

// Wait for server to be ready and return the detected port
async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const port = await detectDevPort();
    if (port) return port;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return 0;
}

function resolveNgrokCommand() {
  // Priority 1: explicit path via env
  const envPath = process.env.NGROK_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  // Priority 2: SKIP node_modules (npm package has spawn EINVAL issues)
  // The ngrok npm package v5.0.0-beta.2 is incompatible with CLI v3
  // We intentionally skip it to avoid "spawn EINVAL" errors

  // Priority 3: MSIX WindowsApps symlink (HIGHEST PRIORITY - verify by running)
  // Note: fs.existsSync() returns false for MSIX symlinks, so we test by running
  if (isWindows) {
    const windowsAppsNgrok = path.join(
      process.env.LOCALAPPDATA || "",
      "Microsoft",
      "WindowsApps",
      "ngrok.exe"
    );

    // Test if the MSIX symlink works by checking version
    const testResult = spawnSync(windowsAppsNgrok, ["version"], {
      encoding: "utf8",
      shell: false,
      timeout: 3000,
    });

    if (testResult.status === 0) {
      log(
        "[TUNNEL]",
        colors.green,
        `✓ Found ngrok via WindowsApps (MSIX): ${windowsAppsNgrok}`
      );
      return windowsAppsNgrok;
    }
  }

  // Priority 4: Other well-known Windows install locations
  if (isWindows) {
    const candidates = [
      // WinGet Links alias
      path.join(
        process.env.LOCALAPPDATA || "",
        "Microsoft",
        "WinGet",
        "Links",
        "ngrok.exe"
      ),
      // WinGet portable package path
      path.join(
        process.env.LOCALAPPDATA || "",
        "Microsoft",
        "WinGet",
        "Packages",
        "Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe",
        "ngrok.exe"
      ),
    ];
    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) {
        log("[TUNNEL]", colors.green, `✓ Found ngrok at: ${cand}`);
        return cand;
      }
    }
  }

  // Priority 5: global ngrok on PATH (LOWEST PRIORITY - may be outdated)
  const whichCmd = isWindows ? "where" : "which";
  const probe = spawnSync(whichCmd, ["ngrok"], {
    encoding: "utf8",
    shell: false,
  });
  if (probe.status === 0 && probe.stdout && probe.stdout.trim().length > 0) {
    const pathNgrok = probe.stdout.trim().split("\n")[0].trim();
    log(
      "[TUNNEL]",
      colors.yellow,
      `⚠ Using ngrok from PATH (may be outdated): ${pathNgrok}`
    );
    return "ngrok";
  }

  return null;
}

// Kick off dev server (or reuse existing), then start ngrok after server is ready
setTimeout(async () => {
  await startDevServerIfNeeded();

  log("[TUNNEL]", colors.yellow, "Waiting for dev server to be ready...");

  const detectedPort = await waitForServer();

  if (!detectedPort) {
    log("[TUNNEL]", colors.red, "Dev server failed to start, skipping tunnel");
    return;
  }

  log(
    "[TUNNEL]",
    colors.green,
    `Dev server ready on port ${detectedPort}! Starting ngrok tunnel...`
  );

  const ngrokCmd = resolveNgrokCommand();
  const ngrokArgs = ["http", String(detectedPort)];

  if (!ngrokCmd) {
    log(
      "[TUNNEL]",
      colors.red,
      "Could not find ngrok CLI. Install it with one of the following:"
    );
    log("[TUNNEL]", colors.yellow, " - winget install Ngrok.Ngrok   (Windows)");
    log(
      "[TUNNEL]",
      colors.yellow,
      " - choco install ngrok          (Windows w/ Chocolatey)"
    );
    log("[TUNNEL]", colors.yellow, " - brew install --cask ngrok    (macOS)");
    log(
      "[TUNNEL]",
      colors.yellow,
      " - or download from https://ngrok.com/download"
    );
    return;
  }

  log("[TUNNEL]", colors.cyan, `Using ngrok binary: ${ngrokCmd}`);

  const ngrokProcess = spawn(ngrokCmd, ngrokArgs, {
    stdio: "inherit",
    shell: false,
  });

  ngrokProcess.on("error", err => {
    log("[TUNNEL]", colors.red, `Failed to start ngrok: ${err.message}`);
    if (isWindows) {
      const localExe = path.join(
        process.cwd(),
        "node_modules",
        "ngrok",
        "bin",
        "ngrok.exe"
      );
      if (!fs.existsSync(localExe)) {
        log(
          "[TUNNEL]",
          colors.yellow,
          "Detected local ngrok shim without binary. Install ngrok system-wide or set NGROK_PATH."
        );
      }
    }
  });

  // Handle ngrok exit
  ngrokProcess.on("exit", code => {
    if (code !== 0 && code !== null) {
      log("[TUNNEL]", colors.red, `ngrok exited with code ${code}`);
    }
  });

  // Cleanup on exit
  const cleanup = () => {
    log("[CLEANUP]", colors.yellow, "Stopping processes...");
    try {
      ngrokProcess.kill();
    } catch {}
    try {
      if (devServer) devServer.kill();
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}, 2000);

// If we didn't start the dev server here, we won't attach exit handlers.
