# Supabase MCP Integration Issue

**Status**: ❌ Blocked by Supabase OAuth Bug  
**Date**: October 9, 2025  
**Severity**: High - Prevents MCP integration

## Problem

Supabase's HTTP MCP server fails with OAuth validation error:

```
Error: Protected Resource Metadata resource "https://mcp.supabase.com/mcp" 
does not match MCP server resolved resource 
"https://mcp.supabase.com/mcp?project_ref=oaevagdgrasfppbrxbey&features=...". 
The MCP server must follow OAuth spec 
https://datatracker.ietf.org/doc/html/rfc9728#PRConfigurationValidation
```

## Root Cause

The Supabase MCP server violates **RFC 9728 (OAuth 2.0 Protected Resource Metadata)** section on configuration validation. When using query parameters for project configuration, the base resource URL doesn't match the resolved URL, causing the OAuth client to reject the connection.

## Your Project Details

- **Project**: RenOS By Tekup
- **Project Ref**: `oaevagdgrasfppbrxbey`
- **Project URL**: `https://oaevagdgrasfppbrxbey.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8`

## Attempted Configurations

### ❌ HTTP with Query Parameters (FAILS)
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=oaevagdgrasfppbrxbey&features=docs%2Cdatabase%2Caccount%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
    }
  }
}
```
**Error**: OAuth validation failure

### ❌ HTTP with Environment Variables (FAILS)
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_PROJECT_REF": "oaevagdgrasfppbrxbey"
      }
    }
  }
}
```
**Error**: Server doesn't read environment variables

## Workarounds

### Option 1: Use Supabase Client Libraries Directly ✅

Instead of MCP, use the official Supabase JavaScript client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oaevagdgrasfppbrxbey.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
```

Add to `.env`:
```bash
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
```

### Option 2: Wait for Supabase Fix 🕐

Monitor Supabase's GitHub issues for OAuth compliance updates:
- https://github.com/supabase/supabase/issues

### Option 3: Use Supabase CLI MCP Server (if available) 🔍

Check if there's a command-line based MCP server:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-cli", "--project-ref", "oaevagdgrasfppbrxbey"]
    }
  }
}
```

## Current Tables in Your Supabase Project

Based on the dashboard info:

1. **todos** table (demo/example data):
   - `id` (bigint)
   - `task` (text)
   - `status` (status enum: 'Not Started', 'In progress', 'Complete')
   - `user_id` (uuid, references auth.users)
   - `inserted_at` (timestamp with time zone)
   - `updated_at` (timestamp with time zone)

2. 2 other tables (not visible in screenshot)

## Recommended Action

**Use Option 1** (Supabase client libraries directly) for now. This is:
- ✅ More reliable
- ✅ Better documented
- ✅ Officially supported
- ✅ No OAuth issues
- ✅ Works with Row Level Security (RLS)

## Integration Steps

1. Install Supabase client:
   ```powershell
   npm install @supabase/supabase-js
   ```

2. Create Supabase service file:
   ```typescript
   // src/services/supabaseService.ts
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.SUPABASE_URL!
   const supabaseKey = process.env.SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

3. Use in your code:
   ```typescript
   import { supabase } from './services/supabaseService'
   
   // Query data
   const { data, error } = await supabase
     .from('your_table')
     .select('*')
   ```

## Status

- ❌ MCP integration: **BLOCKED** (waiting for Supabase OAuth fix)
- ✅ Direct integration: **AVAILABLE** (use client libraries)
- 📊 Database: **READY** (3 tables created)
- 🔐 Auth: **CONFIGURED** (anon key available)

## Next Steps

1. **Disable MCP config** (done - empty mcpServers object)
2. **Install @supabase/supabase-js** 
3. **Create environment variables**
4. **Build Supabase service layer**
5. **Monitor Supabase for MCP OAuth fixes**
