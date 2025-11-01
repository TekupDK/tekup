# Railway Frontend Build Fix

## Problem
Frontend build fejler pga. manglende Supabase environment variables.

## Solution
Sæt disse environment variables i Railway dashboard for `rendetalje-ai` service:

1. Go to Railway Dashboard: https://railway.app/project/308687ac-3adf-4267-8d43-be5850a023e9
2. Select `rendetalje-ai` service
3. Go to "Variables" tab
4. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
```

**OR** for production (set actual values when ready):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Code Changes Made

1. ✅ Fixed `src/lib/supabase.ts` to handle missing env vars gracefully
2. ✅ Created `src/lib/supabase-server.ts` for server-side usage
3. ✅ Mock client returns during build if env vars are missing

## After Setting Variables

1. Redeploy:
   ```powershell
   cd C:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs
   railway up --detach
   ```

2. Check build logs:
   ```powershell
   railway logs --lines 50
   ```

## Alternative: Set via CLI (if supported)

Railway CLI may support setting variables, but dashboard is recommended.

