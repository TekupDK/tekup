# Render MCP Setup Guide (Quick Start)

## 🚀 5-Minute Setup

This guide gets you using the Render MCP Server in under 5 minutes.

### Prerequisites

- GitHub Copilot or Cursor IDE installed
- Access to Render Dashboard for RenOS project
- Permission to create API keys

---

## Step 1: Get Your Render API Key (2 minutes)

1. **Open Render Dashboard**
   - Go to: <https://dashboard.render.com/account/api-keys>

2. **Create New API Key**
   - Click "Create API Key"
   - Name it: `MCP Integration - [Your Name]`
   - Click Create

3. **Save the Key Securely**
   - **COPY IT NOW** - you won't see it again!
   - Store in password manager (1Password, LastPass, etc.)
   - **DO NOT** commit to Git or share in Slack

---

## Step 2: Configure Your IDE (3 minutes)

### For GitHub Copilot (VS Code)

**Note**: Native MCP support in GitHub Copilot is evolving. If your version doesn't support MCP configuration yet, consider using Cursor (see below) or wait for full support.

**If supported**, add to your VS Code MCP configuration:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### For Cursor (Recommended for MCP Features)

1. **Create/Edit MCP Config**
   ```powershell
   # On Windows
   notepad $env:USERPROFILE\.cursor\mcp.json
   
   # On Mac/Linux
   nano ~/.cursor/mcp.json
   ```

2. **Add This Configuration**
   ```json
   {
     "mcpServers": {
       "render": {
         "url": "https://mcp.render.com/mcp",
         "headers": {
           "Authorization": "Bearer YOUR_API_KEY_HERE"
         }
       }
     }
   }
   ```

3. **Replace `YOUR_API_KEY_HERE`** with your actual API key

4. **Save and Restart Cursor**

---

## Step 3: Test It! (30 seconds)

### Set Your Workspace

In your IDE's chat/prompt area, type:

```
Set my Render workspace to rendetalje
```

### Try a Test Command

```
List my Render services
```

**Expected Result**: You should see both `tekup-renos` (backend) and `tekup-renos-frontend` listed.

---

## ✅ You're Ready

Now you can use natural language to manage Render infrastructure. Try these:

### Common Commands

```
# Check service status
"Show me the status of tekup-renos"

# View logs
"Pull the last 50 log lines from tekup-renos"

# Check database
"What's the connection count for rendetalje-db?"

# Deployment info
"When was the last deploy of tekup-renos-frontend?"

# Environment variables
"List environment variables for tekup-renos"
```

---

## 🆘 Troubleshooting

### "No MCP server configured" Error

- **Check**: MCP config file exists and has correct syntax
- **Verify**: API key is correct (no extra spaces)
- **Try**: Restart your IDE completely

### "Unauthorized" Error

- **Check**: API key is valid (go to Render dashboard)
- **Try**: Regenerate API key and update config
- **Verify**: No extra characters in the Authorization header

### "Workspace not found" Error

- **Check**: You've set the workspace with `"Set my Render workspace to rendetalje"`
- **Verify**: You have access to the `rendetalje` workspace in Render

### Commands Not Working

- **Ensure**: You're using natural language, not exact commands
- **Try**: Be more specific (e.g., "Show logs for tekup-renos from the last hour")
- **Check**: Full documentation in `docs/RENDER_MCP_INTEGRATION.md`

---

## 🔒 Security Reminders

- ⚠️ **Never commit API keys to Git**
- ⚠️ **Don't share keys in chat/email**
- ✅ **Rotate keys every 90 days**
- ✅ **Use password manager for storage**
- ✅ **Audit usage in Render dashboard**

---

## 📖 Next Steps

- Read full documentation: `docs/RENDER_MCP_INTEGRATION.md`
- Explore example prompts for common tasks
- Learn about supported operations and limitations
- Set up monitoring and alerts

---

## 💡 Pro Tips

1. **Be Specific**: Instead of "check logs", say "show error logs from the last hour"
2. **Use Service Names**: Always reference `tekup-renos` or `tekup-renos-frontend` explicitly
3. **Combine Commands**: "Show me service status and the last 5 deploys"
4. **Ask for Analysis**: "Why is response time slower than yesterday?"

---

**Need Help?** Check `docs/RENDER_MCP_INTEGRATION.md` or ask in the team Slack channel.

**Setup Time**: ~5 minutes  
**Last Updated**: October 7, 2025  
**Status**: ✅ Tested and working
