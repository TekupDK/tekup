# Cursor MCP Setup for Tekup-Billy Railway

## Step 1: Generate Public Domain in Railway

1. Go to Railway Dashboard → tekup-billy service
2. Navigate to: **Settings → Networking**
3. Under **Public Networking**, click **"Generate Domain"**
4. Copy the generated domain (e.g., `tekup-billy-production-xxxxx.up.railway.app`)

## Step 2: Update MCP Configuration

Edit `C:\Users\empir\.cursor\mcp.json` and replace the placeholder:

```json
"tekup-billy": {
  "url": "https://YOUR_RAILWAY_DOMAIN/mcp",
  "transport": "streamable-http",
  "headers": {
    "X-API-Key": "${MCP_API_KEY}"
  }
}
```

Replace `YOUR_RAILWAY_DOMAIN` with your actual Railway domain (without `/mcp` - it's added automatically).

## Step 3: Set MCP_API_KEY Environment Variable

Ensure `MCP_API_KEY` is set in your environment:

```powershell
# Add to your PowerShell profile or environment
$env:MCP_API_KEY = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
```

Or add it to your system environment variables permanently.

## Step 4: Restart Cursor

After updating `mcp.json`, restart Cursor to load the new MCP configuration.

## Step 5: Test Connection

Once Cursor restarts, test that tekup-billy MCP server is accessible:
- Try using Billy tools in Cursor chat
- Check MCP server status in Cursor settings

## Current Configuration

The MCP config currently has a placeholder:
- URL: `https://REPLACE_WITH_RAILWAY_DOMAIN/mcp`
- Transport: `streamable-http`
- Authentication: `X-API-Key` header with `${MCP_API_KEY}`

**Next Action**: Generate domain in Railway and update the URL in `mcp.json`






