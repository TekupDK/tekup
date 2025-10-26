# 🚀 Service Worker Cache Fix - Implementation Guide

**Date:** October 7, 2025  
**Problem:** Service Worker cache-first strategy breaks cache-busting  
**Solutions:** Quick fix (disable) OR proper fix (network-first)

---

## 🎯 QUICK FIX: Disable Service Worker (5 minutes)

**Best for:** Immediate fix, dashboard apps that don't need offline support

### Step 1: Replace main.tsx

```powershell
# Backup current file
cp client/src/main.tsx client/src/main.tsx.backup

# Apply fix
```

**File:** `client/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

// DISABLED: Service Worker causing cache issues
// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        console.log('🧹 Removing old service workers that caused cache issues...');
        Promise.all(registrations.map(r => r.unregister()))
          .then(() => {
            console.log('✅ Service workers removed');
            // Clear all caches
            caches.keys().then(keys => {
              Promise.all(keys.map(k => caches.delete(k)))
                .then(() => console.log('✅ Cache cleared'))
                .catch(err => console.error('Cache clear error:', err));
            });
          })
          .catch(err => console.error('Unregister error:', err));
      }
    }).catch(err => console.error('Get registrations error:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

### Step 2: Deploy

```powershell
git add client/src/main.tsx
git commit -m "fix(cache): Disable Service Worker causing cache-busting issues"
git push
```

### Step 3: Verify

1. Wait for deployment (3-5 minutes)
2. Open Chrome DevTools (F12)
3. Go to Application → Service Workers
4. Should see "No service workers found"
5. Clear browser cache (Ctrl+Shift+Delete)
6. Reload page - should see new version!

---

## 🛠️ PROPER FIX: Network-First Service Worker (2 hours)

**Best for:** Apps that need PWA features (offline support, push notifications)

### Step 1: Replace sw.js with Network-First Strategy

**File:** `client/public/sw.js` → Replace with `sw-network-first.js` contents

Key changes:
- ✅ HTML uses **network-first** (cache-busting works)
- ✅ Hashed assets use **cache-first** (performance)
- ✅ Version-based cache names (auto-invalidation)
- ✅ Auto-update mechanism

### Step 2: Add Version Injection to Vite Config

**File:** `client/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-sw-version',
      closeBundle() {
        // Read package.json version
        const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
        const version = `${pkg.version}-${Date.now()}`;
        
        // Read SW template
        const swContent = readFileSync('./public/sw.js', 'utf-8');
        
        // Replace __BUILD_VERSION__ with actual version
        const swWithVersion = swContent.replace(
          '__BUILD_VERSION__', 
          version
        );
        
        // Write to dist
        writeFileSync('./dist/sw.js', swWithVersion);
        console.log(`✅ Injected SW version: ${version}`);
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
})
```

### Step 3: Update main.tsx with Auto-Update

**File:** `client/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

// Service Worker with Network-First Strategy
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ ServiceWorker registered:', registration);

        // Check for updates every 5 minutes
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - auto-reload after 3 seconds
                console.log('🎉 New version detected, reloading in 3 seconds...');
                setTimeout(() => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }, 3000);
              }
            });
          }
        });
      })
      .catch(error => console.error('❌ ServiceWorker registration failed:', error));

    // Auto-reload when new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 New service worker activated, reloading...');
      window.location.reload();
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

### Step 4: Test Locally

```powershell
# Build with version injection
npm run build:client

# Check if version was injected
Select-String -Path "client/dist/sw.js" -Pattern "CACHE_VERSION"
# Should show: const CACHE_VERSION = '1.0.0-1234567890';

# Serve and test
npx serve client/dist

# Open http://localhost:3000
# Check DevTools → Application → Service Workers
# Should see "Network-first strategy" in logs
```

### Step 5: Deploy

```powershell
git add client/public/sw.js client/src/main.tsx client/vite.config.ts
git commit -m "fix(cache): Implement network-first Service Worker strategy"
git push
```

---

## 🧪 Testing Checklist

### Test 1: Service Worker Unregistered (Quick Fix)

```javascript
// Chrome DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs.length); // Should be 0
});

caches.keys().then(keys => {
  console.log('Cache keys:', keys); // Should be empty
});
```

### Test 2: Network-First Strategy (Proper Fix)

```javascript
// Chrome DevTools Console

// Check strategy
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Active SW:', regs[0].active.scriptURL);
});

// Make request and check Network tab
fetch('/').then(() => {
  console.log('Check Network tab: should show (from ServiceWorker)');
  console.log('But actual fetch should be from network, not cache');
});

// Check cache version
caches.keys().then(keys => {
  console.log('Cache names:', keys);
  // Should see: renos-1.0.0-1234567890
  // Number should change with each deploy
});
```

### Test 3: Cache-Busting Works

```powershell
# Make CSS change
# In client/src/index.css, change a color

# Build
npm run build:client

# Check hash changed
ls client/dist/assets/*.css
# Should see NEW hash: index-NEWHASH.css

# Deploy
git add .; git commit -m "test: CSS change"; git push

# After deployment, visit site WITHOUT hard refresh
# Should see new CSS automatically!
```

---

## 📊 Comparison

| Feature | Cache-First (Old) | No SW (Quick Fix) | Network-First (Proper Fix) |
|---------|-------------------|-------------------|----------------------------|
| **Cache-busting** | ❌ Broken | ✅ Works | ✅ Works |
| **Performance** | ✅ Fast | ⚠️ Slower | ✅ Fast |
| **Offline support** | ✅ Yes | ❌ No | ✅ Yes |
| **Complexity** | ⚠️ Medium | ✅ Simple | ⚠️ Medium |
| **Maintenance** | ❌ High | ✅ Low | ⚠️ Medium |
| **Debug ease** | ❌ Hard | ✅ Easy | ⚠️ Medium |

---

## 🎯 Recommendation

### Choose **Quick Fix (Disable SW)** if
- ✅ You don't need offline support
- ✅ You want immediate fix
- ✅ You want simpler architecture
- ✅ Dashboard app (logged-in users always online)

### Choose **Proper Fix (Network-First)** if
- ✅ You need offline support
- ✅ You want PWA features (push notifications, install prompt)
- ✅ You have mobile users with spotty connections
- ✅ You want background sync

---

## 🐛 Troubleshooting

### Issue: "Service Worker still cached"

**Solution:**
```javascript
// Chrome DevTools → Application → Storage → Clear Site Data
// OR run in console:
navigator.serviceWorker.getRegistrations().then(regs => {
  Promise.all(regs.map(r => r.unregister()));
});
caches.keys().then(keys => {
  Promise.all(keys.map(k => caches.delete(k)));
});
location.reload();
```

### Issue: "Build fails after vite.config.ts change"

**Solution:**
```powershell
# Check if fs module is imported
# Vite should have fs available in Node.js context

# If still fails, use simpler approach:
# Just copy package.json version without timestamp
```

### Issue: "Users still see old version"

**Check:**
1. Deployment completed? (Check Render dashboard)
2. Service Worker unregistered? (DevTools → Application)
3. Cache cleared? (DevTools → Application → Clear storage)
4. Hash changed in JS/CSS filenames? (DevTools → Network)

---

## ✅ Success Criteria

- [ ] No Ctrl+Shift+R needed to see new version
- [ ] Service Worker uses network-first for HTML (or disabled)
- [ ] Cache names include version/timestamp
- [ ] Auto-update mechanism works (if using proper fix)
- [ ] Cache-busting filenames still work
- [ ] Users see updates within 5 minutes of deployment

---

**Estimated Time:**
- Quick Fix: **5 minutes** (disable SW)
- Proper Fix: **2 hours** (network-first + auto-update + testing)

**Recommended:** Start with **Quick Fix** today, evaluate **Proper Fix** next sprint if you need PWA features.
