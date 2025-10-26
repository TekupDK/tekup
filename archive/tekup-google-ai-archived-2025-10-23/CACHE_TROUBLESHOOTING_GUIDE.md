# Cache Troubleshooting Guide - RenOS

**Problem**: Du ser gammel HTML selvom den nye version ER deployed

## 🔍 Diagnose

**Symptomer**:
- HTML viser `/vite.svg` (skulle være `/favicon.png`)
- JavaScript hash: `index-DhwbZfHL.js` (skulle være `index-BkPeDZ3X.js`)
- CSS hash: `index-lTF4m7SI.css` (skulle være `index-BrK6QlqX.css`)

**Root Cause**: Multi-layer caching
1. Browser cache (HTML)
2. Service Worker cache (PWA)
3. Render.com CDN cache
4. DNS cache (sjældent)

## ✅ Løsning (Trin-for-trin)

### STEP 1: Clear Service Worker (KRITISK!)
```
1. Åbn sitet (https://tekup-renos-1.onrender.com)
2. Tryk F12 (DevTools)
3. Gå til "Application" tab
4. Venstre menu → "Service Workers"
5. Klik "Unregister" på ALLE service workers
6. Venstre menu → "Storage"
7. Klik "Clear site data" (dette cleaner ALT)
```

### STEP 2: Hard Refresh Browser
```
Windows: Ctrl + Shift + R  (eller Ctrl + F5)
Mac: Cmd + Shift + R
```

### STEP 3: Incognito Test
```
1. Åbn nyt Incognito/Private vindue (Ctrl+Shift+N)
2. Besøg: https://tekup-renos-1.onrender.com
3. Tjek om du ser den nye version
```

### STEP 4: Clear Browser Cache Manually
```
Chrome:
1. F12 → Network tab
2. Tjek "Disable cache" checkbox (VIGTIG!)
3. Hold Ctrl+Shift og tryk R
4. Luk DevTools når færdig

Eller:
1. Ctrl+Shift+Delete
2. Vælg "All time"
3. Tjek: "Cached images and files"
4. Klik "Clear data"
```

### STEP 5: Verify Build Hashes
```powershell
# Check hvad browser faktisk henter
# Åbn DevTools → Network tab → Refresh
# Se om du får:
✅ index-BkPeDZ3X.js (NYT)
✅ index-BrK6QlqX.css (NYT)
❌ index-DhwbZfHL.js (GAMMEL - cache problem!)
```

## 🔧 Advanced: Force Render CDN Refresh

Hvis ovenstående IKKE virker efter 10-15 minutter:

### Option A: Trigger New Deploy
```powershell
# Lav en dummy ændring og push
cd "C:\Users\empir\Tekup Google AI"
git commit --allow-empty -m "chore: force CDN refresh"
git push origin main
```

### Option B: Check Render Dashboard
```
1. Gå til render.com/dashboard
2. Find "tekup-renos-1" service
3. Klik "Manual Deploy" → "Clear build cache & deploy"
4. Vent 3-5 minutter
```

### Option C: Add Cache Busting Header
```yaml
# render.yaml (hvis ovenstående ikke virker)
services:
  - type: web
    name: tekup-renos-1
    headers:
      - path: /*
        name: Cache-Control
        value: no-cache, no-store, must-revalidate
```

## 📊 Verification Checklist

Efter hver løsning, tjek:

```
✅ View Source (Ctrl+U) → Ingen /vite.svg reference
✅ DevTools → Network → index.html → Se Response Headers
✅ DevTools → Network → JS files → Hash: index-BkPeDZ3X.js
✅ DevTools → Application → Service Workers → Tom (ingen registreret)
✅ DevTools → Application → Storage → Cache Storage → Tom
```

## 🚨 Emergency: Nuclear Option

Hvis INTET andet virker:

```
1. Uninstall Chrome
2. Delete: C:\Users\[user]\AppData\Local\Google\Chrome
3. Reinstall Chrome
4. Besøg sitet

Eller brug anden browser:
- Firefox
- Edge
- Safari
```

## 📝 Why This Happens

**PWA Service Workers** = Aggressive caching
- Service Worker cacher HTML for offline support
- Kan holde på gammel version i ugevis
- SKAL unregisteres manuelt

**Render.com CDN** = Global cache
- CDN cacher statiske filer globalt
- Propagation time: 5-15 minutter
- Nogle gange kræver force refresh

**Browser Cache** = HTML caching
- Browsers cacher HTML agressivt
- Hard refresh er ikke altid nok
- Service Worker override browser cache

## ✅ Success Indicators

Du VED at det virker når du ser:
```html
<!-- OLD (hvad du ser nu) -->
<link rel="icon" href="/vite.svg" />
<script src="/assets/index-DhwbZfHL.js"></script>

<!-- NEW (hvad du SKAL se) -->
<link rel="icon" href="/favicon.png">
<script src="/assets/index-BkPeDZ3X.js"></script>
```

---

**TL;DR**: Unregister Service Worker (F12 → Application → Clear site data) + Hard Refresh!
