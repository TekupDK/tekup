import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException as any;
    
    if (error && typeof error === 'object') {
      // Skip timeout errors
      if (error.message?.includes('timeout')) return null;
      
      // Skip database connection errors during cold starts
      if (error.message?.includes('connection')) return null;
    }
    
    return event;
  },
});
