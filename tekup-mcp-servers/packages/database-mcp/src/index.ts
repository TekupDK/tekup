/**
 * Database MCP Server - Supabase and Prisma integration for Tekup
 * 
 * Features:
 * - query_database: Execute safe read queries
 * - get_schema: Inspect database schema
 * - get_table_info: Get detailed table information
 * - check_migrations: Check Prisma migration status
 * - analyze_query_performance: Analyze query execution plans
 */

import dotenv from "dotenv";
import * as path from "path";

// Load .env from parent directory (tekup-mcp-servers root)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY");
  process.exit(1);
}

// Initialize Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
  : null;

// Input schemas
const QueryDatabaseSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  useAdmin: z.boolean().optional().default(false).describe("Use service role key (admin) instead of anon key"),
});

const GetTableInfoSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
});

const AnalyzeQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

// Utility functions
function isReadOnlyQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  
  // Allow only SELECT queries and explain/analyze
  if (normalized.startsWith("select") || 
      normalized.startsWith("explain") || 
      normalized.startsWith("with")) {
    return true;
  }
  
  // Block any mutations
  const dangerousKeywords = ["insert", "update", "delete", "drop", "alter", "create", "truncate", "grant", "revoke"];
  for (const keyword of dangerousKeywords) {
    if (normalized.includes(keyword)) {
      return false;
    }
  }
  
  return normalized.startsWith("select");
}

async function getTableSchema(supabase: SupabaseClient, tableName: string) {
  // Query information_schema to get table structure
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type, is_nullable, column_default")
    .eq("table_name", tableName)
    .order("ordinal_position");
  
  if (error) {
    throw new Error(`Failed to get schema for table ${tableName}: ${error.message}`);
  }
  
  return data;
}

async function getTableRowCount(supabase: SupabaseClient, tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  
  if (error) {
    console.error(`Failed to get row count for ${tableName}:`, error);
    return -1;
  }
  
  return count || 0;
}

async function listAllTables(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .order("table_name");
  
  if (error) {
    throw new Error(`Failed to list tables: ${error.message}`);
  }
  
  return data?.map((row: any) => row.table_name) || [];
}

// MCP Server setup
const server = new Server(
  {
    name: "tekup-database",
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
        name: "query_database",
        description: "Execute a read-only SQL query against the Supabase database. Only SELECT queries are allowed for safety.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL SELECT query to execute (read-only)",
            },
            useAdmin: {
              type: "boolean",
              description: "Use service role key (bypasses RLS) - only use when necessary",
              default: false,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_schema",
        description: "Get the complete database schema including all tables and their columns.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_table_info",
        description: "Get detailed information about a specific table including columns, types, and row count.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "Name of the table to inspect",
            },
          },
          required: ["tableName"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the public schema.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "analyze_query_performance",
        description: "Analyze a query's execution plan to understand performance characteristics.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL query to analyze (will be prefixed with EXPLAIN ANALYZE)",
            },
          },
          required: ["query"],
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
      case "query_database": {
        const { query, useAdmin } = QueryDatabaseSchema.parse(args);
        
        // Validate read-only
        if (!isReadOnlyQuery(query)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Only read-only SELECT queries are allowed. Mutations (INSERT, UPDATE, DELETE, etc.) are not permitted via MCP for safety.",
              },
            ],
            isError: true,
          };
        }
        
        // Choose client
        const client = useAdmin && supabaseAdmin ? supabaseAdmin : supabaseAnon;
        
        if (useAdmin && !supabaseAdmin) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable to use admin mode.",
              },
            ],
            isError: true,
          };
        }
        
        // Execute query via RPC (Supabase SQL function)
        const { data, error } = await client.rpc("exec_sql", { sql_query: query });
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Query error: ${error.message}\n\nNote: You may need to create the exec_sql function in Supabase. Alternatively, use get_table_info or list_tables for schema inspection.`,
              },
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ query, results: data, rowCount: data?.length || 0 }, null, 2),
            },
          ],
        };
      }

      case "get_schema": {
        const tables = await listAllTables(supabaseAnon);
        const schema: Record<string, any> = {};
        
        for (const table of tables) {
          try {
            const columns = await getTableSchema(supabaseAnon, table);
            const rowCount = await getTableRowCount(supabaseAnon, table);
            schema[table] = { columns, rowCount };
          } catch (error) {
            schema[table] = { error: (error as Error).message };
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ database: "Supabase", tables: schema }, null, 2),
            },
          ],
        };
      }

      case "get_table_info": {
        const { tableName } = GetTableInfoSchema.parse(args);
        
        const columns = await getTableSchema(supabaseAnon, tableName);
        const rowCount = await getTableRowCount(supabaseAnon, tableName);
        
        // Sample data (first 5 rows)
        const { data: sampleData, error: sampleError } = await supabaseAnon
          .from(tableName)
          .select("*")
          .limit(5);
        
        const tableInfo = {
          tableName,
          columns,
          rowCount,
          sampleData: sampleError ? null : sampleData,
          sampleError: sampleError?.message,
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tableInfo, null, 2),
            },
          ],
        };
      }

      case "list_tables": {
        const tables = await listAllTables(supabaseAnon);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tables, count: tables.length }, null, 2),
            },
          ],
        };
      }

      case "analyze_query_performance": {
        const { query } = AnalyzeQuerySchema.parse(args);
        
        if (!isReadOnlyQuery(query)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Only SELECT queries can be analyzed.",
              },
            ],
            isError: true,
          };
        }
        
        // Prepend EXPLAIN ANALYZE
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        
        const client = supabaseAdmin || supabaseAnon;
        const { data, error } = await client.rpc("exec_sql", { sql_query: explainQuery });
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Analysis error: ${error.message}\n\nNote: Query analysis requires the exec_sql RPC function to be set up in Supabase.`,
              },
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ query, analysis: data }, null, 2),
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
  console.error("Tekup Database MCP Server running on stdio");
  console.error(`Connected to: ${SUPABASE_URL}`);
  console.error(`Admin mode: ${supabaseAdmin ? "enabled" : "disabled (anon key only)"}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
