# 📱 RendetaljeOS Mobile App - Deployment Guide

**Target**: iOS App Store & Google Play Store  
**Framework**: React Native med Expo  
**Status**: Ready for deployment

---

## 🎯 Overview

Denne guide hjælper dig med at deploye RendetaljeOS mobile app til både iOS App Store og Google Play Store ved hjælp af Expo Application Services (EAS).

### 📱 App Features

- **Offline Functionality**: SQLite local storage
- **GPS Tracking**: Real-time location services
- **Photo Capture**: Before/after job documentation
- **Time Tracking**: Start/stop timers med sync
- **Push Notifications**: Job assignments & alerts
- **AI Friday**: Voice-enabled chat assistant

---

## 🚀 Prerequisites

### 1. **Expo Account & EAS CLI**

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

### 2. **Apple Developer Account** (iOS)

- Apple Developer Program membership ($99/year)
- App Store Connect access
- Apple Team ID

### 3. **Google Play Console** (Android)

- Google Play Console account ($25 one-time fee)
- Google Service Account for automated uploads

---

## 📋 Pre-Deployment Setup

### 1. **Configure App Credentials**

#### Update `app.json`:

```json
{
  "expo": {
    "name": "RendetaljeOS",
    "slug": "rendetaljeos-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "dk.rendetalje.rendetaljeos",
      "buildNumber": "1"
    },
    "android": {
      "package": "dk.rendetalje.rendetaljeos",
      "versionCode": 1
    }
  }
}
```

#### Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@rendetalje.dk",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 2. **Create App Icons & Assets**

#### Required Assets:

- **App Icon**: 1024x1024 PNG (iOS & Android)
- **Splash Screen**: 1242x2436 PNG
- **Adaptive Icon**: 1024x1024 PNG (Android)
- **Notification Icon**: 96x96 PNG

#### Generate Assets:

```bash
# Create assets directory
mkdir -p mobile/assets

# Add your icons to mobile/assets/
# - icon.png (1024x1024)
# - splash.png (1242x2436)
# - adaptive-icon.png (1024x1024)
# - notification-icon.png (96x96)
```

### 3. **Environment Configuration**

#### Create `.env.production`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://rendetaljeos-api.onrender.com
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Friday
EXPO_PUBLIC_AI_FRIDAY_URL=https://tekup-chat.onrender.com

# Push Notifications
EXPO_PUBLIC_FIREBASE_PROJECT_ID=rendetaljeos-notifications
```

---

## 🍎 iOS App Store Deployment

### 1. **Build iOS App**

```bash
cd mobile

# Build for production
eas build --platform ios --profile production

# Wait for build to complete (10-20 minutes)
# Build URL will be provided
```

### 2. **Submit to App Store**

```bash
# Submit to App Store Connect
eas submit --platform ios --profile production

# Follow prompts to complete submission
```

### 3. **App Store Connect Configuration**

#### App Information:

- **Name**: RendetaljeOS
- **Subtitle**: Operations Management
- **Category**: Business
- **Content Rating**: 4+ (No objectionable content)

#### App Description:

```
RendetaljeOS er den komplette mobile løsning for Rendetalje.dk medarbejdere.

FEATURES:
• Daglige job assignments med GPS navigation
• Offline funktionalitet - arbejd uden internet
• Time tracking med automatisk sync
• Photo documentation for kvalitetskontrol
• Real-time kommunikation med team og kunder
• AI Friday assistant til øjeblikkelig hjælp

PERFEKT TIL:
• Rengøringsmedarbejdere i felten
• Time tracking og job management
• Kvalitetsdokumentation med photos
• Offline arbejde med automatisk sync

Kræver RendetaljeOS account fra din arbejdsgiver.
```

#### Keywords:

```
rendetalje, cleaning, operations, management, time tracking, GPS, offline, jobs
```

#### Screenshots:

- **6.7" Display**: 1290x2796 (iPhone 14 Pro Max)
- **6.5" Display**: 1242x2688 (iPhone 11 Pro Max)
- **5.5" Display**: 1242x2208 (iPhone 8 Plus)

### 4. **Review Process**

- **Review Time**: 1-7 days
- **Common Issues**: Privacy policy, app functionality
- **Status Tracking**: App Store Connect dashboard

---

## 🤖 Google Play Store Deployment

### 1. **Build Android App**

```bash
cd mobile

# Build Android App Bundle (AAB)
eas build --platform android --profile production

# Wait for build to complete
```

### 2. **Submit to Google Play**

```bash
# Submit to Google Play Console
eas submit --platform android --profile production
```

### 3. **Google Play Console Configuration**

#### App Details:

- **App Name**: RendetaljeOS
- **Short Description**: Operations management for cleaning services
- **Full Description**:

```
RendetaljeOS er den komplette mobile løsning for professionelle rengøringsmedarbejdere.

🎯 HOVEDFUNKTIONER:
• Daglige job assignments med optimerede ruter
• GPS tracking og navigation til job lokationer
• Offline funktionalitet - arbejd uden internetforbindelse
• Time tracking med start/stop timers
• Photo capture for before/after dokumentation
• Real-time sync når internet er tilgængeligt
• Push notifications for nye job assignments
• AI Friday assistant til øjeblikkelig hjælp på dansk

📱 PERFEKT TIL:
• Rengøringsmedarbejdere i felten
• Facility management teams
• Service technicians
• Field operations

🔒 SIKKERHED & PRIVACY:
• Sikker login med JWT authentication
• Data encryption
• GDPR compliant
• Kun autoriserede medarbejdere har adgang

Kræver RendetaljeOS account fra din arbejdsgiver for at bruge appen.

Kontakt support@rendetalje.dk for hjælp eller spørgsmål.
```

#### Category & Tags:

- **Category**: Business
- **Tags**: business, productivity, operations, cleaning, management

#### Content Rating:

- **Target Audience**: Business users
- **Content Rating**: Everyone

### 4. **Store Listing Assets**

#### Screenshots (Required):

- **Phone**: 1080x1920 (minimum 2, maximum 8)
- **7" Tablet**: 1200x1920 (minimum 1, maximum 8)
- **10" Tablet**: 1600x2560 (minimum 1, maximum 8)

#### Feature Graphic:

- **Size**: 1024x500
- **Format**: PNG or JPG
- **Content**: App logo + key features

#### App Icon:

- **Size**: 512x512
- **Format**: PNG
- **32-bit with alpha channel**

---

## 🔄 Automated Deployment Pipeline

### 1. **GitHub Actions Workflow**

#### Create `.github/workflows/mobile-deploy.yml`:

```yaml
name: 📱 Deploy Mobile App

on:
  push:
    branches: [main]
    paths: ['mobile/**']
  workflow_dispatch:

jobs:
  deploy-mobile:
    name: 🚀 Build & Deploy Mobile App
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 📥 Install dependencies
        run: |
          cd mobile
          npm ci

      - name: 🔧 Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 🏗️ Build iOS
        run: |
          cd mobile
          eas build --platform ios --profile production --non-interactive

      - name: 🏗️ Build Android
        run: |
          cd mobile
          eas build --platform android --profile production --non-interactive

      - name: 🚀 Submit to Stores
        run: |
          cd mobile
          eas submit --platform all --profile production --non-interactive
```

### 2. **Environment Secrets**

#### Add to GitHub Secrets:

```bash
EXPO_TOKEN=your-expo-access-token
APPLE_ID=your-apple-id
APPLE_PASSWORD=your-app-specific-password
GOOGLE_SERVICE_ACCOUNT_KEY=your-google-service-account-json
```

---

## 📊 Monitoring & Analytics

### 1. **App Performance**

- **Expo Analytics**: Built-in usage analytics
- **Crashlytics**: Crash reporting
- **Performance Monitoring**: App launch times, API response times

### 2. **User Feedback**

- **App Store Reviews**: Monitor and respond
- **Google Play Reviews**: Track ratings and feedback
- **In-App Feedback**: Direct feedback collection

### 3. **Update Strategy**

- **Over-the-Air Updates**: Expo Updates for JavaScript changes
- **Store Updates**: Native code changes require store approval
- **Version Management**: Semantic versioning (1.0.0, 1.0.1, etc.)

---

## 🔧 Troubleshooting

### Common Build Issues:

#### iOS Build Failures:

```bash
# Clear Expo cache
expo r -c

# Update iOS build number
# Edit app.json: "buildNumber": "2"

# Rebuild
eas build --platform ios --profile production --clear-cache
```

#### Android Build Failures:

```bash
# Clear cache and rebuild
eas build --platform android --profile production --clear-cache

# Update version code
# Edit app.json: "versionCode": 2
```

#### Submission Issues:

```bash
# Check submission status
eas submission:list

# Resubmit if needed
eas submit --platform ios --profile production --latest
```

---

## 📅 Deployment Checklist

### Pre-Deployment:

- [ ] App icons and assets created
- [ ] Environment variables configured
- [ ] Apple Developer account setup
- [ ] Google Play Console account setup
- [ ] App descriptions and metadata prepared

### iOS Deployment:

- [ ] Build iOS app with EAS
- [ ] Submit to App Store Connect
- [ ] Configure app metadata
- [ ] Upload screenshots
- [ ] Submit for review
- [ ] Monitor review status

### Android Deployment:

- [ ] Build Android AAB with EAS
- [ ] Submit to Google Play Console
- [ ] Configure store listing
- [ ] Upload screenshots and assets
- [ ] Submit for review
- [ ] Monitor review status

### Post-Deployment:

- [ ] Monitor app performance
- [ ] Track user feedback
- [ ] Plan update strategy
- [ ] Setup analytics and monitoring

---

## 🎯 Next Steps

1. **Setup Developer Accounts**: Apple Developer & Google Play Console
2. **Create App Assets**: Icons, screenshots, descriptions
3. **Configure EAS**: Update credentials and build profiles
4. **Build & Submit**: Deploy to both stores
5. **Monitor & Iterate**: Track performance and user feedback

**Estimated Timeline**: 1-2 weeks for initial deployment, 1-7 days for store review.

---

**Deployment Guide opdateret**: 22. Oktober 2025  
**Version**: 1.0.0  
**Support**: dev@rendetalje.dk
