# 🧪 PWA Testing Guide - TekUp Website

Din website er nu PWA-klar! Her er hvordan du tester alle funktionerne.

## 🚀 Quick Start

1. **Besøg din website:** `http://localhost:8082` (eller den port Vite viser)
2. **Åbn Chrome DevTools** (F12) for at monitorere PWA funktionalitet
3. **Se PWA Status komponenten** på hjemmesiden for real-time status

## ✅ Test Checklist

### 1. Service Worker Test
- [ ] Åbn DevTools → **Application** tab
- [ ] Gå til **Service Workers** sektion
- [ ] Verify "sw.js" er registreret og aktiv
- [ ] Status skal være "activated and running"

### 2. Web App Manifest Test  
- [ ] I DevTools → **Application** tab
- [ ] Gå til **Manifest** sektion
- [ ] Verify manifest indlæses korrekt
- [ ] Check ikoner, navn, og theme colors vises

### 3. Install Button Test
**Chrome/Edge (Desktop & Mobile):**
- [ ] Se efter **install app ikon** i URL baren (plus-ikon eller app-ikon)
- [ ] Klik på ikonet for at installere
- [ ] App skal åbne i standalone mode

**Andre browsere:**
- [ ] PWA Status komponenten viser install status
- [ ] Klik "Install TekUp App" knappen hvis tilgængelig

### 4. Offline Funktionalitet
- [ ] Åbn DevTools → **Network** tab
- [ ] Vælg **Offline** checkbox
- [ ] Reload siden - custom offline side skal vises
- [ ] Slå online igen

### 5. iOS Test
- [ ] Åbn i Safari på iOS
- [ ] Tryk **Share** knappen
- [ ] Vælg **"Add to Home Screen"**
- [ ] App ikon skal vises på hjemmeskærm

## 🔧 Debug Guide

### Install Button Vises Ikke
1. **Check Requirements:**
   - HTTPS eller localhost ✓
   - Valid manifest.json ✓
   - Service worker active ✓
   - Mindst 192x192 og 512x512 ikoner

2. **Console Errors:**
```bash
# Check for errors:
Console → filter by "PWA" eller "service worker"
```

3. **Manifest Errors:**
```bash
# Common issues:
- Icon paths ikke korrekte
- JSON syntax fejl
- Missing required fields
```

### PWA Audit
- [ ] DevTools → **Lighthouse** tab
- [ ] Vælg **Progressive Web App** kategori  
- [ ] Klik **Generate report**
- [ ] Mål: Score over 90

## 🎯 Test Scenarios

### Scenario 1: Fresh Install
1. Åbn incognito vindue
2. Besøg `http://localhost:8082`
3. Vent på service worker registrering
4. Check for install prompt

### Scenario 2: Update Test
1. Modify `public/sw.js` (ændre version)
2. Reload siden
3. Check update notification vises

### Scenario 3: Cross-Browser
Test i:
- [ ] Chrome (bedste support)
- [ ] Edge (god support) 
- [ ] Firefox (basic support)
- [ ] Safari (iOS kun)

## 📱 Mobile Testing

### Android Chrome
- [ ] Install prompt automatisk
- [ ] "Add to Home Screen" i menu
- [ ] App badge og splash screen

### iOS Safari  
- [ ] Manuel installation via Share
- [ ] App ikon på home screen
- [ ] Standalone mode

## 🛠 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate icons (hvis du har Sharp)
node scripts/generate-icons.js
```

## 📊 PWA Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Web App Manifest | ✅ | Complete with all metadata |
| Service Worker | ✅ | Caching + offline support |  
| Install Prompts | ✅ | Chrome/Edge URL bar + custom |
| Offline Pages | ✅ | Custom offline experience |
| Icons | ⚠️ | SVG icons (PNG anbefales) |
| Push Notifications | 🔄 | Ready to implement |
| Background Sync | 🔄 | Framework ready |

## 🎨 Generate Proper Icons

### Option 1: HTML Generator
```bash
# Besøg i browser:
http://localhost:8082/generate-icons.html
# Download alle PNG icons
```

### Option 2: Converter Tools
- [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator)
- [App Manifest Generator](https://app-manifest.firebaseapp.com/)

### Option 3: Manual Creation
Opret PNG icons i `public/icons/`:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

## 🚨 Common Issues

### "Add to Home Screen" Ikke Tilgængelig
- Check du er på HTTPS/localhost
- Verify service worker er aktiv
- Check manifest er valid JSON
- Icons skal være PNG (ikke SVG for bedst support)

### Service Worker Fejl  
```bash
# Debug i console:
navigator.serviceWorker.ready.then(reg => console.log(reg))
```

### Manifest Validation
```bash
# Test manifest:
fetch('/manifest.json').then(r => r.json()).then(console.log)
```

## 📈 Next Steps

1. **Generate PNG Icons** - Konverter SVG til PNG for bedre kompatibilitet
2. **Test på Rigtige Enheder** - iOS, Android telefoner
3. **Production Deploy** - Test på HTTPS domain
4. **Add Push Notifications** - Implementer hvis ønsket
5. **Analytics** - Track install rates

## 🎉 Success Metrics

Din PWA er sucessful når:
- ✅ Lighthouse PWA score > 90
- ✅ Install button vises i Chrome
- ✅ App kan installeres og køre standalone
- ✅ Offline funktionalitet virker
- ✅ Icons og branding vises korrekt

---

**Din TekUp website er nu en fuldt funktionel Progressive Web App! 🚀**

Test den og nyd din nye app-lignende web experience!