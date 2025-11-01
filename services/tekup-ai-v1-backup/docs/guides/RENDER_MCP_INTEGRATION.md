# Render MCP Server Integration

## 🎯 Overview

The Render Model Context Protocol (MCP) Server enables managing RenOS infrastructure on Render.com directly from AI-powered development tools like GitHub Copilot, Cursor, and Claude. This allows you to use natural language prompts to deploy, monitor, and manage production services without leaving your IDE.

## 🔧 What Can You Do?

### Service Management

- **Create services**: `"Deploy a new web service from this repository"`
- **List services**: `"Show all my Render services"`
- **View details**: `"What's the status of the tekup-renos service?"`
- **Update config**: `"Add DATABASE_URL to my service environment variables"`

### Database Operations

- **Create databases**: `"Create a new Postgres database named user-db with 5 GB storage"`
- **Query data**: `"Using my Render database, show me the top 5 customers by lead count"`
- **Analyze**: `"Query my read replica for daily signup counts for the last 30 days"`

### Monitoring & Troubleshooting

- **Metrics**: `"What was the busiest traffic day for my service this month?"`
- **Logs**: `"Pull the most recent error-level logs for my API service"`
- **Deploy history**: `"Show the last 5 deploys and their status"`
- **Debug**: `"Why isn't my site at rendetalje.onrender.com working?"`

### Deployment Analysis

- **Performance**: `"What did my service's autoscaling behavior look like yesterday?"`
- **Availability**: `"Show me any downtime incidents from the past week"`
- **Resource usage**: `"What's my current CPU and memory usage?"`

## 🚀 Setup Instructions

### Step 1: Create Render API Key

1. Go to your [Render Account Settings](https://dashboard.render.com/account/api-keys)
2. Click "Create API Key"
3. Give it a descriptive name (e.g., "MCP Integration - GitHub Copilot")
4. **IMPORTANT**: Save this key securely - you won't see it again!

⚠️ **Security Note**: Render API keys are broadly scoped and grant access to all workspaces and services. The MCP server can modify environment variables but cannot delete services.

### Step 2: Configure GitHub Copilot (VS Code)

Since GitHub Copilot in VS Code supports MCP servers, you'll need to configure it in your VS Code settings or MCP configuration file.

**For VS Code with GitHub Copilot Chat:**

Create or edit your MCP configuration file (location may vary by VS Code version):

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative: Using Cursor** (if you switch to Cursor for MCP features):

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY_HERE"
      }
    }
  }
}
```

### Step 3: Set Your Workspace

After configuration, set your active Render workspace:

```
"Set my Render workspace to [YOUR_WORKSPACE_NAME]"
```

For RenOS, this would be:
```
"Set my Render workspace to rendetalje"
```

## 📋 Common Use Cases for RenOS

### Deployment Management

```
"Show me the status of tekup-renos and tekup-renos-frontend services"
"What was the last deploy time for both services?"
"Are there any failed deploys in the past 24 hours?"
```

### Environment Variables

```
"List all environment variables for tekup-renos service"
"Add GEMINI_KEY=<value> to tekup-renos environment"
"What's the current RUN_MODE setting?"
```

### Database Monitoring

```
"Show me connection count for the rendetalje-db database"
"Query the database for customers created this week"
"What's the current storage usage of our database?"
```

### Performance Analysis

```
"Show me response times for the past 24 hours"
"What were the top 5 slowest endpoints yesterday?"
"Are there any 5xx errors in the logs?"
```

### Troubleshooting Production Issues

```
"Pull error logs from the last hour"
"Why is my health check failing?"
"Show me any database connection errors"
"What's causing the high memory usage?"
```

## 🔒 Security Best Practices

### API Key Management

1. **Never commit API keys**: Add to `.gitignore` if storing locally
2. **Use environment variables**: Store in secure password manager
3. **Rotate regularly**: Create new keys every 90 days
4. **Audit access**: Review API key usage in Render dashboard

### Permissions

The MCP server can:

- ✅ Read service details and logs
- ✅ Create new services and databases
- ✅ Update environment variables
- ❌ Delete services or databases
- ❌ Modify scaling settings directly

### Safe Practices

- Always **review** suggested changes before confirming
- Use **dry-run** commands when available
- **Verify** database queries before execution (read-only by default)
- **Monitor** MCP activity in Render audit logs

## 🛠️ Supported Render Resources

| Resource Type | Create | Read | Update | Delete |
|--------------|--------|------|--------|--------|
| Web Services | ✅ | ✅ | ⚠️* | ❌ |
| Static Sites | ✅ | ✅ | ⚠️* | ❌ |
| Postgres DB | ✅ | ✅ | ❌ | ❌ |
| Redis/KV | ✅ | ✅ | ❌ | ❌ |
| Private Services | ❌ | ✅ | ❌ | ❌ |
| Cron Jobs | ❌ | ✅ | ❌ | ❌ |

⚠️ *Only environment variables can be updated

## 📊 Available Metrics

### Service Metrics

- CPU usage (percentage)
- Memory usage (MB/GB)
- Instance count
- Response counts by status code (2xx, 4xx, 5xx)
- Response times (requires Professional workspace)
- Outbound bandwidth

### Database Metrics

- Connection count
- Storage usage
- Query performance (via SQL queries)
- Backup status

## 💡 Example Workflows

### Deploy New Feature

```
User: "Create a preview environment for feature/new-booking-flow"
MCP: [Creates new service with branch deployment]

User: "Show me the URL for this preview"
MCP: [Returns preview URL]

User: "Check if it's deployed successfully"
MCP: [Shows deploy status and logs]
```

### Debug Production Issue

```
User: "Pull error logs from the last 30 minutes"
MCP: [Shows filtered error logs]

User: "How many 5xx errors did we have?"
MCP: [Queries metrics and returns count]

User: "Show me the environment variables for DATABASE_URL"
MCP: [Shows database connection config]
```

### Performance Analysis

```
User: "What was our peak traffic time yesterday?"
MCP: [Analyzes metrics and identifies peak]

User: "Did we autoscale during that period?"
MCP: [Shows instance count changes]

User: "What was the average response time?"
MCP: [Calculates and returns stats]
```

## 🚫 Limitations

### Current Limitations

1. **No free tier creation**: Cannot create free instances via MCP
2. **Limited service types**: No private services, background workers, or cron jobs (yet)
3. **No deletion**: Cannot delete services or databases
4. **No scaling control**: Cannot modify autoscaling settings
5. **Read-only SQL**: Database queries are read-only by default

### Workarounds

- **For deletions**: Use Render Dashboard or REST API
- **For advanced config**: Edit render.yaml and deploy via Git
- **For write operations**: Use application API endpoints

## 📚 Additional Resources

- [Render MCP Server Documentation](https://docs.render.com/mcp)
- [Render REST API Reference](https://api-docs.render.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Render Dashboard](https://dashboard.render.com/)

## 🔄 Integration with RenOS Workflows

### Pre-Deployment Checks

```
# Before deploying
"Check if tekup-renos is currently healthy"
"Show me any pending environment variable changes"
"What's the current database connection count?"
```

### Post-Deployment Validation

```
# After deployment
"Verify the latest deploy succeeded"
"Check error rates for the past 10 minutes"
"Are there any health check failures?"
```

### Routine Monitoring

```
# Daily/weekly checks
"Show me this week's deploy history"
"What's our average uptime this month?"
"Are there any performance regressions?"
```

## 🎯 Quick Reference Commands

```powershell
# Check MCP configuration
Get-Content ~/.cursor/mcp.json  # For Cursor
# (VS Code location may vary)

# Verify Render API key
curl.exe -H "Authorization: Bearer YOUR_API_KEY" https://api.render.com/v1/owners

# Test MCP connection (in IDE)
"List my Render services"

# Common troubleshooting
"Show me the last 50 log lines"
"What's my current resource usage?"
"Are there any active incidents?"
```

---

**Last Updated**: October 7, 2025
**Status**: ✅ Ready for use (setup required)
**Maintainer**: RenOS DevOps Team
