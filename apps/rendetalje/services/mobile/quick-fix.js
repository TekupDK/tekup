#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 RendetaljeOS Mobile - Quick Fix & Restart');
console.log('============================================');

// Kill any hanging npm/node processes
console.log('🛑 Stopping any hanging processes...');
try {
  execSync('taskkill /F /IM npm.exe 2>nul', { stdio: 'ignore' });
  execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors - processes might not exist
}

// Clean up any partial installations
console.log('🧹 Cleaning up...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageLockPath = path.join(__dirname, 'package-lock.json');

if (fs.existsSync(nodeModulesPath)) {
  console.log('📁 Removing existing node_modules...');
  try {
    execSync(`rmdir /s /q "${nodeModulesPath}"`, { stdio: 'ignore' });
  } catch (error) {
    console.log('⚠️  Could not remove node_modules, continuing...');
  }
}

if (fs.existsSync(packageLockPath)) {
  console.log('📄 Removing package-lock.json...');
  try {
    fs.unlinkSync(packageLockPath);
  } catch (error) {
    console.log('⚠️  Could not remove package-lock.json, continuing...');
  }
}

// Create minimal package.json for faster install
console.log('📦 Creating minimal package.json for testing...');
const minimalPackage = {
  "name": "@rendetaljeos/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "expo-router": "^2.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "expo-status-bar": "~1.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "typescript": "^5.1.3"
  }
};

fs.writeFileSync('package-minimal.json', JSON.stringify(minimalPackage, null, 2));

console.log('🚀 Starting fresh installation...');
console.log('This will take 2-3 minutes...');

// Install with minimal dependencies first
const installProcess = spawn('npm', ['install', '--package-lock-only=false', '--no-audit', '--no-fund'], {
  stdio: 'inherit',
  shell: true
});

installProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Installation completed successfully!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Install "Expo Go" from Google Play Store');
    console.log('2. Run: npm start');
    console.log('3. Scan QR code with Expo Go');
    console.log('');
    console.log('🚀 Starting development server...');
    
    // Start expo
    const expoProcess = spawn('npx', ['expo', 'start'], {
      stdio: 'inherit',
      shell: true
    });
    
  } else {
    console.error('❌ Installation failed with code:', code);
    console.log('');
    console.log('🔧 Try manual installation:');
    console.log('1. npm cache clean --force');
    console.log('2. npm install --no-optional');
    console.log('3. npx expo start');
  }
});

installProcess.on('error', (error) => {
  console.error('❌ Installation error:', error.message);
  console.log('');
  console.log('🔧 Manual fallback:');
  console.log('1. Close this terminal');
  console.log('2. Open new terminal');
  console.log('3. cd mobile');
  console.log('4. npm install --no-optional');
  console.log('5. npx expo start');
});