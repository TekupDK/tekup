# Code Intelligence MCP Server

A Model Context Protocol (MCP) server that provides semantic code search and analysis capabilities for Tekup projects.

## Purpose

This server enables AI assistants to intelligently search, analyze, and understand your codebase. It's designed to help with code discovery, refactoring, and understanding project structure.

## Tools

### 1. `find_code`

Search for code files by description or functionality.

**Input:**

- `query` (string, required): Search query describing the code you're looking for
- `filePattern` (string, optional): Glob pattern to filter files (e.g., `**/*.ts` for TypeScript only)
- `limit` (number, optional): Maximum results (1-20, default: 5)

**Example:**
```json
{
  "query": "authentication middleware",
  "filePattern": "**/*.ts",
  "limit": 5
}
```

**Returns:** Array of files with relevance scores, code snippets, and summaries.

### 2. `analyze_file`

Get detailed insights about a specific file's structure, dependencies, and components.

**Input:**

- `filePath` (string, required): Relative path to the file

**Example:**
```json
{
  "filePath": "apps/backend/src/auth/middleware.ts"
}
```

**Returns:** File analysis including lines, size, dependencies, and structural summary.

### 3. `find_similar_code`

Find code files similar to a given snippet. Useful for finding patterns or refactoring opportunities.

**Input:**

- `codeSnippet` (string, required): Code snippet to find similar code for
- `filePattern` (string, optional): Glob pattern to filter files
- `limit` (number, optional): Maximum results (1-10, default: 3)

**Example:**
```json
{
  "codeSnippet": "async function getUserById(id: string) { return await db.users.findUnique({ where: { id } }); }",
  "limit": 3
}
```

**Returns:** Files with similar code patterns.

### 4. `get_file_dependencies`

Analyze and list all imports/dependencies of a file.

**Input:**

- `filePath` (string, required): Relative path to the file

**Example:**
```json
{
  "filePath": "apps/backend/src/main.ts"
}
```

**Returns:** List of all imported modules and dependencies.

## Environment Variables

### Required

- `CODE_SEARCH_ROOT`: Root directory to search for code files. Defaults to current working directory.

## Supported File Types

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- Go (`.go`)
- Rust (`.rs`)

## Configuration

Add to your MCP client configuration (e.g., `.kilocode/cli/mcp.json`):

```json
{
  "code-intelligence": {
    "command": "node",
    "args": [
      "C:\\Users\\empir\\Tekup\\tekup-mcp-servers\\packages\\code-intelligence-mcp\\dist\\index.js"
    ],
    "env": {
      "CODE_SEARCH_ROOT": "C:\\Users\\empir\\Tekup"
    }
  }
}
```

## Use Cases

### 1. Code Discovery

"Find all authentication-related middleware in the backend"
```typescript
find_code({ query: "authentication middleware", filePattern: "apps/backend/**/*.ts" })
```

### 2. Refactoring

"Find all files that use the old database connection pattern"
```typescript
find_similar_code({ codeSnippet: "const db = require('./db'); db.connect();" })
```

### 3. Understanding Dependencies

"What does the main API file depend on?"
```typescript
get_file_dependencies({ filePath: "apps/backend/src/main.ts" })
```

### 4. File Analysis

"Analyze the structure of the user service"
```typescript
analyze_file({ filePath: "apps/backend/src/services/user.service.ts" })
```

## Technical Details

- **Max file size:** 1MB (files larger than this are skipped)
- **Ignored directories:** `node_modules`, `dist`, `build`, `.git`, `.next`, `coverage`
- **Search algorithm:** Token-based frequency scoring
- **Performance:** Scans entire codebase on each query (no persistent caching)

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development mode
pnpm dev

# Type check
pnpm typecheck
```

## Security Notes

- No persistent caching - fresh reads on each invocation
- Respects file system permissions
- Only processes files in CODE_SEARCH_ROOT and subdirectories
- Automatically skips large files (>1MB)
- No execution of code - read-only operations

## Future Enhancements

- [ ] Add vector embeddings for semantic search
- [ ] Support more programming languages
- [ ] Add code complexity analysis
- [ ] Integration with git blame for code history
- [ ] Test coverage integration
- [ ] Dependency graph visualization
