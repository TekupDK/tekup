# PWA Setup Guide

## ✅ Completed Components

### 1. PWA Manifest (`public/manifest.json`)

- App name, icons, theme colors
- Screenshots and shortcuts
- Installed with proper metadata

### 2. Service Worker (`public/sw.js`)

- Cache-first strategy for static assets
- Push notification support
- Background sync for offline task assignment
- Notification click handlers

### 3. Push Notification Library (`src/lib/push-notifications.ts`)

- Permission request
- Service worker registration
- Push subscription management
- Backend API integration

## 🔧 Required Setup Steps

### Step 1: Generate VAPID Keys

Run this command in the backend directory:

```bash
cd apps/rendetalje/services/backend-nestjs
npx web-push generate-vapid-keys
```

This will output:

```
=======================================

Public Key:
BEl62i...longstring...

Private Key:
wpQP6...longstring...

=======================================
```

### Step 2: Add Keys to Environment Variables

Add to `apps/rendetalje/services/backend-nestjs/.env`:

```env
# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=<Public Key from above>
VAPID_PRIVATE_KEY=<Private Key from above>
VAPID_SUBJECT=mailto:admin@renos.dk
```

Add to `apps/rendetalje/services/frontend-nextjs/.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<Public Key from above>
```

### Step 3: Enable PWA in Next.js

Update `next.config.js` to add PWA support:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config...

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Step 4: Add Manifest Link to HTML

Update `app/layout.tsx` to include manifest:

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</head>
```

### Step 5: Initialize PWA on Client

Add to `app/layout.tsx` or create a `PWAProvider`:

```tsx
"use client";

import { useEffect } from "react";
import { setupPushNotifications } from "@/lib/push-notifications";

export function PWAInitializer({ userId }: { userId: string }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      setupPushNotifications(userId).catch((err) => {
        console.warn("[PWA] Setup failed:", err);
      });
    }
  }, [userId]);

  return null;
}
```

### Step 6: Create Backend Push API Endpoints

Add to backend NestJS:

1. **POST /api/push/subscribe** - Save push subscription
2. **POST /api/push/unsubscribe** - Remove subscription
3. **POST /api/push/send** - Send notification (internal use)

Example implementation needed in `backend-nestjs/src/push/push.controller.ts`

### Step 7: Create App Icons

Generate PWA icons (72x72 to 512x512) and place in `public/icons/`:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) or create manually.

### Step 8: Test PWA Installation

1. Start frontend: `npm run dev` (in frontend-nextjs)
2. Open Chrome DevTools → Application → Manifest
3. Verify manifest loads correctly
4. Check Service Worker is registered
5. Click "Install app" button (should appear in browser)

### Step 9: Test Push Notifications

1. Grant notification permission when prompted
2. Verify subscription saved to backend
3. Trigger test notification from backend
4. Verify notification appears on device

## 🔍 Troubleshooting

### Service Worker Not Registering

- Check console for errors
- Verify `/sw.js` is accessible at root
- Ensure HTTPS in production (PWA requires secure context)

### Push Notifications Not Working

- Verify VAPID keys are correctly set
- Check browser notification permission
- Ensure subscription endpoint is valid
- Test with `web-push` CLI tool

### Icons Not Loading

- Verify file paths in manifest.json
- Check icon files exist in public/icons/
- Clear cache and reload

## 📚 References

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)
