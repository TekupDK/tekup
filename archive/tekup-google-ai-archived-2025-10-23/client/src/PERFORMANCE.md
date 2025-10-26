# ⚡ RenOS Performance Optimization Guide

## Oversigt
RenOS er optimeret for høj performance med moderne teknikker som code splitting, lazy loading og intelligent caching.

## Performance Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s

### Bundle Size Targets
- **Initial Bundle**: < 250KB gzipped
- **Total Bundle**: < 1MB gzipped
- **Vendor Bundle**: < 500KB gzipped
- **CSS Bundle**: < 50KB gzipped

## Code Splitting Strategy

### Route-based Splitting
```typescript
// Lazy load alle sider
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Customers = lazy(() => import('../pages/Customers/Customers'));
const Leads = lazy(() => import('../pages/Leads/Leads'));
const Bookings = lazy(() => import('../pages/Bookings/Bookings'));
const Quotes = lazy(() => import('../pages/Quotes/Quotes'));
const Analytics = lazy(() => import('../pages/Analytics/Analytics'));
const Services = lazy(() => import('../pages/Services/Services'));
const Settings = lazy(() => import('../pages/Settings/Settings'));

// Suspense wrapper
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/customers" element={<Customers />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### Component-based Splitting
```typescript
// Lazy load store komponenter
const Customer360 = lazy(() => import('../components/Customer360'));
const Analytics = lazy(() => import('../components/Analytics'));
const EmailApproval = lazy(() => import('../components/EmailApproval'));

// Conditional loading
{showCustomer360 && (
  <Suspense fallback={<div>Loading...</div>}>
    <Customer360 />
  </Suspense>
)}
```

### Library Splitting
```typescript
// Split store libraries
const Chart = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const DatePicker = lazy(() => import('react-datepicker').then(module => ({ default: module.default })));
```

## Bundle Analysis

### Vite Bundle Analyzer
```bash
# Install analyzer
npm install --save-dev vite-bundle-analyzer

# Add to vite.config.ts
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    analyzer({
      analyzerMode: 'server',
      openAnalyzer: true
    })
  ]
});
```

### Bundle Size Monitoring
```json
// package.json
{
  "scripts": {
    "analyze": "vite build --mode analyze",
    "bundle-size": "npx bundlesize"
  },
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "250kb"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50kb"
    }
  ]
}
```

## Image Optimization

### Next-gen Formats
```typescript
// Use WebP/AVIF for images
const ImageOptimizer = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);
  
  useEffect(() => {
    // Check WebP support
    const canvas = document.createElement('canvas');
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (webpSupported) {
      setImageSrc(src.replace(/\.(jpg|jpeg|png)$/, '.webp'));
    }
  }, [src]);
  
  return <img src={imageSrc} alt={alt} {...props} />;
};
```

### Lazy Loading Images
```typescript
// Lazy load images
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className="relative">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}
    </div>
  );
};
```

## Caching Strategy

### Service Worker Caching
```javascript
// sw.js - Advanced caching strategy
const CACHE_NAME = 'renos-v1';
const STATIC_CACHE = 'renos-static-v1';
const DYNAMIC_CACHE = 'renos-dynamic-v1';

// Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]);
    })
  );
});

// Cache API responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

### React Query Caching
```typescript
// API caching med React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
    },
  });
};
```

## Memory Management

### Component Optimization
```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveCalculation(item)
    }));
  }, [data]);
  
  return <div>{/* render */}</div>;
});

// Memoize callbacks
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
};
```

### Cleanup Effects
```typescript
// Cleanup subscriptions
useEffect(() => {
  const subscription = api.subscribe(data => {
    setData(data);
  });
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Cleanup timers
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => {
    clearInterval(timer);
  };
}, []);
```

## Virtual Scrolling

### Large List Optimization
```typescript
// Virtual scrolling for store lister
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <CustomerRow customer={items[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Infinite Scrolling
```typescript
// Infinite scrolling hook
const useInfiniteScroll = (fetchMore, hasMore) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef();
  
  const lastElementRef = useCallback((node) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setIsLoading(true);
        fetchMore().finally(() => setIsLoading(false));
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, fetchMore]);
  
  return { lastElementRef, isLoading };
};
```

## Network Optimization

### Request Deduplication
```typescript
// Deduplicate identical requests
const requestCache = new Map();

const deduplicatedFetch = async (url, options) => {
  const key = `${url}-${JSON.stringify(options)}`;
  
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }
  
  const promise = fetch(url, options);
  requestCache.set(key, promise);
  
  // Clean up after 5 minutes
  setTimeout(() => {
    requestCache.delete(key);
  }, 5 * 60 * 1000);
  
  return promise;
};
```

### Request Batching
```typescript
// Batch multiple requests
const useBatchedRequests = () => {
  const [batch, setBatch] = useState([]);
  const timeoutRef = useRef();
  
  const addToBatch = useCallback((request) => {
    setBatch(prev => [...prev, request]);
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      processBatch();
    }, 100); // 100ms batching window
  }, []);
  
  const processBatch = async () => {
    if (batch.length === 0) return;
    
    const requests = batch.splice(0);
    const results = await Promise.all(requests);
    
    // Process results
    results.forEach((result, index) => {
      requests[index].resolve(result);
    });
  };
  
  return { addToBatch };
};
```

## Performance Monitoring

### Web Vitals Tracking
```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance Observer
```typescript
// Monitor performance
const usePerformanceMonitoring = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

## Build Optimization

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### Tree Shaking
```typescript
// Import only what you need
import { debounce } from 'lodash-es/debounce';
import { format } from 'date-fns/format';

// Instead of
import _ from 'lodash';
import * as dateFns from 'date-fns';
```

## Testing Performance

### Performance Tests
```typescript
// Performance test example
describe('Performance', () => {
  it('should load dashboard within 2 seconds', async () => {
    const start = performance.now();
    
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    
    const end = performance.now();
    expect(end - start).toBeLessThan(2000);
  });
});
```

### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## Best Practices

### 1. Code Splitting
- Split by route
- Split by feature
- Split large libraries
- Use dynamic imports

### 2. Caching
- Cache static assets
- Cache API responses
- Use appropriate cache headers
- Implement cache invalidation

### 3. Bundle Size
- Monitor bundle size
- Use tree shaking
- Remove unused code
- Optimize images

### 4. Performance Monitoring
- Track Core Web Vitals
- Monitor bundle size
- Test on slow networks
- Use performance budgets

## Tools

### Development
- **Vite Bundle Analyzer**: Bundle analysis
- **React DevTools Profiler**: Component profiling
- **Chrome DevTools**: Performance tab
- **Lighthouse**: Performance audit

### Production
- **Web Vitals**: Core Web Vitals tracking
- **Sentry**: Error monitoring
- **LogRocket**: Session replay
- **New Relic**: APM monitoring

## Support

### Resources
- **Web Vitals**: Google Web Vitals
- **React Performance**: React docs
- **Vite Performance**: Vite docs
- **Chrome DevTools**: Performance guide

### Community
- **GitHub Issues**: Performance bugs
- **Discord**: #renos-performance
- **Stack Overflow**: Performance questions
