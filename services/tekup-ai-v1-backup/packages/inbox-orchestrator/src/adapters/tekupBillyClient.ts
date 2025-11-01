import type { BillyAdapter, ToolResult } from "../index.js";

const BILLY_MCP_BASE = process.env.BILLY_MCP_URL || "https://tekup-billy.onrender.com";
const JSON_HEADERS = { "Content-Type": "application/json", "X-API-Key": process.env.BILLY_API_KEY || "" } as const;

async function post(path: string, body: unknown): Promise<ToolResult> {
  try {
    const res = await fetch(`${BILLY_MCP_BASE}${path}`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) });
    if (!res.ok) return { ok: false, error: `${res.status} ${res.statusText}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export const TekupBillyMcpAdapter: BillyAdapter = {
  listInvoices: (params) => post("/tools/list_invoices", params || {}),
  createInvoice: (input) => post("/tools/create_invoice", input),
  sendInvoice: (input) => post("/tools/send_invoice", input),
};


