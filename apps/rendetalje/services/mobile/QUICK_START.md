# 🚀 RendetaljeOS Mobile App - Quick Start

**Get up and running in 5 minutes!**

---

## Prerequisites

- Node.js 18+ installed
- iOS Simulator (Mac) or Android Emulator
- Expo CLI (will be installed automatically)

---

## Step 1: Navigate to Mobile Directory

```bash
cd apps/rendetalje/services/mobile
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your computer's IP address
# Replace 192.168.1.100 with your actual local IP
```

**To find your IP:**
- **Mac/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig | findstr IPv4`

**Update `.env.local`:**
```
EXPO_PUBLIC_API_URL=http://YOUR_IP_HERE:3001/api
```

---

## Step 4: Start Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open a browser with QR code
- Show available commands

---

## Step 5: Run on Device/Simulator

### Option A: iOS Simulator (Mac Only)

Press `i` in the terminal or run:
```bash
npm run ios
```

### Option B: Android Emulator

Press `a` in the terminal or run:
```bash
npm run android
```

### Option C: Physical Device

1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code shown in terminal/browser
3. App will load on your device

---

## 🎉 That's It!

The app should now be running on your device/simulator.

### Default Test Account

If your backend has test data, try logging in:
- **Email:** `test@rendetalje.dk`
- **Password:** `password123`

*(Update these based on your actual backend setup)*

---

## Common Issues

### Issue: "Network request failed"
**Solution:** Make sure:
1. Backend API is running on port 3001
2. Your computer and device are on same network
3. `.env.local` has correct IP address

### Issue: "Location permission denied"
**Solution:**
- iOS: Go to Settings → Privacy → Location → Expo Go → While Using
- Android: App Settings → Permissions → Location → Allow

### Issue: "Expo Go not connecting"
**Solution:**
- Restart Expo dev server: `npm start -c`
- Make sure both devices are on same WiFi
- Try using tunnel mode: `npm start --tunnel`

---

## Next Steps

1. **Test all features:**
   - Login (try biometric if available)
   - Browse jobs
   - View time tracking
   - Take photos (needs camera permission)
   - Check GPS map

2. **Read documentation:**
   - `COMPLETION_REPORT.md` - Full feature list
   - `MOBILE_APP_COMPLETE.md` - Feature overview
   - `EAS_SETUP_GUIDE.md` - Deployment guide

3. **Ready to deploy?**
   - See `EAS_SETUP_GUIDE.md` for production deployment
   - Create assets using `ASSETS_GUIDE.md`

---

## Quick Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -c

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run linter
npm run lint

# Run tests (when implemented)
npm test
```

---

## Development Tips

1. **Hot Reload:** Changes automatically reload
2. **Shake Device:** Opens developer menu
3. **Command + D (iOS) / Command + M (Android):** Developer menu
4. **Command + R:** Reload app

---

## Getting Help

- Check `COMPLETION_REPORT.md` for known issues
- See Expo docs: https://docs.expo.dev
- Join Expo Discord: https://chat.expo.dev

---

**Happy coding! 🎉**
