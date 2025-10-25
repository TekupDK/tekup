# 🛡️ Frontend Sentry Installation Guide

**Date:** October 24, 2025  
**Service:** Rendetalje Frontend (Next.js)  
**Purpose:** Error tracking and performance monitoring  
**Time Required:** 15 minutes

---

## 📍 Location

**Frontend Directory:** `c:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs\`

---

## 🚀 Installation Steps

### Step 1: Navigate to Frontend

```powershell
cd c:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs
```

### Step 2: Install Sentry Package

```powershell
npm install @sentry/nextjs --save
```

**Expected Output:**

```
added 25 packages, and audited 1234 packages in 10s
```

### Step 3: Run Sentry Wizard

```powershell
npx @sentry/wizard@latest -i nextjs
```

**Wizard Steps:**

1. **Login to Sentry:**

   - Use existing project: `rendetalje-frontend`
   - Organization: `tekupdk` (or your organization)

2. **Configure Project:**

   - Project name: `rendetalje-frontend`
   - DSN: Will be automatically added

3. **Create Config Files:**

   - `sentry.client.config.ts` (already exists - will update)
   - `sentry.server.config.ts` (new)
   - `sentry.edge.config.ts` (new)
   - `next.config.js` (will modify)

4. **Add Environment Variables:**
   - Wizard will create `.env.sentry-build-plugin`
   - Copy DSN to `.env.local`

### Step 4: Update Environment Variables

**File:** `apps/rendetalje/services/frontend-nextjs/.env.local`

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://6c765ed5f2a857ea81da0a88d3bb6817@o4510143146033152.ingest.de.sentry.io/4510143153700944
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_RELEASE=1.0.0

# Sentry Build Plugin (from wizard)
SENTRY_AUTH_TOKEN=sntrys_YOUR_TOKEN_HERE
SENTRY_ORG=tekupdk
SENTRY_PROJECT=rendetalje-frontend
```

**Note:** If wizard doesn't add frontend DSN, use backend DSN (Sentry allows same DSN for related projects).

### Step 5: Verify Configuration

**Check files created:**

```powershell
Test-Path sentry.client.config.ts
Test-Path sentry.server.config.ts
Test-Path sentry.edge.config.ts
Test-Path .env.sentry-build-plugin
```

**All should return:** `True`

### Step 6: Test Sentry Integration

**Update:** `app/sentry-test/page.tsx` (create if doesn't exist)

```typescript
"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test</h1>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => {
          Sentry.captureException(new Error("Frontend Sentry test error"));
          throw new Error("Test error - Frontend Sentry is working!");
        }}
      >
        Trigger Test Error
      </button>
    </div>
  );
}
```

### Step 7: Build and Test

```powershell
# Build with Sentry
npm run build

# Start development
npm run dev

# Visit: http://localhost:3000/sentry-test
# Click "Trigger Test Error"
# Check Sentry dashboard for error
```

---

## ✅ Verification

### 1. Check Sentry Dashboard

**URL:** <https://sentry.io/organizations/tekupdk/projects/rendetalje-frontend/>

**Expected:**

- New error: "Test error - Frontend Sentry is working!"
- Source maps uploaded (see file paths)
- User context (if logged in)
- Browser info (Chrome, Firefox, etc.)

### 2. Check Build Output

```
> @rendetalje/frontend-nextjs@1.0.0 build
> next build

Creating an optimized production build...
✓ Compiled successfully
✓ Sentry sourcemaps uploaded successfully
```

### 3. Check Environment

```powershell
Get-Content .env.local | Select-String "SENTRY"
```

**Expected:**

```
NEXT_PUBLIC_SENTRY_DSN=https://6c765ed5f2a857ea81da0a88d3bb6817@...
```

---

## 🎯 What Gets Tracked

**Errors:**

- Unhandled exceptions
- Promise rejections
- Component render errors
- API call failures

**Performance:**

- Page load times
- API response times
- Component render times
- Web Vitals (LCP, FID, CLS)

**User Context:**

- User ID (if authenticated)
- IP address (anonymized)
- Browser and OS
- Page URL

---

## 🔧 Configuration Options

### sentry.client.config.ts

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: 1.0, // 100% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  },
});
```

### next.config.js

Wizard adds automatically:

```javascript
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // Your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "tekupdk",
    project: "rendetalje-frontend",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

---

## 🚀 Deploy to Vercel

### Step 1: Add Environment Variables

**Vercel Dashboard → Settings → Environment Variables:**

```
NEXT_PUBLIC_SENTRY_DSN=https://6c765ed5f2a857ea81da0a88d3bb6817@o4510143146033152.ingest.de.sentry.io/4510143153700944
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=sntrys_YOUR_TOKEN_HERE
SENTRY_ORG=tekupdk
SENTRY_PROJECT=rendetalje-frontend
```

### Step 2: Redeploy

```powershell
git add .
git commit -m "feat: add Sentry error tracking to frontend"
git push origin master
```

Vercel auto-deploys on push.

### Step 3: Verify Production

Visit: `https://your-app.vercel.app/sentry-test`  
Click error button  
Check Sentry dashboard

---

## 🛠️ Troubleshooting

### Sentry not capturing errors

**Check:**

1. DSN is correct in `.env.local`
2. `npm run build` completed successfully
3. Sentry dashboard shows project is active
4. No ad blockers blocking Sentry

**Test:**

```typescript
Sentry.captureMessage("Manual test message");
```

### Source maps not uploaded

**Check:**

1. `SENTRY_AUTH_TOKEN` is set
2. Build output shows "Sentry sourcemaps uploaded"
3. `.env.sentry-build-plugin` exists

**Manual upload:**

```powershell
npx @sentry/cli sourcemaps upload --org=tekupdk --project=rendetalje-frontend .next
```

### Build errors after Sentry install

**Check:**

1. `next.config.js` syntax is correct
2. No conflicting webpack configurations
3. Sentry packages are compatible with Next.js version

**Rollback:**

```powershell
npm uninstall @sentry/nextjs
git restore next.config.js sentry.*.config.ts
```

---

## 📊 Expected Benefits

✅ **Real-time Error Alerts** - Email notifications for new errors  
✅ **Error Grouping** - Similar errors grouped together  
✅ **Source Maps** - See exact line of code that failed  
✅ **User Context** - Know which users are affected  
✅ **Performance Monitoring** - Track slow pages and API calls  
✅ **Release Tracking** - Compare error rates between releases

---

## 📝 Post-Installation

**Update documentation:**

1. `MONITORING_STATUS.md` → Mark "Frontend Sentry" as complete
2. `MONITORING_SETUP_SESSION_2025-10-24.md` → Add installation details
3. `QUICK_START_MONITORING.md` → Add frontend verification steps
4. `CHANGELOG.md` → Add entry for monitoring setup

**Commit changes:**

```powershell
git add .
git commit -m "feat: add Sentry error tracking to frontend

- Install @sentry/nextjs package
- Configure client, server, and edge runtime
- Add environment variables
- Create test page for verification
- Update monitoring documentation"
git push origin master
```

---

**Status:** Ready to install  
**Impact:** Enhanced error visibility for production frontend  
**Priority:** HIGH - Required for production monitoring
