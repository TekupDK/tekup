import "dotenv/config";
import http from "http";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const PORT = 53535;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in environment.");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar",
];

const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: scopes, prompt: "consent" });

console.log("Open this URL in your browser to authorize:");
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Missing code");
    return;
  }
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const refresh = tokens.refresh_token;
    if (!refresh) throw new Error("No refresh_token received. Ensure 'prompt=consent' and offline access.");
    const envPath = path.join(process.cwd(), ".env");
    const line = `\nGOOGLE_REFRESH_TOKEN=${refresh}\n`;
    fs.appendFileSync(envPath, line, { encoding: "utf8" });
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Authorization complete. You can close this window.");
    console.log("Saved GOOGLE_REFRESH_TOKEN to .env");
  } catch (e: any) {
    console.error(e?.message || e);
    res.writeHead(500).end("Token exchange failed");
  } finally {
    setTimeout(() => server.close(), 500);
  }
});

server.listen(PORT, () => {
  console.log(`Listening for OAuth callback on http://localhost:${PORT}/oauth2callback`);
});


