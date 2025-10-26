# Render MCP Setup Checklist

## ✅ Setup Checklist for Team Members

Use this checklist to set up Render MCP Server integration on your development machine.

---

## Phase 1: Prerequisites (Before You Start)

- [ ] **IDE installed**: GitHub Copilot (VS Code) or Cursor
- [ ] **Render access**: You have access to the `rendetalje` workspace
- [ ] **Password manager**: Have 1Password, LastPass, or similar ready
- [ ] **Time required**: ~5 minutes

---

## Phase 2: Create Render API Key

- [ ] **Navigate to settings**: [https://dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
- [ ] **Create new key**: Click "Create API Key"
- [ ] **Name the key**: Use format `MCP Integration - [Your Name]`
  - Example: `MCP Integration - Jonas Abde`
- [ ] **Copy the key**: Click to reveal and copy immediately
- [ ] **Save securely**: Store in password manager (you won't see it again!)
- [ ] **Verify saved**: Confirm you can access the key from your password manager

**⚠️ IMPORTANT**: Never commit this key to Git or share in Slack!

---

## Phase 3: Configure Your IDE

### Option A: GitHub Copilot (VS Code)

- [ ] **Check MCP support**: Verify your VS Code version supports MCP configuration
- [ ] **Locate config file**: Find or create MCP configuration file
  - Location varies by VS Code version
  - May be in workspace settings or user settings
- [ ] **Add configuration**:
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
- [ ] **Replace API key**: Insert your actual API key from password manager
- [ ] **Save file**: Save and close the configuration file
- [ ] **Restart VS Code**: Completely quit and reopen VS Code

### Option B: Cursor (Recommended)

- [ ] **Create config directory**: Ensure `~/.cursor` exists
  - Windows: `%USERPROFILE%\.cursor`
  - Mac/Linux: `~/.cursor`
- [ ] **Create/edit config file**: `mcp.json` in the `.cursor` directory
- [ ] **Add configuration**:
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
- [ ] **Replace API key**: Insert your actual API key from password manager
- [ ] **Save file**: Save `mcp.json`
- [ ] **Restart Cursor**: Completely quit and reopen Cursor

---

## Phase 4: Test the Integration

- [ ] **Open RenOS project**: Open the project in your IDE
- [ ] **Set workspace**: In chat/prompt area, type:
  ```
  Set my Render workspace to rendetalje
  ```
- [ ] **Verify workspace**: Confirm you see success message
- [ ] **List services**: Type:
  ```
  List my Render services
  ```
- [ ] **Verify results**: You should see:
  - `tekup-renos` (backend)
  - `tekup-renos-frontend` (frontend)
  - `rendetalje-db` (database)
- [ ] **Test query**: Try a more complex command:
  ```
  Show status of tekup-renos and tekup-renos-frontend
  ```
- [ ] **Verify details**: Confirm you see service status, health, and deploy info

---

## Phase 5: Security Verification

- [ ] **Check Git status**: Run `git status` to ensure no API keys are staged
- [ ] **Review .gitignore**: Verify MCP config files are ignored (if applicable)
- [ ] **Test password manager**: Open password manager and find your API key
- [ ] **Set calendar reminder**: Create 90-day reminder to rotate API key
- [ ] **Document key creation**: Note the date you created the key

---

## Phase 6: Learn Common Commands

Practice these commands to familiarize yourself with MCP:

### Service Management
- [ ] **Status check**: `"Show status of tekup-renos"`
- [ ] **Deploy history**: `"When was the last deploy of tekup-renos-frontend?"`
- [ ] **Environment vars**: `"List environment variables for tekup-renos"`

### Database Operations
- [ ] **Connection count**: `"Show me connection count for rendetalje-db"`
- [ ] **Customer query**: `"Query database for customers created this week"`
- [ ] **Storage usage**: `"What's the current database storage usage?"`

### Troubleshooting
- [ ] **Error logs**: `"Pull error logs from the last hour"`
- [ ] **Health check**: `"Are there any health check failures?"`
- [ ] **Response time**: `"What's the average response time today?"`

### Performance Analysis
- [ ] **Traffic analysis**: `"What was peak traffic time yesterday?"`
- [ ] **Autoscaling**: `"Did we autoscale in the last 24 hours?"`
- [ ] **Error rate**: `"How many 5xx errors occurred today?"`

---

## Phase 7: Documentation Review

- [ ] **Read quick setup**: Review [docs/RENDER_MCP_QUICK_SETUP.md](./docs/RENDER_MCP_QUICK_SETUP.md)
- [ ] **Read full docs**: Browse [docs/RENDER_MCP_INTEGRATION.md](./docs/RENDER_MCP_INTEGRATION.md)
- [ ] **Check Copilot instructions**: Review [.github/copilot-instructions.md](./.github/copilot-instructions.md)
- [ ] **Bookmark Render docs**: Save [docs.render.com/mcp](https://docs.render.com/mcp)

---

## Troubleshooting

### Issue: "No MCP server configured"

- [ ] Verify config file exists in correct location
- [ ] Check JSON syntax (use jsonlint.com)
- [ ] Ensure no extra spaces in configuration
- [ ] Restart IDE completely (not just reload window)

### Issue: "Unauthorized" or "403 Forbidden"

- [ ] Verify API key is correct (check password manager)
- [ ] Ensure no extra characters in Authorization header
- [ ] Try regenerating API key in Render dashboard
- [ ] Confirm you have access to `rendetalje` workspace

### Issue: "Workspace not found"

- [ ] Run: `"Set my Render workspace to rendetalje"`
- [ ] Verify you have access in Render dashboard
- [ ] Check workspace name spelling
- [ ] Try listing all workspaces: `"List my Render workspaces"`

### Issue: Commands don't work

- [ ] Use natural language (not exact command syntax)
- [ ] Be specific about service names
- [ ] Try rephrasing the question
- [ ] Check MCP server status at status.render.com

---

## ✅ Final Verification

- [ ] **API key secure**: Stored only in password manager
- [ ] **MCP configured**: IDE has correct configuration
- [ ] **Workspace set**: `rendetalje` workspace is active
- [ ] **Commands work**: Successfully tested 3+ commands
- [ ] **Documentation read**: Reviewed setup and integration docs
- [ ] **Team informed**: Shared status in team chat (optional)

---

## 📊 Setup Status

**Name**: ___________________________  
**Date**: ___________________________  
**IDE**: [ ] GitHub Copilot  [ ] Cursor  [ ] Other: ___________  
**API Key Created**: [ ] Yes  [ ] No  
**Configuration Complete**: [ ] Yes  [ ] No  
**Testing Successful**: [ ] Yes  [ ] No  

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🔄 Maintenance Schedule

- [ ] **Weekly**: Test MCP commands to ensure working
- [ ] **Monthly**: Review Render audit logs for unusual activity
- [ ] **Quarterly** (90 days): Rotate API key
  1. Create new API key
  2. Update MCP configuration
  3. Test integration
  4. Revoke old API key
  5. Update password manager

---

## 🆘 Getting Help

If you encounter issues:

1. **Check documentation**:
   - [RENDER_MCP_QUICK_SETUP.md](./docs/RENDER_MCP_QUICK_SETUP.md)
   - [RENDER_MCP_INTEGRATION.md](./docs/RENDER_MCP_INTEGRATION.md)

2. **Check Render status**: [status.render.com](https://status.render.com)

3. **Ask team**: Post in #development Slack channel

4. **Contact DevOps**: Reach out to RenOS DevOps team

---

**Setup Time**: ~5 minutes  
**Checklist Version**: 1.0  
**Last Updated**: October 7, 2025  
**Maintainer**: RenOS DevOps Team
