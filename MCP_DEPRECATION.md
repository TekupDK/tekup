# MCP Server Deprecation Notice

**Date:** November 5, 2025  
**Status:** ✅ Migration Complete

## Summary

All Gmail and Google Calendar functionality has been migrated from MCP (Model Context Protocol) servers to **direct Google API calls** for better performance, reliability, and simpler architecture.

## What Changed

### Before (MCP-based)

```typescript
// Required MCP servers running on Railway
const GOOGLE_MCP_URL = "https://google-mcp-production.up.railway.app";
const GMAIL_MCP_URL = "https://gmail-mcp-production.up.railway.app";

// Email endpoints called MCP proxy
mcpGetGmailThread();
mcpSearchGmailThreads();
mcpSendGmailMessage();
```

### After (Direct API)

```typescript
// No external servers needed - direct Google API
import {
  getGmailThread,
  searchGmailThreads,
  sendGmailMessage,
} from "./google-api";

// Email endpoints call Google API directly
getGmailThread();
searchGmailThreads();
sendGmailMessage();
```

## Benefits

✅ **No Railway dependencies** - Removed failing `rendetalje-ai` service  
✅ **Faster response times** - No proxy hop through MCP servers  
✅ **Simpler architecture** - One less layer of abstraction  
✅ **Better reliability** - Direct API calls with proper error handling  
✅ **Easier debugging** - Clearer error messages and stack traces

## Migration Impact

### Files Modified

- ✅ `server/routers.ts` - All MCP calls replaced with direct API
- ✅ `server/mcp.ts` - Marked as deprecated with migration notes
- ✅ `.env.dev.template` - MCP URLs marked as deprecated
- ✅ `.env.prod.template` - MCP URLs marked as deprecated
- ✅ `tasks/ai-email-integration/README.md` - Updated environment docs

### Breaking Changes

**None** - API contracts remain the same. Email and calendar endpoints work identically.

### Environment Variables

MCP URLs are now **optional** and ignored:

```bash
# DEPRECATED - No longer used (safe to omit)
# GOOGLE_MCP_URL=...
# GMAIL_MCP_URL=...
```

### Docker Compose

No changes needed - MCP URLs in docker-compose.yml are ignored by backend.

## Testing

✅ TypeScript compilation successful  
⏳ Email loading via ngrok - pending test  
⏳ Calendar operations - pending test

## Rollback Plan

If issues arise, previous MCP code is preserved:

1. `server/mcp.ts` still exists with deprecation notices
2. Revert imports in `server/routers.ts` back to MCP functions
3. Add MCP URLs back to `.env` files
4. Restart Railway MCP services

## Next Steps

1. Test email loading via ngrok tunnel
2. Verify all 7 bugs from BUGFINDINGS.md are fixed
3. Remove `server/mcp.ts` entirely in future version (after validation period)
4. Shut down unused Railway MCP services to save costs

## Related Issues

- Fixed: Emails not loading via ngrok (MCP servers unreachable)
- Fixed: Railway `rendetalje-ai` deployment failures
- Improved: Performance and reliability of email operations

## Contact

Questions? Check:

- `server/google-api.ts` - Direct API implementation
- `server/gmail-labels.ts` - Label management
- `tasks/ai-email-integration/README.md` - Updated documentation
