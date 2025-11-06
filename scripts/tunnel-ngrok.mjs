/**
 * DEPRECATED: This script uses the ngrok npm package which has compatibility issues
 * with ngrok CLI v3. The npm package (v5.0.0-beta.2) fails with "invalid tunnel configuration".
 *
 * RECOMMENDED: Use one of these instead:
 *   - `pnpm run dev:tunnel` (auto dev + tunnel via CLI)
 *   - `ngrok http 3000` (direct CLI - always works)
 *   - `pnpm run tunnel:lt` (localtunnel fallback)
 */

// Start a public tunnel using ngrok and print/write the public URL
import ngrok from "ngrok";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const port = Number(process.env.PORT || 3000);

async function main() {
  console.error(
    "⚠️  WARNING: This script is deprecated due to ngrok npm package issues."
  );
  console.error(
    "   Use `ngrok http 3000` directly or `pnpm run dev:tunnel` instead.\n"
  );

  // Use authtoken from env if provided (recommended)
  const token = process.env.NGROK_AUTHTOKEN;
  if (token) {
    try {
      await ngrok.authtoken(token);
    } catch (e) {
      console.warn(
        "[tunnel] Warning: setting ngrok authtoken failed:",
        e?.message || e
      );
    }
  }

  try {
    const url = await ngrok.connect(port);
    const note = `\n[tunnel] ngrok is running\n[tunnel] Public URL: ${url}\n[tunnel] Forwarding -> http://localhost:${port}\n[tunnel] Press Ctrl+C to stop.\n`;
    console.log(note);

    // write to tmp/tunnel-url.txt
    const outDir = path.resolve("tmp");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "tunnel-url.txt"), url, "utf8");
  } catch (err) {
    console.error("[tunnel] Failed to connect:", err?.message || err);
    console.log(
      "\n💡 Install ngrok CLI and use it directly:\n" +
        "   winget install Ngrok.Ngrok         (Windows)\n" +
        "   choco install ngrok                (Windows with Chocolatey)\n" +
        "   brew install --cask ngrok          (macOS)\n" +
        "\n   Then run: ngrok http 3000\n" +
        "   Or use: pnpm run dev:tunnel (auto-start via CLI)\n"
    );
    throw err;
  }

  // Keep alive until process is killed
  process.on("SIGINT", async () => {
    try {
      await ngrok.disconnect();
    } catch {}
    try {
      await ngrok.kill();
    } catch {}
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    try {
      await ngrok.disconnect();
    } catch {}
    try {
      await ngrok.kill();
    } catch {}
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch(err => {
  console.error("[tunnel] Failed to start ngrok:", err?.message || err);
  process.exit(1);
});
