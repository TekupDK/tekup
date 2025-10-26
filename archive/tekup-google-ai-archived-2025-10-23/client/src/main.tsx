import React from 'react'
import ReactDOM from 'react-dom/client'
import { SupabaseAuthProvider } from '../src/components/auth/SupabaseAuthProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'

// Setup React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
})

// Validate that the Supabase environment variables are available
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

// AGGRESSIVE CACHE CLEARING SYSTEM
// Version tracking prevents old code from persisting across deployments
const APP_VERSION = '2.0.0-cache-fix'; // Increment on breaking changes
const VERSION_KEY = 'renos-app-version';

// Check if app version changed -> force full reload
const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== APP_VERSION) {
  console.log(`🔄 Version changed: ${storedVersion} → ${APP_VERSION}`);
  console.log('   Clearing all caches and forcing reload...');

  // Clear localStorage except version key
  const keysToPreserve = ['supabase.auth.token'];
  Object.keys(localStorage).forEach(key => {
    if (!keysToPreserve.includes(key) && key !== VERSION_KEY) {
      localStorage.removeItem(key);
    }
  });

  // Update version and force reload
  localStorage.setItem(VERSION_KEY, APP_VERSION);

  // Only reload if not already reloading (prevents loop)
  if (!sessionStorage.getItem('reloading')) {
    sessionStorage.setItem('reloading', 'true');
    window.location.reload();
  }
  sessionStorage.removeItem('reloading');
}

// DISABLED: Service Worker was causing TWO critical issues:
// 1. Cache-first strategy prevented users from seeing new deployments (had to Ctrl+Shift+R)
// 2. Cached old JavaScript with relative '/api/' URLs causing CORS errors
//
// Solution: Remove Service Worker completely (dashboard apps don't need offline support)
// This code unregisters existing SWs from user browsers and clears all caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        console.log('🧹 Removing old service workers that caused cache + CORS issues...');
        console.log(`   Found ${registrations.length} service worker(s) to remove`);
        Promise.all(registrations.map(r => r.unregister()))
          .then(() => {
            console.log('✅ Service workers removed');
            // Clear all caches (renos-v1, etc.)
            caches.keys().then(keys => {
              if (keys.length > 0) {
                console.log(`   Clearing ${keys.length} cache(s):`, keys);
                Promise.all(keys.map(k => caches.delete(k)))
                  .then(() => {
                    console.log('✅ All caches cleared');
                    // Force reload after cache clear (only once)
                    if (!sessionStorage.getItem('cache-cleared')) {
                      sessionStorage.setItem('cache-cleared', 'true');
                      console.log('🔄 Reloading to apply changes...');
                      setTimeout(() => window.location.reload(), 500);
                    }
                  })
                  .catch(err => console.error('❌ Cache clear error:', err));
              }
            }).catch(err => console.error('❌ Cache keys error:', err));
          })
          .catch(err => console.error('❌ Unregister error:', err));
      } else {
        console.log('✅ No service workers found (clean state)');
        // Clear cache even if no SW (browser cache)
        caches.keys().then(keys => {
          if (keys.length > 0) {
            console.log(`   Found ${keys.length} orphan cache(s), clearing...`);
            Promise.all(keys.map(k => caches.delete(k))).catch(console.error);
          }
        }).catch(console.error);
      }
    }).catch(err => console.error('❌ Get registrations error:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseAuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </SupabaseAuthProvider>
  </React.StrictMode>,
)
