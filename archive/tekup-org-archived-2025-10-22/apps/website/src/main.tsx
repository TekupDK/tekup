import React from 'react'
import { createRoot } from 'react-dom/client'
import * as ReactDOM from 'react-dom'
import App from './App.tsx'
import './index.css'

// Initialize PWA functionality only in production
if (import.meta.env.PROD) {
  // Register production service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.prod.js', { scope: '/' })
      .then(registration => {
        console.log('PWA: Service worker registered in production:', registration);
      })
      .catch(error => {
        console.error('PWA: Service worker registration failed:', error);
      });
  }

  // Initialize PWA features
  import('./utils/pwa').then(({ initializePWA }) => {
    initializePWA();
  }).catch(console.error);
} else {
  console.log('PWA: Skipped in development mode');
}

// Enable runtime accessibility checks in development
if (import.meta.env.DEV) {
  // Dynamically import to avoid including in production bundle
  import('@axe-core/react').then(({ default: axe }) => {
    // Delay slightly to allow the app to mount
    setTimeout(() => {
      axe(React, ReactDOM, 1000);
    }, 1000);
  }).catch(() => {
    // Silently ignore if axe isn't installed
  });
}

// Create and render the React app
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Root element not found!</div>';
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}