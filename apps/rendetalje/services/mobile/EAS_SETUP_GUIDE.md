# 🚀 EAS Build Setup Guide

## Prerequisites

Before you can build your app with EAS (Expo Application Services), you need:

1. **Expo Account**
   - Sign up at https://expo.dev
   - Remember your username

2. **EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to EAS**
   ```bash
   eas login
   ```

---

## Initial Configuration

### Step 1: Update app.json

Update the following fields in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"  // ⚠️ Update this
      }
    },
    "owner": "YOUR_EXPO_USERNAME"  // ⚠️ Update this
  }
}
```

**To get your Project ID:**

1. Run `eas init` in the mobile directory
2. It will create a project and give you a project ID
3. Copy the ID to `app.json`

OR

1. Go to https://expo.dev
2. Create a new project
3. Copy the project ID from the project settings

---

### Step 2: Initialize EAS

```bash
cd apps/rendetalje/services/mobile
eas init
```

This will:
- Create/update `eas.json` configuration
- Link your project to EAS
- Set up build profiles

---

## Building Your App

### Development Build (for testing)

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android

# Both
eas build --profile development --platform all
```

### Preview Build (internal testing)

```bash
# iOS
eas build --profile preview --platform ios

# Android
eas build --profile preview --platform android

# Both
eas build --profile preview --platform all
```

### Production Build (App Store/Play Store)

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# Both
eas build --profile production --platform all
```

---

## Submitting to App Stores

### iOS App Store

1. **Build for production:**
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios --profile production
   ```

3. **You'll need:**
   - Apple Developer Account ($99/year)
   - App Store Connect credentials
   - App icon, screenshots, description

### Google Play Store

1. **Build for production:**
   ```bash
   eas build --profile production --platform android
   ```

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android --profile production
   ```

3. **You'll need:**
   - Google Play Developer Account ($25 one-time)
   - Play Console access
   - App icon, screenshots, description

---

## EAS Update (Over-the-Air Updates)

For JavaScript-only changes (no native code), you can push updates instantly:

```bash
# Publish update to production
eas update --branch production --message "Bug fixes and improvements"

# Publish update to staging
eas update --branch staging --message "Testing new features"

# Rollback if needed
eas update:rollback --branch production
```

**Note:** OTA updates only work for JavaScript changes. Native code changes require a new build.

---

## Common Issues & Solutions

### Issue: "No project ID found"
**Solution:** Run `eas init` or add project ID to `app.json`

### Issue: "Not logged in"
**Solution:** Run `eas login`

### Issue: "Build failed"
**Solution:** Check the build logs at https://expo.dev/accounts/[your-username]/projects/[project-name]/builds

### Issue: "Apple credentials not configured"
**Solution:** Run `eas credentials` to configure Apple Developer credentials

### Issue: "Android keystore not found"
**Solution:** EAS will automatically generate one for you on first build

---

## Continuous Integration (CI/CD)

### GitHub Actions Example

Create `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm install
        working-directory: apps/rendetalje/services/mobile

      - name: Build on EAS
        run: eas build --platform all --non-interactive --profile production
        working-directory: apps/rendetalje/services/mobile
```

**Setup:**
1. Go to https://expo.dev/accounts/[username]/settings/access-tokens
2. Create a new token
3. Add it as `EXPO_TOKEN` secret in GitHub repository settings

---

## Build Profiles (eas.json)

Your project should have these profiles configured in `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## Useful Commands

```bash
# View build status
eas build:list

# View build logs
eas build:view [build-id]

# Configure credentials
eas credentials

# View project info
eas project:info

# Create new build profile
eas build:configure

# View updates
eas update:list

# Cancel a running build
eas build:cancel [build-id]
```

---

## Cost & Limits

**Free Tier:**
- 30 builds/month
- Basic support
- Public projects

**Production Plan ($99/month):**
- Unlimited builds
- Priority support
- Private projects
- Dedicated build servers

**Note:** Check current pricing at https://expo.dev/pricing

---

## Best Practices

1. **Version Management:**
   - Increment `version` in app.json for each release
   - Use semantic versioning (1.0.0, 1.1.0, 2.0.0)

2. **Environment Variables:**
   - Use different `.env` files for each profile
   - Never commit sensitive keys

3. **Testing:**
   - Always test development builds before production
   - Use preview builds for internal testing

4. **Updates:**
   - Use EAS Update for minor changes
   - Full rebuild for major changes or native code

5. **Monitoring:**
   - Set up error tracking (Sentry)
   - Monitor crash reports in EAS dashboard

---

## Support & Resources

- **EAS Documentation:** https://docs.expo.dev/eas/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **EAS Update:** https://docs.expo.dev/eas-update/introduction/
- **Expo Forums:** https://forums.expo.dev/
- **Discord:** https://chat.expo.dev/

---

**Last Updated:** October 24, 2025
**For:** RendetaljeOS Mobile App v1.0.0