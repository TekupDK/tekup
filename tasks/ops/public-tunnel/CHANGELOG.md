# Public Tunnel - Changelog

## 2025-11-05 - Initial Implementation

### Added

- **npm scripts**:
  - `tunnel:lt` — starts localtunnel
  - `tunnel:ngrok` — starts ngrok

- **Scripts**:
  - `scripts/tunnel-localtunnel.mjs` — LocalTunnel starter with URL output
  - `scripts/tunnel-ngrok.mjs` — ngrok starter with URL output

- **Documentation**:
  - `tasks/EXPOSE_LOCALHOST.md` — Setup guide for all tunnel options

- **Dependencies** (devDependencies):
  - `localtunnel@^2.0.2`

### Installed

- ngrok CLI via winget on Windows
- Authenticated with authtoken
- Available globally as `ngrok` command

### Tested

- ✅ LocalTunnel: Started successfully, URL generated
- ✅ ngrok CLI: Tunnel active at <https://arythmical-chanel-organographic.ngrok-free.dev>
- ✅ Forwarding verified to `http://localhost:3000`

### Updated

- `tasks/README.md` — Added public tunnel to task index and additional guides section

## Decisions

- **Why install ngrok CLI separately?**
  - npm package had binary path issues on Windows

- **Why save URL to `tmp/tunnel-url.txt`?**
  - Easy copy/paste for scripts and tools

### 2025-11-05 - Auto-start improvements

- Updated `scripts/dev-with-tunnel.mjs` to be robust on Windows:
  - Reuse existing dev server on :3000 (don't start a duplicate)
  - Reliable ngrok binary resolution (NGROK_PATH, node_modules/.bin if binary exists, WinGet/MSIX locations, PATH)
  - Correct port detection and pass-through to `ngrok http <port>`
  - Safer cleanup and clearer logging of which ngrok executable is used
- Updated `scripts/monitor-logs.ps1` to query ngrok local API with `-Proxy $null` so proxies don't break `http://127.0.0.1:4040/api/tunnels`.
- Note: MSIX `ngrok` can't self-update (Ctrl+U) due to permissions; update via Store/Winget instead (non-blocking).

### 2025-11-05 - ngrok npm package issue identified

- **Discovered**: ngrok npm package (v5.0.0-beta.2) has compatibility issues with ngrok CLI v3
  - Error: "invalid tunnel configuration" even with correct syntax
  - Likely due to beta version not fully compatible with CLI v3 config format
- **Deprecated**: `scripts/tunnel-ngrok.mjs` marked as deprecated with warning
- **Recommended**: Use ngrok CLI directly or `dev:tunnel` (which uses CLI)
- **Updated**: `tasks/ops/public-tunnel/STATUS.md` with known issues and workarounds
- **Installed**: ngrok CLI v3.24.0 via WinGet (works perfectly)

### 2025-11-05 - Fixed spawn EINVAL and version detection

- **Fixed**: spawn EINVAL error when trying to use `node_modules/.bin/ngrok.cmd`
  - Root cause: npm package shims are incompatible with CLI v3
  - Solution: Skip npm package check entirely in `resolveNgrokCommand()`
- **Fixed**: Wrong ngrok version selected (3.3.1 instead of 3.24.0-msix)
  - Root cause: MSIX symlinks in `WindowsApps` don't work with `fs.existsSync()`
  - Solution: Verify MSIX installation by running `ngrok version` command
  - Priority order: NGROK_PATH → WindowsApps (MSIX) → WinGet paths → PATH
- **Discovered**: MSIX installations create symlinks in `%LOCALAPPDATA%\Microsoft\WindowsApps`
  - Actual binary: `C:\Program Files\WindowsApps\ngrok.ngrok_3.24.0.0_x64__1g87z0zv29zzc\ngrok.exe`
  - Symlink: `C:\Users\<user>\AppData\Local\Microsoft\WindowsApps\ngrok.exe`
  - `fs.existsSync()` returns false for symlinks, must verify by execution
- **Result**: `pnpm run dev:tunnel` now correctly uses ngrok 3.24.0-msix ✅

### 2025-11-05 - End-to-end verification complete

- **Tested**: Complete functionality verification
  - ✅ Dev server responsive at `http://localhost:3000` (Status: 200)
  - ✅ ngrok API accessible at `http://127.0.0.1:4040/api/tunnels`
  - ✅ ngrok version: `3.24.0-msix` (correct MSIX installation)
  - ✅ Public tunnel forwarding correctly to localhost:3000
  - ✅ Script uses correct binary from WindowsApps
  - ✅ No spawn errors, no version conflicts
- **Status**: Task marked as complete and verified
- **Documentation**: Updated STATUS.md with test results and completion status

### Future Enhancements (optional)

- Add Cloudflare Tunnel option for always-on demos
- Add tunnel status check script
- Add auto-restart on tunnel failure
