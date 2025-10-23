import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException as any;
    
    if (error && typeof error === 'object') {
      // Skip network errors
      if (error.message?.includes('Network Error')) return null;
      if (error.message?.includes('NetworkError')) return null;
      
      // Skip cancelled requests
      if (error.message?.includes('cancelled')) return null;
      if (error.message?.includes('canceled')) return null;
      
      // Skip ResizeObserver errors (common browser issue)
      if (error.message?.includes('ResizeObserver')) return null;
      
      // Skip hydration errors in development
      if (process.env.NODE_ENV === 'development' && 
          error.message?.includes('Hydration')) return null;
    }
    
    return event;
  },
});
