# 📱 RendetaljeOS Mobile App

**Complete mobile solution for RendetaljeOS field operations**

[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)

---

## 🎯 Overview

RendetaljeOS Mobile App er den komplette mobile løsning for Rendetalje.dk medarbejdere i felten. Appen giver offline funktionalitet, GPS tracking, photo documentation og real-time sync med hovedsystemet.

### 🚀 Key Features

- **📱 Offline First**: Arbejd uden internetforbindelse
- **📍 GPS Tracking**: Real-time location og route optimization
- **📸 Photo Capture**: Before/after job documentation
- **⏰ Time Tracking**: Start/stop timers med automatisk sync
- **🔔 Push Notifications**: Job assignments og alerts
- **🤖 AI Friday**: Voice-enabled chat assistant
- **🔄 Real-time Sync**: Automatisk data synchronization

---

## 🛠️ Tech Stack

- **Framework**: React Native med Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: SQLite (offline storage)
- **Maps**: React Native Maps
- **Notifications**: Expo Notifications
- **Camera**: Expo Camera
- **Location**: Expo Location

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator eller Android Emulator

### Development Setup

```bash
# Install dependencies
cd mobile
npm install

# Start development server
npm run start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📱 App Structure

```
mobile/
├── src/
│   ├── app/                    # Expo Router pages
│   │   ├── (auth)/            # Authentication screens
│   │   ├── (tabs)/            # Main tab navigation
│   │   └── _layout.tsx        # Root layout
│   ├── components/            # Reusable components
│   │   ├── JobCard.tsx        # Job display component
│   │   ├── LocationStatus.tsx # GPS status component
│   │   └── AIFridayWidget.tsx # Chat assistant
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.tsx        # Authentication hook
│   │   ├── useLocation.tsx    # Location tracking hook
│   │   └── useOffline.tsx     # Offline sync hook
│   ├── services/              # API services
│   │   ├── api.ts             # Main API client
│   │   ├── offline.ts         # Offline storage
│   │   └── sync.ts            # Data synchronization
│   ├── providers/             # Context providers
│   │   ├── AuthProvider.tsx   # Authentication context
│   │   ├── OfflineProvider.tsx # Offline context
│   │   └── LocationProvider.tsx # Location context
│   └── types/                 # TypeScript definitions
├── assets/                    # App assets (icons, images)
├── scripts/                   # Deployment scripts
└── docs/                      # Documentation
```

---

## 🔧 Core Features

### 📱 Offline Functionality

```typescript
// Offline storage med SQLite
const offlineStorage = {
  jobs: await db.getAllAsync('SELECT * FROM jobs WHERE synced = 0'),
  timeEntries: await db.getAllAsync('SELECT * FROM time_entries WHERE synced = 0'),
  photos: await db.getAllAsync('SELECT * FROM photos WHERE synced = 0'),
};

// Automatic sync når online
useEffect(() => {
  if (isOnline) {
    syncOfflineData();
  }
}, [isOnline]);
```

### 📍 GPS Tracking

```typescript
// Real-time location tracking
const { location, isTracking, startTracking } = useLocation();

// Route optimization
const optimizedRoute = await routeApi.optimize({
  jobs: todaysJobs,
  currentLocation: location,
});
```

### 📸 Photo Documentation

```typescript
// Camera integration
const takePhoto = async (jobId: string, type: 'before' | 'after') => {
  const photo = await Camera.takePictureAsync({
    quality: 0.8,
    base64: false,
    exif: true,
  });

  await saveJobPhoto(jobId, photo.uri, type);
};
```

### ⏰ Time Tracking

```typescript
// Time tracking med sync
const { startTimer, stopTimer, currentEntry } = useTimeTracking();

// Start job timer
await startTimer(jobId);

// Stop og sync
await stopTimer();
await syncTimeEntries();
```

---

## 🚀 Deployment

### Build for Production

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

### Submit to App Stores

```bash
# Submit to iOS App Store
eas submit --platform ios --profile production

# Submit to Google Play Store
eas submit --platform android --profile production

# Submit to both stores
eas submit --platform all --profile production
```

### Automated Deployment

```bash
# Use deployment script
./scripts/deploy.sh --platform all --profile production --submit
```

---

## 📊 Performance & Monitoring

### Performance Metrics

- **App Launch Time**: <3 seconds
- **Offline Sync**: <30 seconds
- **Photo Upload**: <10 seconds per photo
- **Battery Usage**: Optimized for all-day use

### Monitoring

- **Crash Reporting**: Expo Crashlytics
- **Performance**: Expo Analytics
- **User Feedback**: In-app feedback system

---

## 🔒 Security & Privacy

### Data Protection

- **Local Encryption**: SQLite database encryption
- **Secure Storage**: Expo SecureStore for sensitive data
- **API Security**: JWT token authentication
- **Photo Privacy**: Local storage med automatic cleanup

### Permissions

- **Location**: Required for GPS tracking
- **Camera**: Required for job documentation
- **Notifications**: Required for job alerts
- **Storage**: Required for offline functionality

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run tests med coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Testing

```bash
# Install Detox (iOS/Android E2E testing)
npm install -g detox-cli

# Run E2E tests
detox test --configuration ios.sim.debug
```

### Manual Testing Checklist

- [ ] Login/logout functionality
- [ ] Offline mode operation
- [ ] GPS tracking accuracy
- [ ] Photo capture og upload
- [ ] Time tracking precision
- [ ] Push notification delivery
- [ ] Data synchronization
- [ ] AI Friday chat functionality

---

## 📚 Documentation

### User Guides

- [Employee Quick Start](./docs/EMPLOYEE_GUIDE.md)
- [Offline Mode Guide](./docs/OFFLINE_GUIDE.md)
- [GPS Tracking Guide](./docs/GPS_GUIDE.md)
- [Photo Documentation](./docs/PHOTO_GUIDE.md)

### Technical Docs

- [API Integration](./docs/API_INTEGRATION.md)
- [Offline Architecture](./docs/OFFLINE_ARCHITECTURE.md)
- [Push Notifications](./docs/PUSH_NOTIFICATIONS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## 🔄 Update Strategy

### Over-the-Air Updates

```bash
# Publish OTA update
eas update --branch production --message "Bug fixes and improvements"

# Rollback if needed
eas update:rollback --branch production
```

### Store Updates

- **Minor Updates**: OTA updates for JavaScript changes
- **Major Updates**: Store submission for native code changes
- **Emergency Fixes**: Immediate OTA deployment

---

## 🆘 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache og rebuild
expo r -c
eas build --platform ios --clear-cache
```

#### Sync Issues

```bash
# Reset offline storage
await db.execAsync('DELETE FROM sync_queue');
await initializeOfflineStorage();
```

#### Location Issues

```bash
# Check permissions
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Handle permission denied
}
```

### Support Channels

- **Technical Issues**: dev@rendetalje.dk
- **User Support**: support@rendetalje.dk
- **Emergency**: +45 XX XX XX XX

---

## 📈 Roadmap

### Version 1.1 (Q1 2026)

- [ ] Voice commands for hands-free operation
- [ ] Advanced route optimization
- [ ] Offline maps support
- [ ] Enhanced AI Friday capabilities

### Version 1.2 (Q2 2026)

- [ ] Apple Watch companion app
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Integration med IoT sensors

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `develop`
2. Implement feature med tests
3. Submit pull request
4. Code review og approval
5. Merge til `develop`
6. Deploy til staging for testing
7. Merge til `main` for production

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic code formatting
- **Testing**: 80%+ code coverage required

---

**Mobile App Documentation opdateret**: 22. Oktober 2025  
**Version**: 1.0.0  
**Platform**: iOS & Android  
**Support**: dev@rendetalje.dk
