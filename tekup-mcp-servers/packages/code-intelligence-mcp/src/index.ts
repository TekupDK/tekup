/**
 * Code Intelligence MCP Server - Semantic code search and analysis for Tekup
 * 
 * Features:
 * - find_code: Search for code by description/functionality
 * - analyze_file: Get insights about a specific file
 * - find_similar_code: Find code similar to a given snippet
 * - get_file_dependencies: Analyze imports and dependencies
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fg from "fast-glob";
import * as path from "path";
import { promises as fs } from "fs";

// Environment configuration
const CODE_SEARCH_ROOT = process.env.CODE_SEARCH_ROOT || process.cwd();
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs"];

// Input schemas
const FindCodeSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters"),
  filePattern: z.string().optional().describe("Glob pattern to filter files (e.g., '**/*.ts')"),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

const AnalyzeFileSchema = z.object({
  filePath: z.string().describe("Relative or absolute path to file"),
});

const FindSimilarCodeSchema = z.object({
  codeSnippet: z.string().min(10, "Code snippet must be at least 10 characters"),
  filePattern: z.string().optional(),
  limit: z.number().int().min(1).max(10).optional().default(3),
});

type FileInfo = {
  path: string;
  score: number;
  snippets: { line: number; content: string }[];
  summary: string;
};

// Utility functions
function normalizePath(p: string): string {
  const absPath = path.isAbsolute(p) ? p : path.join(CODE_SEARCH_ROOT, p);
  return path.relative(CODE_SEARCH_ROOT, absPath);
}

async function readFile(filePath: string): Promise<string | null> {
  try {
    const fullPath = path.join(CODE_SEARCH_ROOT, filePath);
    const stats = await fs.stat(fullPath);
    if (stats.size > MAX_FILE_SIZE) return null;
    return await fs.readFile(fullPath, "utf-8");
  } catch {
    return null;
  }
}

async function findCodeFiles(pattern?: string): Promise<string[]> {
  const searchPattern = pattern || `**/*{${SUPPORTED_EXTENSIONS.join(",")}}`;
  const files = await fg(searchPattern, {
    cwd: CODE_SEARCH_ROOT,
    absolute: false,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/.next/**",
      "**/coverage/**",
    ],
  });
  return files;
}

function scoreFile(content: string, query: string): number {
  const lowerContent = content.toLowerCase();
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  let score = 0;
  for (const term of queryTerms) {
    const matches = (lowerContent.match(new RegExp(term, "gi")) || []).length;
    score += matches;
  }
  
  return score;
}

function extractSnippets(content: string, query: string, maxSnippets = 3): { line: number; content: string }[] {
  const lines = content.split("\n");
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const snippets: { line: number; content: string }[] = [];
  
  for (let i = 0; i < lines.length && snippets.length < maxSnippets; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (queryTerms.some(term => lowerLine.includes(term))) {
      snippets.push({
        line: i + 1,
        content: line.trim().slice(0, 200), // Max 200 chars per snippet
      });
    }
  }
  
  return snippets;
}

function generateFileSummary(content: string, filePath: string): string {
  const lines = content.split("\n").filter(line => line.trim().length > 0);
  const ext = path.extname(filePath);
  
  // Extract imports/requires (first 5 lines that look like imports)
  const importLines = lines.filter(line => 
    line.includes("import ") || 
    line.includes("require(") || 
    line.includes("from ")
  ).slice(0, 5);
  
  // Extract function/class names
  const declarations = lines.filter(line => 
    line.match(/^(export\s+)?(async\s+)?(function|class|const|let|var|interface|type)\s+\w+/) ||
    line.match(/^\s*(public|private|protected)?\s+(async\s+)?\w+\s*\(/)
  ).slice(0, 5);
  
  let summary = `File: ${filePath} (${ext})\n`;
  summary += `Lines: ${lines.length}\n`;
  
  if (importLines.length > 0) {
    summary += `Dependencies: ${importLines.map(l => l.trim()).join("; ")}\n`;
  }
  
  if (declarations.length > 0) {
    summary += `Key declarations: ${declarations.map(l => l.trim().slice(0, 80)).join("; ")}`;
  }
  
  return summary;
}

async function analyzeFileDependencies(filePath: string): Promise<string[]> {
  const content = await readFile(filePath);
  if (!content) return [];
  
  const dependencies: string[] = [];
  const lines = content.split("\n");
  
  for (const line of lines) {
    // ES6 imports
    const es6Match = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
    if (es6Match) dependencies.push(es6Match[1]);
    
    // CommonJS requires
    const cjsMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (cjsMatch) dependencies.push(cjsMatch[1]);
  }
  
  return [...new Set(dependencies)];
}

// MCP Server setup
const server = new Server(
  {
    name: "tekup-code-intelligence",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "find_code",
        description: "Search for code files by description or functionality. Returns relevant files with snippets.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query describing the code you're looking for",
            },
            filePattern: {
              type: "string",
              description: "Optional glob pattern to filter files (e.g., '**/*.ts' for TypeScript only)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (1-20, default: 5)",
              minimum: 1,
              maximum: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "analyze_file",
        description: "Analyze a specific file and get insights about its structure, dependencies, and key components.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Relative path to the file to analyze",
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "find_similar_code",
        description: "Find code files similar to a given code snippet. Useful for finding patterns or refactoring opportunities.",
        inputSchema: {
          type: "object",
          properties: {
            codeSnippet: {
              type: "string",
              description: "Code snippet to find similar code for",
            },
            filePattern: {
              type: "string",
              description: "Optional glob pattern to filter files",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (1-10, default: 3)",
              minimum: 1,
              maximum: 10,
            },
          },
          required: ["codeSnippet"],
        },
      },
      {
        name: "get_file_dependencies",
        description: "Analyze and list all imports/dependencies of a file.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Relative path to the file",
            },
          },
          required: ["filePath"],
        },
      },
    ],
  };
});

// Tool: call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "find_code": {
        const { query, filePattern, limit } = FindCodeSchema.parse(args);
        
        const files = await findCodeFiles(filePattern);
        const results: FileInfo[] = [];
        
        for (const file of files) {
          const content = await readFile(file);
          if (!content) continue;
          
          const score = scoreFile(content, query);
          if (score === 0) continue;
          
          const snippets = extractSnippets(content, query);
          const summary = generateFileSummary(content, file);
          
          results.push({ path: file, score, snippets, summary });
        }
        
        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results.slice(0, limit), null, 2),
            },
          ],
        };
      }

      case "analyze_file": {
        const { filePath } = AnalyzeFileSchema.parse(args);
        const normalized = normalizePath(filePath);
        
        const content = await readFile(normalized);
        if (!content) {
          return {
            content: [{ type: "text", text: `Error: Could not read file ${filePath}` }],
            isError: true,
          };
        }
        
        const summary = generateFileSummary(content, normalized);
        const dependencies = await analyzeFileDependencies(normalized);
        const lines = content.split("\n").length;
        const size = Buffer.from(content).length;
        
        const analysis = {
          path: normalized,
          lines,
          size: `${Math.round(size / 1024)} KB`,
          dependencies,
          summary,
        };
        
        return {
          content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }],
        };
      }

      case "find_similar_code": {
        const { codeSnippet, filePattern, limit } = FindSimilarCodeSchema.parse(args);
        
        const files = await findCodeFiles(filePattern);
        const results: FileInfo[] = [];
        
        for (const file of files) {
          const content = await readFile(file);
          if (!content) continue;
          
          // Simple similarity: check for similar tokens
          const snippetTokens = codeSnippet.toLowerCase().match(/\w+/g) || [];
          const score = scoreFile(content, snippetTokens.join(" "));
          
          if (score === 0) continue;
          
          const snippets = extractSnippets(content, snippetTokens.join(" "), 2);
          const summary = generateFileSummary(content, file);
          
          results.push({ path: file, score, snippets, summary });
        }
        
        results.sort((a, b) => b.score - a.score);
        
        return {
          content: [{ type: "text", text: JSON.stringify(results.slice(0, limit), null, 2) }],
        };
      }

      case "get_file_dependencies": {
        const { filePath } = AnalyzeFileSchema.parse(args);
        const normalized = normalizePath(filePath);
        
        const dependencies = await analyzeFileDependencies(normalized);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ file: normalized, dependencies }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tekup Code Intelligence MCP Server running on stdio");
  console.error(`CODE_SEARCH_ROOT: ${CODE_SEARCH_ROOT}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
