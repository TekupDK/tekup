# 📱 RenOS PWA Setup Guide

## Oversigt
RenOS er konfigureret som en Progressive Web App (PWA) med moderne features som offline support, push notifications og app-like experience.

## PWA Features

### ✅ Implementeret
- **Service Worker** - Offline support og caching
- **Web App Manifest** - App metadata og ikoner
- **Responsive Design** - Mobile-first approach
- **Glassmorphism UI** - Modern design system

### 🚧 Planlagt
- **Push Notifications** - Real-time updates
- **Background Sync** - Offline data sync
- **Install Prompts** - Native app installation

## Manifest Konfiguration

### manifest.json
```json
{
  "name": "RenOS - Rendetalje Management",
  "short_name": "RenOS",
  "description": "Moderne rendetalje management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1320",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "lang": "da",
  "dir": "ltr"
}
```

## Ikon Generering

### Krav til Ikoner
- **Apple Touch Icon**: 180x180px PNG
- **Favicon**: 32x32px PNG
- **PWA Icons**: 72x72 til 512x512px PNG
- **Maskable Icon**: 512x512px PNG med safe zone

### Ikon Struktur
```
public/icons/
├── favicon-32.png
├── apple-touch-icon-180.png
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png
├── icon-384.png
├── icon-512.png
└── icon-512-maskable.png
```

### Ikon Design Guidelines
```css
/* Safe zone for maskable icons */
.maskable-icon {
  /* 80% of 512px = 410px safe zone */
  width: 410px;
  height: 410px;
  /* Center in 512x512 canvas */
  margin: 51px;
}
```

## HTML Head Konfiguration

### index.html
```html
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- PWA Meta Tags -->
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#0b1320" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  
  <!-- Icons -->
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png">
  
  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Preloads (før hovedscript) -->
  <link rel="modulepreload" crossorigin href="/assets/vendor-2It2lbss.js">
  <link rel="modulepreload" crossorigin href="/assets/lucide-BdygZa7s.js">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/assets/index-BeGyBVWB.css" crossorigin>
  
  <!-- Scripts -->
  <script type="module" crossorigin src="/assets/index-COTLKrwt.js"></script>
  
  <title>RenOS - Rendetalje Management</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

## Service Worker

### sw.js
```javascript
const CACHE_NAME = 'renos-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### Service Worker Registration
```typescript
// main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

## Offline Support

### Offline Page
```typescript
// components/OfflinePage.tsx
const OfflinePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-12 shadow-2xl border border-glass/30 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">Ingen forbindelse</h1>
        <p className="text-muted-foreground mb-6">
          Tjek din internetforbindelse og prøv igen.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Prøv igen
        </button>
      </div>
    </div>
  );
};
```

### Network Status Hook
```typescript
// hooks/useNetworkStatus.ts
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

## Push Notifications

### Notification Service
```typescript
// services/notificationService.ts
export class NotificationService {
  static async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  static async showNotification(title: string, options: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
  
  static async subscribeToPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });
      return subscription;
    }
  }
}
```

## Performance Optimization

### Lazy Loading
```typescript
// Lazy load komponenter
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Customers = lazy(() => import('../pages/Customers/Customers'));

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/customers" element={<Customers />} />
  </Routes>
</Suspense>
```

### Code Splitting
```typescript
// Dynamic imports
const loadFeature = async (featureName: string) => {
  const module = await import(`../features/${featureName}`);
  return module.default;
};
```

## Testing PWA

### Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run PWA audit
lighthouse http://localhost:5173 --only-categories=pwa --output=html --output-path=./pwa-audit.html
```

### PWA Checklist
- [ ] Manifest valid
- [ ] Service Worker registered
- [ ] Icons in all required sizes
- [ ] Responsive design
- [ ] Offline functionality
- [ ] HTTPS enabled
- [ ] Fast loading
- [ ] Accessible

## Deployment

### Vercel Configuration
```json
// vercel.json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Environment Variables
```bash
# .env.production
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_API_URL=https://api.renos.dk
```

## Troubleshooting

### Common Issues

#### 1. Service Worker Not Registering
```typescript
// Check if SW is supported
if ('serviceWorker' in navigator) {
  // Register SW
} else {
  console.log('Service Worker not supported');
}
```

#### 2. Manifest Not Loading
```html
<!-- Check manifest path -->
<link rel="manifest" href="/manifest.json">
```

#### 3. Icons Not Showing
```json
// Check icon paths in manifest
{
  "src": "/icons/icon-192.png",
  "sizes": "192x192",
  "type": "image/png"
}
```

### Debug Tools
- **Chrome DevTools**: Application tab
- **Lighthouse**: PWA audit
- **Web App Manifest Validator**: Online tool
- **PWA Builder**: Microsoft tool

## Best Practices

### 1. Icon Design
- Use consistent design language
- Ensure good contrast
- Test on different backgrounds
- Follow platform guidelines

### 2. Performance
- Optimize images
- Use appropriate cache strategies
- Minimize bundle size
- Test on slow networks

### 3. User Experience
- Provide offline feedback
- Handle network errors gracefully
- Show loading states
- Maintain app state

## Support

### Resources
- **PWA Documentation**: MDN Web Docs
- **Lighthouse**: Google Lighthouse
- **PWA Builder**: Microsoft PWA Builder
- **Workbox**: Google Workbox

### Community
- **GitHub Issues**: Report bugs
- **Discord**: #renos-pwa
- **Stack Overflow**: PWA questions
