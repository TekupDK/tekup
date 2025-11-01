import "dotenv/config";
import express from "express";
import cors from "cors";
import * as Gmail from "./google/gmail";
import * as Cal from "./google/calendar";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// Gmail endpoints (stubs – to be wired to Google APIs)
app.post("/gmail/search", async (req, res) => {
  try {
    const { query, q, maxResults, readMask } = req.body || {};
    // Support both 'query' and 'q' parameters, and also 'filter' for Shortwave.ai compatibility
    const searchQuery = query || q || req.body.filter || "";
    const threads = await Gmail.searchThreads(
      String(searchQuery || ""), 
      Number(maxResults || 25),
      readMask || undefined
    );
    res.json({ threads });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "gmail.search error" });
  }
});
app.post("/gmail/getThread", async (req, res) => {
  try {
    const { threadId } = req.body || {};
    const thread = await Gmail.getThread(String(threadId));
    res.json(thread);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "gmail.getThread error" });
  }
});
app.post("/gmail/sendReply", async (req, res) => {
  try {
    const { threadId, body, to, subject } = req.body || {};
    const result = await Gmail.sendReply({ threadId: String(threadId), body: String(body || ""), to, subject });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "gmail.sendReply error" });
  }
});
app.post("/gmail/applyLabels", async (req, res) => {
  try {
    const { threadId, add, remove } = req.body || {};
    const result = await Gmail.applyLabels({ threadId: String(threadId), add: add || [], remove: remove || [] });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "gmail.applyLabels error" });
  }
});

// Calendar endpoints (stubs)
app.post("/calendar/createEvent", async (req, res) => {
  try {
    const { summary, description, start, end, location } = req.body || {};
    const evt = await Cal.createEvent({ summary, description, start, end, location });
    res.json(evt);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "calendar.createEvent error" });
  }
});
app.post("/calendar/checkConflicts", async (req, res) => {
  try {
    const { start, end } = req.body || {};
    const fb = await Cal.checkConflicts({ start, end });
    res.json(fb);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "calendar.checkConflicts error" });
  }
});
app.post("/calendar/events", async (req, res) => {
  try {
    const { start, end } = req.body || {};
    const events = await Cal.getEvents({ start, end });
    res.json({ events });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "calendar.events error" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3010;
app.listen(PORT, () => console.log(`Google MCP listening on :${PORT}`));


