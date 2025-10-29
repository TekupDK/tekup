// RenOS Service Worker for PWA
const CACHE_NAME = "renos-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Ny opgave tildelt",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    tag: "renos-notification",
    requireInteraction: true,
    actions: [
      { action: "view", title: "Se opgave" },
      { action: "dismiss", title: "Luk" },
    ],
  };

  event.waitUntil(self.registration.showNotification("RenOS", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/tasks"));
  }
});

// Background sync event (for offline task assignment)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-assignments") {
    event.waitUntil(syncAssignments());
  }
});

async function syncAssignments() {
  try {
    // Get pending assignments from IndexedDB or cache
    // Send to server when online
    console.log("[ServiceWorker] Syncing pending assignments");

    // TODO: Implement actual sync logic with IndexedDB

    return Promise.resolve();
  } catch (error) {
    console.error("[ServiceWorker] Sync failed:", error);
    return Promise.reject(error);
  }
}
