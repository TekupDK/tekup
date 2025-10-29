# 🚀 RendetaljeOS Mobile - Quick Start

**Start hele app'en på dine phones i 3 steps!**

---

## Step 1: Start Docker Stack

### Windows

```powershell
.\start-mobile.ps1
```

### Mac/Linux

```bash
./start-mobile.sh
```

### Eller manuelt

```bash
# Find din IP (Windows)
ipconfig

# Find din IP (Mac/Linux)
ifconfig | grep "inet "

# Start med din IP
export HOST_IP=192.168.1.100  # <-- Din IP her
docker-compose -f docker-compose.mobile.yml up
```

---

## Step 2: Åbn Expo Go på Dine Phones

### iPhone 16 Pro

1. Download **Expo Go** fra App Store
2. Åbn app'en
3. Scan QR kode fra terminalen

### Samsung Galaxy Z Fold 7

1. Download **Expo Go** fra Google Play
2. Åbn app'en
3. Scan QR kode fra terminalen

**Eller indtast URL manuelt:**
```
exp://192.168.1.100:19000
```
_(Brug din egen IP)_

---

## Step 3: App Starter

**Det er det! App'en loader og starter på begge phones** 🎉

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| **Mobile App** | `exp://[DIN-IP]:19000` |
| **Backend API** | `http://localhost:3001` |
| **Expo DevTools** | `http://localhost:19002` |
| **Database** | `localhost:5432` |

---

## 🔧 Udvikling

### Live Reload

Rediger kode i VS Code → App reloader automatisk på phone! 🔥

### Stop Stack

```bash
# CTRL+C i terminal

# Eller
docker-compose -f docker-compose.mobile.yml down
```

### View Logs

```bash
docker-compose -f docker-compose.mobile.yml logs -f mobile
docker-compose -f docker-compose.mobile.yml logs -f backend
```

---

## 📱 Test Features

✅ Login med email/password
✅ Enable Face ID / Fingerprint
✅ Toggle GPS tracking
✅ View dagens jobs
✅ Chat med AI Friday
✅ Test offline mode (sluk WiFi)

---

## 🆘 Problemer?

Se detaljeret guide: **START_MOBILE_DEV.md**

### Quick Fixes

**Phone kan ikke forbinde:**
```bash
# Check din IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Restart Expo
docker-compose -f docker-compose.mobile.yml restart mobile
```

**Backend virker ikke:**
```bash
# Check logs
docker-compose -f docker-compose.mobile.yml logs backend

# Restart
docker-compose -f docker-compose.mobile.yml restart backend
```

---

**Built with ❤️ using Claude Code**
