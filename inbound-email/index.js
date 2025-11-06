/*
  Minimal inbound-email SMTP server
  - Listens on SMTP ports (25, 587)
  - Parses incoming emails with mailparser
  - Stores attachments on disk (optional)
  - Sends parsed metadata to WEBHOOK_URL with optional HMAC signature
  - Exposes a simple HTTP health endpoint on 8080
*/

const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://friday-ai:3000/api/inbound/email";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local"; // local | none
const STORAGE_PATH = process.env.STORAGE_PATH || "/app/storage/attachments";
const SMTP_PORT = parseInt(process.env.PORT || "25", 10);
const SUBMISSION_PORT = parseInt(process.env.SUBMISSION_PORT || "587", 10);

function log(...args) {
  console.log("[inbound-email]", ...args);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

async function saveAttachment(baseDir, att) {
  try {
    ensureDir(baseDir);
    const safeName = att.filename
      ? att.filename.replace(/[^a-zA-Z0-9_.-]+/g, "_")
      : "attachment";
    const filePath = path.join(baseDir, `${Date.now()}_${safeName}`);
    await fs.promises.writeFile(filePath, att.content);
    return {
      path: filePath,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    };
  } catch (e) {
    log("Failed to save attachment:", e.message);
    return {
      error: e.message,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    };
  }
}

function signPayload(payloadStr) {
  if (!WEBHOOK_SECRET) return "";
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(payloadStr);
  return hmac.digest("hex");
}

async function postJson(url, bodyObj, signature) {
  const bodyStr = JSON.stringify(bodyObj);
  const headers = { "content-type": "application/json" };
  if (signature) headers["x-webhook-signature"] = signature;
  const res = await fetch(url, { method: "POST", headers, body: bodyStr });
  const text = await res.text().catch(() => "");
  return { status: res.status, ok: res.ok, text };
}

function createSmtpServer(name) {
  const server = new SMTPServer({
    disabledCommands: ["STARTTLS"], // allow plain for local network usage
    authOptional: true,
    onData(stream, session, callback) {
      let chunks = [];
      stream.on("data", d => chunks.push(d));
      stream.on("end", async () => {
        try {
          const raw = Buffer.concat(chunks);
          const mail = await simpleParser(raw);

          const messageId = mail.messageId || crypto.randomUUID();
          const receivedAt = new Date().toISOString();
          const attachments = [];

          if (STORAGE_TYPE === "local" && Array.isArray(mail.attachments)) {
            const baseDir = path.join(
              STORAGE_PATH,
              messageId.replace(/[<>]/g, "")
            );
            for (const att of mail.attachments) {
              const info = await saveAttachment(baseDir, att);
              attachments.push(info);
            }
          } else if (Array.isArray(mail.attachments)) {
            for (const att of mail.attachments) {
              attachments.push({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
              });
            }
          }

          const payload = {
            messageId,
            receivedAt,
            envelope: {
              from:
                session.envelope?.mailFrom?.address || mail.from?.text || null,
              to: (session.envelope?.rcptTo || []).map(r => r.address),
            },
            headers: Object.fromEntries(mail.headers || []),
            subject: mail.subject || "",
            from: mail.from?.text || "",
            to: mail.to?.text || "",
            cc: mail.cc?.text || "",
            text: mail.text || "",
            html: mail.html || "",
            attachments,
          };

          const bodyStr = JSON.stringify(payload);
          const signature = signPayload(bodyStr);
          const result = await postJson(WEBHOOK_URL, payload, signature);

          if (!result.ok) {
            log("Webhook responded with non-OK:", result.status, result.text);
          } else {
            log("Webhook delivered:", result.status);
          }

          callback();
        } catch (err) {
          log("Error parsing email:", err.message);
          callback(err);
        }
      });
    },
  });

  server.on("error", err => {
    log(`${name} server error:`, err.message);
  });

  return server;
}

function startHealthServer() {
  const srv = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  srv.listen(8080, () => log("Health server listening on 8080"));
}

async function main() {
  if (STORAGE_TYPE === "local") ensureDir(STORAGE_PATH);

  const smtp = createSmtpServer("SMTP");
  smtp.listen(SMTP_PORT, () => log(`SMTP server listening on ${SMTP_PORT}`));

  if (SUBMISSION_PORT && SUBMISSION_PORT !== SMTP_PORT) {
    const submission = createSmtpServer("SUBMISSION");
    submission.listen(SUBMISSION_PORT, () =>
      log(`SMTP submission server listening on ${SUBMISSION_PORT}`)
    );
  }

  startHealthServer();

  log("Configured:", {
    WEBHOOK_URL,
    STORAGE_TYPE,
    STORAGE_PATH,
    SMTP_PORT,
    SUBMISSION_PORT,
  });
}

main().catch(e => {
  log("Fatal error:", e);
  process.exit(1);
});
