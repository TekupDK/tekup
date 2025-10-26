/**
 * Knowledge MCP Server - search_knowledge tool
 * Requirements:
 * - Requires environment variable KNOWLEDGE_SEARCH_ROOT
 * - Optional env: KNOWLEDGE_FILE_GLOBS (default: "**\/*.{md,mdx,txt}")
 * - Optional env: KNOWLEDGE_MAX_FILES (default: "5000")
 * - No persistent caches; fresh disk reads on each invocation.
 */

import dotenv from "dotenv";
import * as path from "path";

// Load .env from parent directory (tekup-mcp-servers root)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fg from "fast-glob";
import { promises as fs } from "fs";
import * as fsSync from "fs";

const REQUIRED_ENV = "KNOWLEDGE_SEARCH_ROOT";
const SEARCH_ROOT = process.env[REQUIRED_ENV]?.trim();

if (!SEARCH_ROOT) {
  console.error(
    `Missing required environment variable ${REQUIRED_ENV}. Set ${REQUIRED_ENV} to the path containing your documentation.`
  );
  process.exit(1);
}

// Validate root exists and is a directory
try {
  const st = fsSync.statSync(SEARCH_ROOT);
  if (!st.isDirectory()) {
    console.error(`Environment variable ${REQUIRED_ENV} must point to a directory. Received: ${SEARCH_ROOT}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Unable to access KNOWLEDGE_SEARCH_ROOT at ${SEARCH_ROOT}: ${(err as Error).message}`);
  process.exit(1);
}

const DEFAULT_GLOBS = "**\/*.{md,mdx,txt}";
const DEFAULT_MAX_FILES = 5000;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB cap
const ALLOWED_EXTENSIONS = new Set<string>([".md", ".mdx", ".txt"]);

// Env configuration with safe defaults
const FILE_GLOBS = (process.env.KNOWLEDGE_FILE_GLOBS || DEFAULT_GLOBS)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_FILES = (() => {
  const raw = process.env.KNOWLEDGE_MAX_FILES || String(DEFAULT_MAX_FILES);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MAX_FILES;
  return Math.min(n, 100000); // absolute sanity cap
})();

// Zod schema for tool input
const SearchInputSchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters"),
  limit: z.number().int().min(1).max(20).optional(),
});

// Utility: safe relative path normalization (POSIX-like separators)
function relPath(p: string): string {
  return path.relative(SEARCH_ROOT!, p).split(path.sep).join("/");
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count++;
    idx += n.length;
  }
  return count;
}

function summarize(content: string): string {
  // First heading if present
  const heading = content.match(/^\s*#{1,6}\s+(.+?)\s*$/m);
  if (heading && heading[1]) {
    return truncate(heading[1].trim(), 120);
  }
  // First non-empty line else first 120 chars
  const lines = content.split(/\r?\n/);
  const firstNonEmpty = lines.find((l) => l.trim().length > 0);
  if (firstNonEmpty) return truncate(firstNonEmpty.trim(), 120);
  return truncate(content.replace(/\s+/g, " ").trim(), 120);
}

type Snippet = { line: number; text: string };

function scoreAndSnippets(content: string, terms: string[]): { score: number; snippets: Snippet[] } {
  const lines = content.split(/\r?\n/);
  let score = 0;
  const snippets: Snippet[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Count occurrences for scoring
    for (const t of terms) {
      if (!t) continue;
      score += countOccurrences(lower, t);
    }

    // Collect up to 3 snippet lines that contain any term
    if (snippets.length < 3 && terms.some((t) => t && lower.includes(t))) {
      snippets.push({ line: i + 1, text: truncate(line.trim(), 240) });
    }
  }

  return { score, snippets };
}

async function listCandidateFiles(): Promise<string[]> {
  const entries = await fg(FILE_GLOBS, {
    cwd: SEARCH_ROOT!,
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    dot: true,
    unique: true,
    suppressErrors: true,
    // Minimal ignores for noise reduction (safe, not hardcoded secrets)
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**", "**/.next/**", "**/.cache/**"],
  });

  const filtered = entries.filter((f) => ALLOWED_EXTENSIONS.has(path.extname(f).toLowerCase()));
  return filtered.slice(0, MAX_FILES);
}

async function readSmallTextFile(p: string): Promise<string | null> {
  try {
    const st = await fs.stat(p);
    if (st.size > MAX_FILE_SIZE_BYTES) return null; // skip large files
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

async function handleSearch(query: string, limit = 5) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  const files = await listCandidateFiles();

  const results: {
    path: string;
    score: number;
    snippets: Snippet[];
    summary: string;
  }[] = [];

  for (const absFile of files) {
    const content = await readSmallTextFile(absFile);
    if (content == null) continue;

    const { score, snippets } = scoreAndSnippets(content, terms);
    if (score <= 0) continue;

    results.push({
      path: relPath(absFile),
      score,
      snippets,
      summary: summarize(content),
    });
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, Math.max(1, Math.min(20, limit)));
}

async function main() {
  const server = new Server(
    { name: "@tekup/knowledge-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "search_knowledge") {
      const { query, limit } = SearchInputSchema.parse(args);
      const results = await handleSearch(query, limit ?? 5);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_knowledge",
          description: "Search local documentation under KNOWLEDGE_SEARCH_ROOT. Returns top matches with scores, snippets, and summaries.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query, minimum 2 characters",
                minLength: 2,
              },
              limit: {
                type: "number",
                description: "Maximum results to return (1-20, default: 5)",
                minimum: 1,
                maximum: 20,
              },
            },
            required: ["query"],
          },
        },
      ],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Knowledge MCP Server failed to start:", err);
  process.exit(1);
});