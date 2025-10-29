# 🚀 Start RendetaljeOS Mobile Development

**Komplet guide til at starte mobile app'en med live backend**

---

## 📋 Forudsætninger

### På Din Computer

- [x] Docker Desktop installeret og kørende
- [x] VS Code med Tekup-Portfolio.code-workspace åben
- [x] Git repository klonet

### På Dine Phones

- [x] **iPhone 16 Pro**: Expo Go app fra App Store
- [x] **Samsung Galaxy Z Fold 7**: Expo Go app fra Google Play
- [x] Begge phones på samme WiFi som din computer

---

## 🎯 Quick Start (3 Steps)

### Step 1: Find Din Computers IP-Adresse

**Windows:**
```powershell
ipconfig
# Kig efter "IPv4 Address" under dit WiFi adapter
# Eksempel: 192.168.1.100
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# Eller
ip addr show
# Kig efter din lokale IP (192.168.x.x eller 10.0.x.x)
```

**Noter din IP:** _________________ (f.eks. 192.168.1.100)

---

### Step 2: Start Hele Stack'en

Fra Tekup repository root:

```bash
# Sæt din computer's IP adresse
export HOST_IP=192.168.1.100  # <-- Erstat med din IP

# Start alle services (database, backend, mobile)
docker-compose -f docker-compose.mobile.yml up

# Eller i detached mode (background):
docker-compose -f docker-compose.mobile.yml up -d
```

**Vent indtil du ser:**
```
✅ postgres is healthy
✅ redis is healthy
✅ backend is healthy
✅ mobile-expo started
```

---

### Step 3: Forbind Dine Phones

#### På iPhone 16 Pro

1. **Åbn Expo Go app**
2. **Scan QR kode** fra terminalen
   - Eller indtast URL manuelt: `exp://192.168.1.100:19000`
3. **App loader** og starter 🎉

#### På Samsung Galaxy Z Fold 7

1. **Åbn Expo Go app**
2. **Scan QR kode** fra terminalen
   - Eller indtast URL manuelt: `exp://192.168.1.100:19000`
3. **App loader** og starter 🎉

---

## 🌐 Hvad Kører Hvor?

| Service | URL | Beskrivelse |
|---------|-----|-------------|
| **Backend API** | `http://localhost:3001` | NestJS REST API |
| **Expo DevTools** | `http://localhost:19002` | Expo dashboard (browser) |
| **PostgreSQL** | `localhost:5432` | Database |
| **Redis** | `localhost:6379` | Cache |
| **Mobile App** | `exp://[DIN-IP]:19000` | React Native app |

---

## 📱 Brug App'en

### Login

```
Email: test@rendetalje.dk
Password: test123
```
_(Eller opret bruger via backend API)_

### Features Du Kan Teste

✅ **Login med Biometric**

- På iPhone: Face ID
- På Samsung: Fingerprint

✅ **GPS Tracking**

- Tryk på GPS toggle
- Se live location opdateringer

✅ **Job Liste**

- Se dagens jobs
- Tap på job card for detaljer

✅ **AI Friday**

- Tap floating button
- Chat med AI assistant

✅ **Offline Mode**

- Sluk WiFi på phone
- App virker stadig!
- Data syncer når online igen

---

## 🔧 Development Workflow

### Live Reload

Når du redigerer kode i VS Code:

```bash
# Filer opdateres live i container via volumes
apps/rendetalje/services/mobile/src/*
```

**App reloader automatisk på phone! 🔥**

### Restart Services

```bash
# Restart specific service
docker-compose -f docker-compose.mobile.yml restart mobile

# Restart all
docker-compose -f docker-compose.mobile.yml restart

# View logs
docker-compose -f docker-compose.mobile.yml logs -f mobile
docker-compose -f docker-compose.mobile.yml logs -f backend
```

### Stop Alt

```bash
docker-compose -f docker-compose.mobile.yml down

# Stop og slet volumes (reset database)
docker-compose -f docker-compose.mobile.yml down -v
```

---

## 🐛 Troubleshooting

### Problem: Phone kan ikke forbinde

**Løsning:**
```bash
# 1. Check din IP er korrekt
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Check firewall tillader forbindelser
# Windows: Tillad Docker Desktop i firewall
# Mac: System Preferences → Security → Firewall → Allow Docker

# 3. Restart Expo server
docker-compose -f docker-compose.mobile.yml restart mobile
```

### Problem: Backend virker ikke

**Løsning:**
```bash
# Check backend logs
docker-compose -f docker-compose.mobile.yml logs backend

# Check database er healthy
docker-compose -f docker-compose.mobile.yml ps

# Restart backend
docker-compose -f docker-compose.mobile.yml restart backend
```

### Problem: App viser netværksfejl

**Tjek backend URL i app:**
```typescript
// apps/rendetalje/services/mobile/src/services/api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
```

**Skal være:**
```
http://192.168.1.100:3001/api  // Din computer's IP
```

### Problem: Kan ikke se QR kode

**Åbn Expo DevTools i browser:**
```
http://localhost:19002
```
Her kan du se QR kode og connection instructions.

---

## 📊 Database Management

### Prisma Studio

Åbn database browser:

```bash
# Fra backend-nestjs directory
cd apps/rendetalje/services/backend-nestjs
npx prisma studio
```

Åbner på: `http://localhost:5555`

### Database Migrations

```bash
# Create migration
docker-compose -f docker-compose.mobile.yml exec backend npx prisma migrate dev --name feature_name

# Reset database
docker-compose -f docker-compose.mobile.yml exec backend npx prisma migrate reset
```

---

## 🔐 Secrets & Environment

### Backend Environment

Rediger `.env` i `backend-nestjs/`:
```env
DATABASE_URL=postgresql://rendetalje_user:rendetalje_password@postgres:5432/rendetalje
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-here
```

### Mobile Environment

Rediger `.env.local` i `mobile/`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

---

## 📦 Build for Production

### Android APK

```bash
cd apps/rendetalje/services/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android
eas build --platform android --profile production

# Download APK og installer på Galaxy Z Fold 7
```

### iOS IPA

```bash
# Build iOS (requires Apple Developer account)
eas build --platform ios --profile production

# Install via TestFlight eller direct install
```

---

## 🎨 Development Tips

### Hot Reload

Shake phone eller:

- **iOS**: `Cmd + D`
- **Android**: `Cmd + M` (eller shake)

Menu options:

- **Reload**: Reload app
- **Debug**: Open Chrome DevTools
- **Inspector**: Inspect elements
- **Performance Monitor**: See FPS

### VS Code Setup

Anbefalede extensions:

- React Native Tools
- Expo Tools
- Prisma
- Docker

### Network Tips

For bedste performance:

- Brug 5GHz WiFi (ikke 2.4GHz)
- Brug samme router til computer og phones
- Deaktiver VPN
- Check firewall settings

---

## 🌟 Komplet Stack Overview

```
┌─────────────────────────────────────┐
│     iPhone 16 Pro + Galaxy Z Fold 7 │
│     (Expo Go running React Native)  │
└──────────────┬──────────────────────┘
               │ WiFi
               │ exp://192.168.1.100:19000
               ↓
┌──────────────────────────────────────┐
│  Docker Container: Expo Dev Server   │
│  Port: 19000, 19001, 19002           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Docker Container: NestJS Backend    │
│  Port: 3001                          │
│  - REST API                          │
│  - Authentication                    │
│  - Jobs, Customers, etc.             │
└──────────┬─────────┬─────────────────┘
           │         │
           ↓         ↓
    ┌──────────┐  ┌────────┐
    │PostgreSQL│  │ Redis  │
    │Port: 5432│  │Port:   │
    └──────────┘  │6379    │
                  └────────┘
```

---

## ✅ Checklist: Klar til at starte

- [ ] Docker Desktop kører
- [ ] Expo Go installeret på begge phones
- [ ] Fundet din computer's IP adresse
- [ ] Sat `HOST_IP` environment variable
- [ ] Startet `docker-compose.mobile.yml`
- [ ] Alle containers er healthy (green checkmarks)
- [ ] Phones på samme WiFi
- [ ] QR kode scanned på begge phones
- [ ] Apps kører! 🎉

---

## 🚀 Du Er Klar

```bash
# One command to rule them all:
export HOST_IP=192.168.1.100 && docker-compose -f docker-compose.mobile.yml up
```

**Open Expo Go → Scan QR → Happy Coding! 🎉**

---

**Spørgsmål?** Se logs eller check dokumentationen i `apps/rendetalje/services/mobile/`

**Built with ❤️ using Claude Code**
