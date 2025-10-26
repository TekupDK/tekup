#!/usr/bin/env node
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const pkgDir = path.resolve(__dirname, "..");
const outDir = path.join(pkgDir, "test-output");
fs.mkdirSync(outDir, { recursive: true });

const rawListPath = path.join(outDir, "list-tools.raw.jsonl");
const parsedListPath = path.join(outDir, "list-tools.parsed.json");
const rawCallPath = path.join(outDir, "call-search.raw.jsonl");
const resultsPath = path.join(outDir, "call-search.results.json");

function resetFile(p) { try { fs.unlinkSync(p); } catch {} }
resetFile(rawListPath);
resetFile(parsedListPath);
resetFile(rawCallPath);
resetFile(resultsPath);

const envRoot = process.env.KNOWLEDGE_SEARCH_ROOT;
if (!envRoot) {
  console.error("KNOWLEDGE_SEARCH_ROOT is not set. Provide it via environment at runtime (e.g., Windows CMD: set KNOWLEDGE_SEARCH_ROOT=C:\\Users\\empir\\Documents && pnpm ...).");
  process.exit(1);
}

const child = spawn(process.execPath, ["./dist/index.js"], {
  cwd: pkgDir,
  stdio: ["pipe", "pipe", "pipe"],
  env: process.env,
});

let currentRawStream = fs.createWriteStream(rawListPath, { flags: "a" });
const callRawStream = fs.createWriteStream(rawCallPath, { flags: "a" });

let buffer = Buffer.alloc(0);
let listResolved = false;
let callResolved = false;
let initResolved = false;

const timers = new Set();
function setTimeoutOrFail(ms, label) {
  const t = setTimeout(() => {
    console.error(`Timeout waiting for ${label} after ${ms}ms`);
    try { child.kill(); } catch {}
    process.exit(1);
  }, ms);
  timers.add(t);
  return t;
}
function cancelAllTimers() { for (const t of timers) clearTimeout(t); timers.clear(); }
function startTimer(label) { cancelAllTimers(); setTimeoutOrFail(20000, label); }

function writeMessage(obj) {
  const json = JSON.stringify(obj);
  const header = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n`;
  child.stdin.write(header);
  child.stdin.write(json);
}

function handleMessage(msg) {
  if (msg && msg.id === 1) {
    initResolved = true;
    sendInitializedNotification();
    startTimer("tools/list response");
    setTimeout(() => { try { sendList(); } catch {} }, 10);
    return;
  }
  if (msg && msg.id === 2) {
    listResolved = true;
    const tools = (msg.result && msg.result.tools) || [];
    const names = tools.map((t) => t && t.name).filter(Boolean);
    if (!names.includes("search_knowledge")) {
      fs.writeFileSync(parsedListPath, JSON.stringify({ error: "search_knowledge not found", tools }, null, 2));
      console.error("Assertion failed: search_knowledge not in tools");
      cleanupAndExit(1);
      return;
    }
    fs.writeFileSync(parsedListPath, JSON.stringify(tools, null, 2));
    try { currentRawStream.end(); } catch {}
    currentRawStream = callRawStream;
    startTimer("tools/call response");
    sendCall();
    return;
  }
  if (msg && msg.id === 3) {
    callResolved = true;
    const contents = (msg.result && msg.result.content) || [];
    const textItem = contents.find((c) => c && c.type === "text" && typeof c.text === "string");
    if (!textItem) {
      fs.writeFileSync(resultsPath, JSON.stringify({ error: "No text content in result", contents }, null, 2));
      console.error("Assertion failed: No text content in tool call result");
      cleanupAndExit(1);
      return;
    }
    let parsed;
    try { parsed = JSON.parse(textItem.text); } catch {
      parsed = { rawText: textItem.text };
    }
    fs.writeFileSync(resultsPath, JSON.stringify(parsed, null, 2));
    cleanupAndExit(0);
    return;
  }
}

function tryParseMessages() {
  while (true) {
    if (buffer.length === 0) return;
    const s = buffer.toString("utf8");

    // Find header terminator: support both CRLFCRLF and LFLF
    let headerEnd = s.indexOf("\r\n\r\n");
    let sepLen = 4;
    if (headerEnd === -1) {
      const lfOnly = s.indexOf("\n\n");
      if (lfOnly === -1) return;
      headerEnd = lfOnly;
      sepLen = 2;
    }

    const header = s.slice(0, headerEnd);
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      console.error("Malformed header: missing Content-Length");
      process.exit(1);
    }
    const len = parseInt(m[1], 10);
    const total = headerEnd + sepLen + len;
    if (buffer.length < total) return;

    const bodyBuf = buffer.slice(headerEnd + sepLen, total);
    buffer = buffer.slice(total);
    const bodyStr = bodyBuf.toString("utf8");

    try {
      currentRawStream.write(header);
      currentRawStream.write(sepLen === 4 ? "\r\n\r\n" : "\n\n");
      currentRawStream.write(bodyStr);
      currentRawStream.write("\n");
    } catch {}

    let obj;
    try { obj = JSON.parse(bodyStr); } catch (e) {
      console.error("Failed to parse JSON body:", e);
      process.exit(1);
    }
    handleMessage(obj);
  }
}

function sendInitialize() {
  const msg = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-10-07",
      capabilities: { tools: {} },
      clientInfo: { name: "jsonrpc-test", version: "1.0.0" }
    }
  };
  writeMessage(msg);
}

function sendInitializedNotification() {
  const msg = {
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {}
  };
  writeMessage(msg);
}

function sendList() {
  const msg = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };
  writeMessage(msg);
}

function sendCall() {
  const msg = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "search_knowledge",
      arguments: { query: "security audit", limit: 3 }
    }
  };
  writeMessage(msg);
}

child.on("error", (err) => {
  console.error("Failed to spawn child:", err);
  process.exit(1);
});

child.stderr.on("data", (d) => {
  const s = d.toString();
  process.stderr.write(s);
});

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  tryParseMessages();
});

child.on("exit", (code) => {
  if (!(listResolved && callResolved)) {
    console.error("Child exited before completing tests. Exit code:", code);
    cleanupAndExit(1, false);
  }
});

function cleanupAndExit(code, kill = true) {
  cancelAllTimers();
  try { currentRawStream.end(); } catch {}
  try { callRawStream.end(); } catch {}
  if (kill && child && child.pid) {
    try { child.stdin.end(); } catch {}
    try { child.kill(); } catch {}
  }
  process.exit(code);
}

process.on("SIGINT", () => cleanupAndExit(1));
process.on("SIGTERM", () => cleanupAndExit(1));

startTimer("initialize response");
sendInitialize();