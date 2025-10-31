# Railway Deployment Fix

**Issue:** Railway is using Railpack instead of Dockerfile  
**Error:** "✖ No start command was found"

## Solution

Railway detects this as a workspace project (10 packages in monorepo) and tries to use Railpack.

**Fix Applied:**
1. Updated `railway.json` with explicit Dockerfile path and context
2. Created `.railwayignore` to prevent Railpack auto-detection

## Manual Railway Dashboard Fix

If this still doesn't work, manually set in Railway Dashboard:

1. **Go to Service Settings → Build**
2. **Builder:** Select "Dockerfile"
3. **Dockerfile Path:** `apps/production/tekup-billy/Dockerfile`
4. **Docker Context:** `apps/production/tekup-billy`
5. **Root Directory:** `apps/production/tekup-billy`

OR

**Disable Railpack entirely:**
1. Service Settings → Build
2. Uncheck "Enable Railpack" if available
3. Force Dockerfile usage

