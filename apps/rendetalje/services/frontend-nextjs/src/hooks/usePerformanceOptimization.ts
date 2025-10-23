import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { debounce, throttle } from 'lodash';

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled callbacks
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback as T;
}

// Hook for debounced callbacks
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback as T;
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [ref, isIntersecting];
}

// Hook for virtual scrolling
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
  };
}

// Hook for memoized expensive calculations
export function useExpensiveCalculation<T, D extends readonly unknown[]>(
  calculation: () => T,
  deps: D
): T {
  return useMemo(calculation, deps);
}

// Hook for performance monitoring
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        
        // Send to analytics if needed
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: name,
            value: Math.round(duration)
          });
        }
      }
    };
  }, [name]);

  const measure = useCallback((label: string) => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`Performance: ${name} - ${label} took ${duration.toFixed(2)}ms`);
    }
  }, [name]);

  return { measure };
}

// Hook for image lazy loading with placeholder
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setIsError(true);
      };
      
      img.src = src;
    }
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isIntersecting
  };
}

// Hook for optimized search
export function useOptimizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseSearch);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowercaseSearch);
        }
        return false;
      });
    });
  }, [items, debouncedSearchTerm, searchFields]);

  return {
    filteredItems,
    isSearching: searchTerm !== debouncedSearchTerm,
    searchTerm: debouncedSearchTerm
  };
}

// Hook for batch operations
export function useBatchOperations<T>(
  batchSize: number = 10,
  delay: number = 100
) {
  const [queue, setQueue] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const addToQueue = useCallback((items: T | T[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setQueue(prev => [...prev, ...itemsArray]);
  }, []);

  const processBatch = useCallback(async (
    processor: (batch: T[]) => Promise<void>
  ) => {
    if (processingRef.current || queue.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      while (queue.length > 0) {
        const batch = queue.splice(0, batchSize);
        await processor(batch);
        
        // Small delay between batches to prevent blocking
        if (queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setQueue([]);
    }
  }, [queue, batchSize, delay]);

  return {
    addToQueue,
    processBatch,
    queueLength: queue.length,
    isProcessing
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getMemoryUsagePercentage = useCallback(() => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  }, [memoryInfo]);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    memoryInfo,
    getMemoryUsagePercentage,
    formatBytes,
    formattedUsage: memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : null
  };
}

// Hook for component render optimization
export function useRenderOptimization(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${componentName} rendered ${renderCountRef.current} times. ` +
        `Time since last render: ${timeSinceLastRender}ms`
      );
    }
  });

  return {
    renderCount: renderCountRef.current,
    resetRenderCount: () => {
      renderCountRef.current = 0;
    }
  };
}