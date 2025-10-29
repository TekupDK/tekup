# Knowledge MCP Server

A Model Context Protocol (MCP) server that provides a `search_knowledge` tool for searching local documentation content.

## Purpose

This server enables MCP clients to search through local documentation files (Markdown, MDX, and plain text) using a simple query interface. It performs naive frequency-based scoring of query terms and returns relevant results with snippets and summaries.

## Required Environment Variables

- `KNOWLEDGE_SEARCH_ROOT`: **Required**. Absolute or relative path to the root directory containing your documentation files. The server will exit with an error if this is not set.

## Optional Environment Variables

- `KNOWLEDGE_FILE_GLOBS`: Comma-separated glob patterns for files to search. Default: `**/*.{md,mdx,txt}`
- `KNOWLEDGE_MAX_FILES`: Maximum number of files to scan. Default: `5000`

## How to Run

1. Install dependencies in the monorepo:
   ```bash
   pnpm install
   ```

2. Build the server:
   ```bash
   pnpm -w build
   ```

3. Set the required environment variable:
   ```bash
   export KNOWLEDGE_SEARCH_ROOT=/path/to/your/docs
   ```

4. Run in development mode:
   ```bash
   pnpm -w --filter @tekup/knowledge-mcp dev
   ```

## MCP Client Configuration

Add this to your MCP client configuration (e.g., `mcp.json`):

```json
{
  "mcpServers": {
    "knowledge": {
      "command": "pnpm",
      "args": ["-w", "--filter", "@tekup/knowledge-mcp", "start"],
      "env": {
        "KNOWLEDGE_SEARCH_ROOT": "/path/to/your/documentation"
      }
    }
  }
}
```

## Tool: search_knowledge

### Input Schema

- `query` (string, required): Search query, minimum 2 characters
- `limit` (number, optional): Maximum results to return (1-20, default: 5)

### Output

Returns a JSON array of results, each containing:

- `path`: Relative path to the file from the search root
- `score`: Relevance score based on term frequency
- `snippets`: Array of up to 3 text snippets with line numbers
- `summary`: Short summary (first heading or first 120 characters)

### Example Usage

```json
{
  "query": "authentication setup",
  "limit": 10
}
```

## Security Notes

- No hardcoded paths or secrets
- Files larger than 2MB are skipped
- Only processes .md, .mdx, and .txt files
- No persistent caching; each search reads fresh from disk
- Safe file system operations with error handling
