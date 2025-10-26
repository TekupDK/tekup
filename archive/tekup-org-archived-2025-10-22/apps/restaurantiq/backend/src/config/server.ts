/**
 * Express Server Configuration for RestaurantIQ
 * Sets up middleware, security, and server instance
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import session from 'express-session';
import connectRedis from 'connect-redis';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import { config } from './env';
import { loggers } from './logger';
import { createSessionStore, rateLimit as redisRateLimit } from './redis';
import { validateEnv } from '../middleware/validation';
import { errorHandler } from '../middleware/errorHandler';
import { notFoundHandler } from '../middleware/notFound';
import { requestId } from '../middleware/requestId';
import { tenantResolver } from '../middleware/tenant';

// Extend Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    tenant?: {
      id: string;
      subdomain: string;
      settings: any;
    };
    user?: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
    };
  }
}

// Create Redis session store
const RedisStore = connectRedis(session);
const sessionStore = new RedisStore({
  client: createSessionStore() as any,
  prefix: 'sess:',
});

// Configure CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.cors.allowedOrigins;
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.includes('*') ||
                     (config.isDevelopment && origin.includes('localhost'));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      loggers.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: config.cors.allowedMethods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
};

// Configure rate limiting
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to support multi-tenant
    keyGenerator: (req: Request): string => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const tenant = req.tenant?.id || 'no-tenant';
      const user = req.user?.id || 'anonymous';
      return `${ip}:${tenant}:${user}`;
    },
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      loggers.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        tenant: req.tenant?.id,
        user: req.user?.id,
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API requests
  api: createRateLimit(15 * 60 * 1000, 1000, 'Too many API requests'),
  
  // Authentication endpoints
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  
  // Password reset endpoints
  passwordReset: createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts'),
  
  // File upload endpoints
  upload: createRateLimit(60 * 60 * 1000, 20, 'Too many file uploads'),
  
  // Webhook endpoints
  webhook: createRateLimit(1 * 60 * 1000, 100, 'Too many webhook calls'),
};

// Configure response slowdown for excessive requests
const slowDownConfig = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 500, // Allow 500 requests per windowMs without delay
  delayMs: 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Configure session
const sessionConfig: session.SessionOptions = {
  store: sessionStore,
  secret: config.session.secret,
  name: config.session.name,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: config.isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: config.isProduction ? 'strict' : 'lax',
  },
  genid: () => uuidv4(),
};

// Configure Helmet security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
};

// Configure compression
const compressionConfig = {
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress if larger than 1KB
  level: config.isDevelopment ? 1 : 6, // Faster compression in development
};

// Configure Morgan logging
const morganFormat = config.isDevelopment
  ? 'dev'
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const morganStream = {
  write: (message: string) => {
    loggers.info(message.trim(), { source: 'http' });
  },
};

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();
  
  // Trust proxy (for rate limiting, IP detection, etc.)
  app.set('trust proxy', config.server.trustProxy);
  
  // Disable x-powered-by header
  app.disable('x-powered-by');
  
  // Request ID middleware (should be first)
  app.use(requestId);
  
  // Logging middleware
  app.use(morgan(morganFormat, { stream: morganStream }));
  
  // Security middleware
  app.use(helmet(helmetConfig));
  
  // CORS middleware
  app.use(cors(corsOptions));
  
  // Compression middleware
  app.use(compression(compressionConfig));
  
  // Body parsing middleware
  app.use(express.json({
    limit: config.server.maxRequestSize,
    verify: (req: any, res, buf) => {
      // Store raw body for webhook verification
      req.rawBody = buf;
    },
  }));
  
  app.use(express.urlencoded({
    extended: true,
    limit: config.server.maxRequestSize,
  }));
  
  // Session middleware
  app.use(session(sessionConfig));
  
  // Response slowdown middleware
  app.use(slowDownConfig);
  
  // General rate limiting
  app.use('/api', rateLimits.api);
  
  // Specific rate limits for auth endpoints
  app.use('/api/auth/login', rateLimits.auth);
  app.use('/api/auth/register', rateLimits.auth);
  app.use('/api/auth/reset-password', rateLimits.passwordReset);
  app.use('/api/auth/forgot-password', rateLimits.passwordReset);
  
  // File upload rate limits
  app.use('/api/*/upload', rateLimits.upload);
  app.use('/api/uploads', rateLimits.upload);
  
  // Webhook rate limits
  app.use('/api/webhooks', rateLimits.webhook);
  
  // Environment validation middleware
  app.use(validateEnv);
  
  // Tenant resolution middleware
  app.use(tenantResolver);
  
  // Health check endpoint (before other routes)
  app.get('/health', async (req: Request, res: Response) => {
    try {
      // Import health checks dynamically to avoid circular dependencies
      const { healthCheck: dbHealth } = await import('./database');
      const { healthCheck: redisHealth } = await import('./redis');
      
      const [dbStatus, redisStatus] = await Promise.all([
        dbHealth(),
        redisHealth(),
      ]);
      
      const overallStatus = dbStatus.status === 'healthy' && redisStatus.status === 'healthy' 
        ? 'healthy' 
        : 'unhealthy';
      
      const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        services: {
          database: dbStatus,
          redis: redisStatus,
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
      
      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      res.status(statusCode).json(response);
      
      if (overallStatus === 'unhealthy') {
        loggers.warn('Health check failed', response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      loggers.error('Health check error', { error: errorMessage });
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
    }
  });
  
  // API routes
  const apiRoutes = require('../routes/index').default;
  app.use('/api', apiRoutes);
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Global error handler (should be last)
  app.use(errorHandler);
  
  return app;
};

/**
 * Start the Express server
 */
export const startServer = (app: Express): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(config.server.port, config.server.host, () => {
        loggers.info('Server started successfully', {
          host: config.server.host,
          port: config.server.port,
          environment: config.nodeEnv,
          pid: process.pid,
        });
        resolve();
      });
      
      // Increase server timeout for long-running requests
      server.timeout = config.server.timeout;
      server.keepAliveTimeout = config.server.keepAliveTimeout;
      server.headersTimeout = config.server.headersTimeout;
      
      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        loggers.info(`Received ${signal}, starting graceful shutdown`);
        
        server.close(async (err) => {
          if (err) {
            loggers.error('Error during server shutdown', { error: err.message });
            process.exit(1);
          }
          
          try {
            // Close database connections
            const { closeDbConnections } = await import('./database');
            await closeDbConnections();
            
            // Close Redis connections
            const { closeRedisConnections } = await import('./redis');
            await closeRedisConnections();
            
            loggers.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            loggers.error('Error during graceful shutdown', { error: errorMessage });
            process.exit(1);
          }
        });
      };
      
      // Handle shutdown signals
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
      // Handle uncaught exceptions and unhandled rejections
      process.on('uncaughtException', (error) => {
        loggers.error('Uncaught exception', { error: error.message, stack: error.stack });
        process.exit(1);
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        loggers.error('Unhandled rejection', { reason, promise });
        process.exit(1);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loggers.error('Failed to start server', { error: errorMessage });
      reject(error);
    }
  });
};

export default createApp;
