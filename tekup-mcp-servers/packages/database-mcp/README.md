# Database MCP Server

A Model Context Protocol (MCP) server providing safe database access and introspection for Tekup's Supabase databases.

## Purpose

This server enables AI assistants to safely query and analyze your Supabase databases without risk of data mutation. All operations are read-only by design.

## Tools

### 1. `query_database`
Execute read-only SQL queries against Supabase.

**Input:**
- `query` (string, required): SELECT query to execute
- `useAdmin` (boolean, optional): Use service role key to bypass RLS (default: false)

**Example:**
```json
{
  "query": "SELECT id, email, created_at FROM users WHERE role = 'admin' LIMIT 10"
}
```

**Safety:** Only SELECT queries allowed. INSERT, UPDATE, DELETE automatically rejected.

### 2. `get_schema`
Get complete database schema including all tables and columns.

**Returns:** Full schema with table structures, column types, and row counts.

### 3. `get_table_info`
Get detailed information about a specific table.

**Input:**
- `tableName` (string, required): Name of table to inspect

**Example:**
```json
{
  "tableName": "users"
}
```

**Returns:** Columns, types, row count, and sample data (first 5 rows).

### 4. `list_tables`
List all tables in the public schema.

**Returns:** Array of table names.

### 5. `analyze_query_performance`
Analyze query execution plan and performance.

**Input:**
- `query` (string, required): Query to analyze

**Example:**
```json
{
  "query": "SELECT * FROM users WHERE email LIKE '%@tekup.dk'"
}
```

**Returns:** PostgreSQL EXPLAIN ANALYZE output with execution plan.

## Environment Variables

### Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon/public key (respects RLS)

### Optional
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin queries (bypasses RLS)

## Security Features

✅ **Read-Only:** All mutations (INSERT, UPDATE, DELETE, etc.) are blocked  
✅ **RLS Respected:** By default uses anon key which respects Row Level Security  
✅ **Admin Mode:** Optional service role key for admin queries  
✅ **SQL Injection Protection:** Queries executed through Supabase client  
✅ **Query Validation:** All queries validated before execution

## Configuration

Add to your MCP client configuration:

```json
{
  "database": {
    "command": "node",
    "args": [
      "C:\\Users\\empir\\Tekup\\tekup-mcp-servers\\packages\\database-mcp\\dist\\index.js"
    ],
    "env": {
      "SUPABASE_URL": "${SUPABASE_URL}",
      "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
      "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
    }
  }
}
```

## Use Cases

### 1. Database Exploration
"Show me all tables in the database"
```typescript
list_tables()
```

### 2. Schema Analysis
"What's the structure of the users table?"
```typescript
get_table_info({ tableName: "users" })
```

### 3. Data Queries
"Find all active subscriptions"
```typescript
query_database({ query: "SELECT * FROM subscriptions WHERE status = 'active'" })
```

### 4. Performance Debugging
"Why is this query slow?"
```typescript
analyze_query_performance({ query: "SELECT * FROM orders WHERE date > '2025-01-01'" })
```

### 5. Admin Queries
"Get all users (bypassing RLS)"
```typescript
query_database({ query: "SELECT * FROM users", useAdmin: true })
```

## Technical Details

- **Database:** PostgreSQL via Supabase
- **Client:** @supabase/supabase-js v2
- **Safety:** Read-only enforcement at application level
- **RLS:** Respects Supabase Row Level Security policies
- **Performance:** Direct PostgREST API calls

## Required Supabase Setup

For `query_database` and `analyze_query_performance` to work with raw SQL, you need to create an RPC function in Supabase:

```sql
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
```

Alternatively, use `get_table_info`, `get_schema`, and `list_tables` which work without this function.

## Limitations

- **No Mutations:** Cannot INSERT, UPDATE, or DELETE data
- **RPC Function:** Some features require `exec_sql` function in Supabase
- **Performance:** Large result sets may be slow
- **Schema Only:** Currently supports public schema only

## Future Enhancements

- [ ] Support for other database schemas
- [ ] Query result caching
- [ ] Prisma schema integration
- [ ] Migration status checking
- [ ] Database metrics and health monitoring
- [ ] Backup status checking

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type check
pnpm typecheck
```
