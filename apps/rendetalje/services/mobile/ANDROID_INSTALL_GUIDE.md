# 📱 RendetaljeOS Android App - Installation Guide

**Quick Guide til at få RendetaljeOS mobile app installeret på Android**

---

## 🎯 Overview

Der er flere måder at installere RendetaljeOS på Android:

1. **Development Build** (hurtigste - til test)
2. **APK Build** (standalone app fil)
3. **Google Play Store** (production deployment)

Vi starter med Development Build for at teste appen hurtigt.

---

## 🚀 Method 1: Development Build (Anbefalet til test)

### Prerequisites

```bash
# Install Node.js (hvis ikke allerede installeret)
# Download fra: https://nodejs.org/

# Install Expo CLI
npm install -g @expo/eas-cli expo-cli

# Install Android Studio (for emulator)
# Download fra: https://developer.android.com/studio
```

### Step 1: Setup Project

```bash
# Navigate til mobile directory
cd mobile

# Install dependencies
npm install

# Login til Expo (opret account på expo.dev hvis nødvendigt)
eas login
```

### Step 2: Start Development Server

```bash
# Start Expo development server
npx expo start

# Eller med tunnel for external access
npx expo start --tunnel
```

### Step 3: Install på Android Device

#### Option A: Physical Android Device

1. **Install Expo Go app** fra Google Play Store
2. **Scan QR code** fra terminal/browser
3. **App opens** i Expo Go

#### Option B: Android Emulator

1. **Open Android Studio**
2. **Start AVD Manager** (Android Virtual Device)
3. **Create/Start emulator**
4. **Press 'a'** i Expo terminal for Android emulator

---

## 🔧 Method 2: Standalone APK Build

### Step 1: Configure App

```bash
# Update app.json med production settings
{
  "expo": {
    "name": "RendetaljeOS",
    "slug": "rendetaljeos-mobile",
    "version": "1.0.0",
    "android": {
      "package": "dk.rendetalje.rendetaljeos",
      "versionCode": 1
    }
  }
}
```

### Step 2: Build APK

```bash
# Build development APK (faster)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
```

### Step 3: Download & Install APK

1. **Wait for build** (10-20 minutes)
2. **Download APK** fra EAS dashboard link
3. **Transfer APK** til Android device
4. **Enable "Unknown Sources"** i Android settings
5. **Install APK** ved at tappe på filen

---

## 📱 Method 3: Quick Test Setup

Lad mig oprette en hurtig test setup:

<function_calls>
<invoke name="fsWrite">
<parameter name="path">mobile/quick-start.jsenv node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RendetaljeOS Mobile - Quick Android Setup');
console.log('==========================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
console.error('❌ Please run this from the mobile directory');
process.exit(1);
}

// Check if Expo CLI is installed
try {
execSync('npx expo --version', { stdio: 'ignore' });
console.log('✅ Expo CLI found');
} catch (error) {
console.log('📦 Installing Expo CLI...');
execSync('npm install -g @expo/cli', { stdio: 'inherit' });
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
execSync('npm install', { stdio: 'inherit' });
console.log('✅ Dependencies installed');
} catch (error) {
console.error('❌ Failed to install dependencies');
process.exit(1);
}

// Create basic app structure if missing
const appDir = path.join(\_\_dirname, 'src', 'app');
if (!fs.existsSync(appDir)) {
console.log('📁 Creating app structure...');
fs.mkdirSync(appDir, { recursive: true });

// Create basic index file
const indexContent = `
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen() {
const handlePress = () => {
Alert.alert('RendetaljeOS', 'Mobile app is working! 🎉');
};

return (
<View style={styles.container}>
<View style={styles.header}>
<View style={styles.logo}>
<Text style={styles.logoText}>R</Text>
</View>
<Text style={styles.title}>RendetaljeOS</Text>
<Text style={styles.subtitle}>Mobile App Test</Text>
</View>

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Test App</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>✅ App is running successfully</Text>
        <Text style={styles.infoText}>📱 Ready for development</Text>
        <Text style={styles.infoText}>🚀 RendetaljeOS Mobile v1.0.0</Text>
      </View>
    </View>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#f8fafc',
justifyContent: 'center',
alignItems: 'center',
padding: 20,
},
header: {
alignItems: 'center',
marginBottom: 40,
},
logo: {
width: 80,
height: 80,
borderRadius: 16,
backgroundColor: '#2563eb',
justifyContent: 'center',
alignItems: 'center',
marginBottom: 16,
},
logoText: {
fontSize: 32,
fontWeight: 'bold',
color: '#ffffff',
},
title: {
fontSize: 28,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 8,
},
subtitle: {
fontSize: 16,
color: '#64748b',
},
button: {
backgroundColor: '#2563eb',
paddingHorizontal: 32,
paddingVertical: 16,
borderRadius: 12,
marginBottom: 40,
},
buttonText: {
color: '#ffffff',
fontSize: 18,
fontWeight: '600',
},
info: {
alignItems: 'center',
},
infoText: {
fontSize: 16,
color: '#059669',
marginBottom: 8,
},
});
`;

fs.writeFileSync(path.join(appDir, 'index.tsx'), indexContent);
console.log('✅ Basic app structure created');
}

// Start the development server
console.log('🚀 Starting development server...');
console.log('');
console.log('📱 To install on Android:');
console.log('1. Install "Expo Go" from Google Play Store');
console.log('2. Scan the QR code that appears');
console.log('3. App will open in Expo Go');
console.log('');
console.log('🔄 Starting server...');

try {
execSync('npx expo start', { stdio: 'inherit' });
} catch (error) {
console.error('❌ Failed to start development server');
console.log('');
console.log('🔧 Try manually:');
console.log('cd mobile && npx expo start');
}
