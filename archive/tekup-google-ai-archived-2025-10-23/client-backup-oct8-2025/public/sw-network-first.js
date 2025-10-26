// Service Worker with Network-First Strategy for Dashboard Apps
// Version: 2.0 - Fixed cache-busting issues

// IMPORTANT: This version uses network-first for HTML to ensure cache-busting works
const CACHE_VERSION = '__BUILD_VERSION__'; // Will be injected during build
const CACHE_NAME = `renos-${CACHE_VERSION}`;

const STATIC_CACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png'
];

// Install event - cache critical resources only
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    console.log('[SW] Bypassing cache for API:', url.pathname);
    return event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - ingen internetforbindelse' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
  }

  // NETWORK-FIRST for HTML documents (ensures cache-busting works!)
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    console.log('[SW] Network-first for HTML:', url.pathname);
    return event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh HTML for offline fallback
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Offline - serving cached HTML');
          return caches.match(request);
        })
    );
  }

  // CACHE-FIRST for hashed assets (JS/CSS with [hash] in filename)
  // These filenames change when content changes, so cache-first is safe
  if (url.pathname.includes('/assets/') && /\.[a-f0-9]{8,}\.(js|css)/.test(url.pathname)) {
    console.log('[SW] Cache-first for hashed asset:', url.pathname);
    return event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }
          return fetch(request).then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }

  // NETWORK-FIRST for everything else (images, fonts, etc.)
  console.log('[SW] Network-first for resource:', url.pathname);
  return event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('[SW] Offline - serving cached resource');
        return caches.match(request);
      })
  );
});

// Message event - Handle commands from main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clear cache requested');
    event.waitUntil(
      caches.keys().then(keys => {
        return Promise.all(keys.map(key => caches.delete(key)));
      })
    );
  }
});

// Background sync (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement data sync logic here if needed
  console.log('[SW] Syncing offline data...');
}

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
