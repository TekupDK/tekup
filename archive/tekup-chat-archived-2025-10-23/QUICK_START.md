# 🚀 Tekup AI Assistant - Quick Start

**5-minute setup guide to get your AI Assistant running!**

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ OpenAI API key
- ✅ Supabase account (free tier OK)
- ✅ TekupVault running

---

## Step 1: Install (2 minutes)

```bash
cd c:\Users\empir\tekup-chat
npm install
```

---

## Step 2: Configure (2 minutes)

### A. Create Environment File

```bash
cp .env.example .env.local
```

### B. Fill in Variables

Open `.env.local` and add:

```env
# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o

# TekupVault (REQUIRED)
TEKUPVAULT_API_URL=https://tekupvault.onrender.com/api
TEKUPVAULT_API_KEY=tekup_vault_api_key_2025_secure

# Supabase (REQUIRED - see Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Get OpenAI Key:** https://platform.openai.com/api-keys  
**Get Supabase Keys:** Continue to Step 3 →

---

## Step 3: Setup Database (3 minutes)

### A. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `tekup-chat`
4. Region: Frankfurt (closest to your servers)
5. Wait 2 minutes for provisioning

### B. Run SQL Schema

1. In Supabase Dashboard → SQL Editor
2. Copy **entire** content from `supabase/schema.sql`
3. Paste and click "Run"
4. Should see: "Success. No rows returned"

### C. Get API Keys

1. Supabase Dashboard → Settings → API
2. Copy these to `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

---

## Step 4: Run! (30 seconds)

```bash
npm run dev
```

Expected output:
```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

**Open:** http://localhost:3000

---

## Step 5: Test (2 minutes)

### Test 1: Basic Chat ✅

Type in chat:
```
Hello! Who are you?
```

**Expected:**
- Response streams in real-time
- Mentions "Tekup AI Assistant"
- Takes 2-3 seconds

### Test 2: TekupVault Knowledge ✅

Type:
```
How do I create an invoice in Billy.dk?
```

**Expected:**
- Shows code example
- Cites source file (e.g., "Tekup-Billy/src/tools/invoices.ts")
- Copy button appears on code block

### Test 3: Voice Input ✅ (Chrome/Edge only)

1. Click microphone icon
2. Allow browser permission
3. Say (in Danish): "Hvad skal jeg arbejde på i dag?"
4. Text appears in input

---

## Troubleshooting

### "Failed to fetch sessions"

**Fix:**
```bash
# Check Supabase URL is correct
echo $NEXT_PUBLIC_SUPABASE_URL

# Should output: https://xxx.supabase.co
# If empty, check .env.local exists
```

### "No response from AI"

**Fix:**
```bash
# Check OpenAI key
echo $OPENAI_API_KEY

# Should start with: sk-proj-
# Get new key: https://platform.openai.com/api-keys
```

### "TekupVault search failed"

**Fix:**
```bash
# Test TekupVault is running
curl https://tekupvault.onrender.com/api/health

# Should return: {"status":"healthy"}
# If error: Check TekupVault deployment
```

---

## What's Next?

### Use It Daily! 🚀

**Strategic Questions:**
- "What should I work on today?"
- "Should I delete [repo]?"
- "Explain the TIER system"

**Coding Help:**
- "How do I [task] in [repo]?"
- "Show me examples of [pattern]"
- "Review this code: [paste]"

**Learning:**
- "Explain Tekup-Billy architecture"
- "What's the tech stack?"
- "Show me the database schema"

### Deploy to Production

See: `DEPLOYMENT_GUIDE.md` for full deployment instructions

**Quick Deploy (Vercel):**
```bash
npm i -g vercel
vercel

# Follow prompts
# Add environment variables in dashboard
# Done!
```

---

## Documentation

- **Full Setup:** `README.md`
- **Test Scenarios:** `../Tekup-Cloud/AI_ASSISTANT_USER_TEST_SCENARIOS.md`
- **Implementation Guide:** `../Tekup-Cloud/TEKUP_AI_ASSISTANT_IMPLEMENTATION_GUIDE.md`
- **Build Summary:** `../Tekup-Cloud/TEKUP_AI_ASSISTANT_BUILD_COMPLETE.md`

---

## Support

**Questions?** Check:
1. `README.md` (comprehensive guide)
2. `TROUBLESHOOTING.md` (common issues)
3. GitHub Issues (if open-sourced)

---

**Estimated Total Time:** 10 minutes  
**Status after completion:** ✅ Fully functional AI Assistant

**Enjoy your new AI Assistant! 🎉**
