// PWA utilities for service worker registration and install prompt handling
import { pwaAnalytics } from './pwaAnalytics';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Service Worker registration - disabled in development
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  // Clean up service workers in development mode
  if (import.meta.env.DEV) {
    console.log('PWA: Cleaning up service workers in development mode');

    // Unregister all existing service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('PWA: Unregistering service worker:', registration.scope);
          await registration.unregister();
        }

        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          console.log('PWA: Deleting cache:', cacheName);
          await caches.delete(cacheName);
        }

        console.log('PWA: Service worker cleanup completed');
      } catch (error) {
        console.error('PWA: Error during cleanup:', error);
      }
    }

    console.log('PWA: Skipping service worker registration in development mode');
    return null;
  }

  if ('serviceWorker' in navigator) {
    try {
      console.log('PWA: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('PWA: Service worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('PWA: New service worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New service worker installed, showing update notification');
              showUpdateAvailableNotification(registration);
            }
          });
        }
      });

      // Check if there's an existing service worker and if there's an update available
      if (registration.waiting) {
        showUpdateAvailableNotification(registration);
      }

      return registration;
    } catch (error) {
      console.error('PWA: Service worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('PWA: Service workers not supported');
    return null;
  }
};

// Show update available notification
const showUpdateAvailableNotification = (registration: ServiceWorkerRegistration) => {
  // You can customize this to show a more sophisticated notification
  const updateApp = confirm(
    'En ny version af appen er tilgængelig. Vil du opdatere nu?'
  );

  if (updateApp && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

// Install prompt handling
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installPromptCallback: ((canInstall: boolean) => void) | null = null;

// Listen for the beforeinstallprompt event
export const setupInstallPrompt = (callback?: (canInstall: boolean) => void) => {
  installPromptCallback = callback || null;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: beforeinstallprompt event fired');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Save the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Track analytics
    pwaAnalytics.trackInstallPromptShown();

    // Notify that app can be installed
    if (installPromptCallback) {
      installPromptCallback(true);
    }

    // Custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA: App was installed');
    deferredPrompt = null;

    // Track analytics
    pwaAnalytics.trackInstallCompleted();

    if (installPromptCallback) {
      installPromptCallback(false);
    }

    // Custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true) {
    console.log('PWA: App is running in standalone mode');

    if (installPromptCallback) {
      installPromptCallback(false);
    }
  }
};

// Show install prompt
export const showInstallPrompt = async (): Promise<'accepted' | 'dismissed' | 'not-available'> => {
  if (!deferredPrompt) {
    console.log('PWA: Install prompt not available');
    return 'not-available';
  }

  try {
    console.log('PWA: Showing install prompt');

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    console.log('PWA: User choice:', choiceResult.outcome);

    // Track analytics
    if (choiceResult.outcome === 'accepted') {
      pwaAnalytics.trackInstallAccepted();
    } else {
      pwaAnalytics.trackInstallDismissed();
    }

    // Reset the deferred prompt
    deferredPrompt = null;

    if (installPromptCallback) {
      installPromptCallback(false);
    }

    return choiceResult.outcome;
  } catch (error) {
    console.error('PWA: Error showing install prompt:', error);
    return 'dismissed';
  }
};

// Check if app can be installed
export const canInstall = (): boolean => {
  return deferredPrompt !== null;
};

// Check if app is installed
export const isInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Add to home screen for iOS
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const showIOSInstallInstructions = () => {
  if (isIOSDevice() && !isInstalled()) {
    alert(
      'For at installere denne app på din iOS-enhed:\n\n' +
      '1. Tryk på del-ikonet (firkant med pil op)\n' +
      '2. Vælg "Føj til startskærm"\n' +
      '3. Tryk "Tilføj" for at bekræfte'
    );
  }
};

// Initialize PWA
export const initializePWA = (installCallback?: (canInstall: boolean) => void) => {
  // Register service worker
  registerServiceWorker();

  // Setup install prompt
  setupInstallPrompt(installCallback);

  console.log('PWA: Initialized successfully');
};