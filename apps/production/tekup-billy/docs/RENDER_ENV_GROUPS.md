# Render Environment Groups Configuration

## 📋 Environment Group 1: **Billy MCP Environment**

**Name:** `Billy MCP Environment`  
**Description:** Billy.dk API credentials for Tekup-Billy MCP Server  
**Services:** Tekup-Billy

### Environment Variables

```bash
# Billy.dk API Configuration
BILLY_API_KEY=your_billy_api_key_here
BILLY_ORGANIZATION_ID=your_billy_org_id_here

# Billy Operation Modes
BILLY_TEST_MODE=false
BILLY_DRY_RUN=false

# Node Environment
NODE_ENV=production
```

**Total: 5 variables**

---

## 🗄️ Environment Group 2: **Tekup Database Environment**

**Name:** `Tekup Database Environment`  
**Description:** Shared Supabase database and encryption configuration for all Tekup services  
**Services:** Tekup-Billy, renos-backend (and future services)

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo

# Encryption Configuration (AES-256-GCM)
ENCRYPTION_KEY=9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947
ENCRYPTION_SALT=9b2af923a0665b2f47c7a799b9484b28
```

**Total: 5 variables**

---

## 🔧 Setup Instructions

### Step 1: Create Environment Groups

1. **Navigate to:** <https://dashboard.render.com/env-groups>
2. **Click:** "New Environment Group"

#### Create Group 1: Billy MCP Environment

- **Name:** `Billy MCP Environment`
- **Add variables** from list above
- **⚠️ IMPORTANT:** Replace `BILLY_API_KEY` and `BILLY_ORGANIZATION_ID` with your actual Billy.dk credentials
- Click **"Create Environment Group"**

#### Create Group 2: Tekup Database Environment

- **Name:** `Tekup Database Environment`
- **Add variables** from list above
- Click **"Create Environment Group"**

### Step 2: Link to Services

1. **Go to:** <https://dashboard.render.com/web/srv-d3kk30t6ubrc73e1qon0> (Tekup-Billy service)
2. **Click:** "Environment" tab
3. **Scroll to:** "Environment Groups" section
4. **Click:** "Link Environment Group"
5. **Select:**
   - ✅ `Billy MCP Environment`
   - ✅ `Tekup Database Environment`
6. **Click:** "Link Groups"

### Step 3: Deploy

After linking groups:

- Render will automatically trigger a redeploy
- Wait ~2-3 minutes for build completion
- Check logs for: `✅ Supabase connected successfully`

---

## 🔄 Update Existing RenOS Production Environment

**⚠️ CRITICAL FIX NEEDED:**

I can see your **RenOS Production Environment** has the **OLD** `SUPABASE_SERVICE_KEY`:

```
❌ OLD KEY (ends with): ...YZmGZ_4rVE
✅ NEW KEY (ends with): ...YS8rNo
```

### Fix Instructions

1. **Go to:** <https://dashboard.render.com/env-groups>
2. **Click:** "RenOS Production Environment"
3. **Find:** `SUPABASE_SERVICE_KEY` variable
4. **Click:** Edit (pencil icon)
5. **Replace with:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo
```

6. **Click:** "Save"
7. **Redeploy** renos-backend service

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Render Environment Groups                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────┐  ┌────────────────────────┐│
│  │ Billy MCP Environment       │  │ Tekup Database Env     ││
│  │ (Billy.dk credentials)      │  │ (Supabase shared)      ││
│  └──────────────┬──────────────┘  └───────┬────────────────┘│
│                 │                          │                 │
└─────────────────┼──────────────────────────┼─────────────────┘
                  │                          │
                  ▼                          ▼
         ┌─────────────────┐        ┌──────────────┐
         │  Tekup-Billy    │◄───────┤ renos-backend│
         │   MCP Server    │        │   API Server │
         └─────────────────┘        └──────────────┘
                  │                          │
                  └──────────┬───────────────┘
                             ▼
                    ┌──────────────────┐
                    │ Supabase Database│
                    │  (EU Central)    │
                    └──────────────────┘
```

---

## ✅ Benefits of This Setup

1. **🔒 Security Isolation:**
   - Billy credentials only accessible by Tekup-Billy service
   - Database credentials shared across all services

2. **🔄 Easy Updates:**
   - Update Billy API key once → affects only Tekup-Billy
   - Update Supabase config once → affects all services

3. **📦 Reusability:**
   - New services can link to `Tekup Database Environment`
   - No duplicate credential management

4. **🎯 Clear Separation:**
   - Service-specific vars in dedicated groups
   - Shared infrastructure in common groups

---

## 🧪 Verification Commands

After setup, test from your local machine:

```powershell
# Test Billy MCP Server health
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health"

# Test with MCP client (requires MCP setup)
# See: https://modelcontextprotocol.io/docs/tools/inspector
```

---

## 📝 Notes

- **Encryption keys** are generated once and should NEVER be changed (would break existing encrypted data)
- **Billy credentials** can be rotated by updating the env group
- **Supabase keys** have expiry date: 2075-06-12 (50 years validity)
- All services use **UTC timezone** for consistency

---

## 🆘 Troubleshooting

### Issue: Service won't start after linking env groups

**Solution:** Check Render logs for missing required variables

### Issue: "Invalid API key" errors

**Solution:** Verify `SUPABASE_SERVICE_KEY` is the NEW key (ends with `...YS8rNo`)

### Issue: Billy.dk API returns 401 Unauthorized

**Solution:** Check `BILLY_API_KEY` is correct in Billy MCP Environment group

### Issue: Encryption errors

**Solution:** Ensure `ENCRYPTION_KEY` and `ENCRYPTION_SALT` are exactly 64 and 32 hex chars respectively
