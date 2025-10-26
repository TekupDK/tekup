const CACHE_NAME = 'tekup-pwa-v2025.09.13';
const STATIC_CACHE = 'tekup-static-v2025.09.13';
const DYNAMIC_CACHE = 'tekup-dynamic-v2025.09.13';
const API_CACHE = 'tekup-api-v2025.09.13';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/favicon.svg',
  // Production assets (built by Vite)
  '/assets/index.css',
  '/assets/index.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Route patterns for different caching strategies
const ROUTE_PATTERNS = [
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST, cache: API_CACHE },
  { pattern: /\.(css|js)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: STATIC_CACHE },
  { pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST, cache: STATIC_CACHE }
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching files');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('SW: Cache complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (!cacheName.includes('tekup-') || ![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip development URLs
  const devUrls = ['/@vite/', '/@react-refresh', '/node_modules/', '/src/', '/.vite/'];
  if (devUrls.some(pattern => event.request.url.includes(pattern))) {
    return;
  }

  // Handle navigation requests
  if (event.request.destination === 'document') {
    event.respondWith(
      caches.match('/').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Apply caching strategies
  const route = ROUTE_PATTERNS.find(route => route.pattern.test(event.request.url));

  if (route) {
    event.respondWith(handleCachingStrategy(event.request, route.strategy, route.cache));
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// Handle different caching strategies
async function handleCachingStrategy(request, strategy, cacheName) {
  const cache = await caches.open(cacheName);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return await cacheFirst(request, cache);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return await networkFirst(request, cache);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return await staleWhileRevalidate(request, cache);
    default:
      return await cacheFirst(request, cache);
  }
}

// Cache First Strategy
async function cacheFirst(request, cache) {
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  const response = await cachedResponse;
  if (response) {
    return response;
  }

  return await fetchPromise;
}

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Ny besked fra TekUp',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification('TekUp', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('SW: Background sync completed');
}