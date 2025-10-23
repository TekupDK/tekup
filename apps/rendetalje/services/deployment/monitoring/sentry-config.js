// Sentry Configuration for RendetaljeOS Production Monitoring

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Backend Sentry Configuration
const initBackendSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: true }),
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.Redis(),
    ],
    
    // Release tracking
    release: process.env.RENDER_GIT_COMMIT || 'unknown',
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      if (error && error.message) {
        // Skip database connection timeouts during maintenance
        if (error.message.includes('connection timeout')) {
          return null;
        }
        
        // Skip rate limiting errors
        if (error.message.includes('Too Many Requests')) {
          return null;
        }
        
        // Skip validation errors (they're expected)
        if (error.name === 'ValidationError') {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'backend',
        service: 'rendetalje-api'
      },
      user: {
        id: 'system'
      }
    },
    
    // Debug options
    debug: process.env.NODE_ENV === 'development',
    
    // Breadcrumbs
    maxBreadcrumbs: 50,
    
    // Attach stack traces
    attachStacktrace: true,
    
    // Send default PII
    sendDefaultPii: false,
    
    // Server name
    serverName: process.env.RENDER_SERVICE_NAME || 'rendetalje-backend',
  });
  
  // Add request context
  Sentry.addGlobalEventProcessor((event) => {
    if (event.request) {
      // Remove sensitive data from requests
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      if (event.request.data) {
        // Remove password fields
        if (typeof event.request.data === 'object') {
          const sanitized = { ...event.request.data };
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.apiKey;
          event.request.data = sanitized;
        }
      }
    }
    
    return event;
  });
};

// Frontend Sentry Configuration (Next.js)
const frontendSentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
  
  // Integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    const error = hint.originalException;
    
    if (error && error.message) {
      // Skip network errors
      if (error.message.includes('Network Error')) {
        return null;
      }
      
      // Skip cancelled requests
      if (error.message.includes('cancelled')) {
        return null;
      }
      
      // Skip ResizeObserver errors (common browser issue)
      if (error.message.includes('ResizeObserver')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Additional context
  initialScope: {
    tags: {
      component: 'frontend'
    }
  },
  
  // Debug options
  debug: process.env.NODE_ENV === 'development',
  
  // Breadcrumbs
  maxBreadcrumbs: 100,
  
  // Attach stack traces
  attachStacktrace: true,
  
  // Send default PII
  sendDefaultPii: false,
};

// Mobile App Sentry Configuration (React Native)
const mobileSentryConfig = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  
  // Integrations
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
    }),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    const error = hint.originalException;
    
    if (error && error.message) {
      // Skip network timeouts
      if (error.message.includes('timeout')) {
        return null;
      }
      
      // Skip permission errors
      if (error.message.includes('permission')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Additional context
  initialScope: {
    tags: {
      component: 'mobile'
    }
  },
  
  // Debug options
  debug: __DEV__,
  
  // Native crash handling
  enableNativeCrashHandling: true,
  
  // Auto session tracking
  enableAutoSessionTracking: true,
  
  // Native integrations
  enableNativeFramesTracking: true,
};

// Custom error reporting functions
const reportError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Set level based on error type
    if (error.name === 'ValidationError') {
      scope.setLevel('warning');
    } else if (error.name === 'NotFoundError') {
      scope.setLevel('info');
    } else {
      scope.setLevel('error');
    }
    
    Sentry.captureException(error);
  });
};

const reportMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    Sentry.captureMessage(message);
  });
};

// Performance monitoring helpers
const startTransaction = (name, op = 'http') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

const measureFunction = (fn, name) => {
  return Sentry.trace(fn, name);
};

// User context helpers
const setUserContext = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
};

const clearUserContext = () => {
  Sentry.setUser(null);
};

// Custom tags and context
const setCustomContext = (key, value) => {
  Sentry.setContext(key, value);
};

const setCustomTag = (key, value) => {
  Sentry.setTag(key, value);
};

// Health check for Sentry
const sentryHealthCheck = () => {
  try {
    Sentry.captureMessage('Sentry health check', 'info');
    return true;
  } catch (error) {
    console.error('Sentry health check failed:', error);
    return false;
  }
};

module.exports = {
  // Configuration
  initBackendSentry,
  frontendSentryConfig,
  mobileSentryConfig,
  
  // Error reporting
  reportError,
  reportMessage,
  
  // Performance monitoring
  startTransaction,
  measureFunction,
  
  // User context
  setUserContext,
  clearUserContext,
  
  // Custom context
  setCustomContext,
  setCustomTag,
  
  // Health check
  sentryHealthCheck,
  
  // Direct Sentry access
  Sentry,
};