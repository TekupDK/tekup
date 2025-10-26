import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';
import Redis from 'ioredis';

// Types
interface ServiceConfig {
  id: string;
  name: string;
  baseUrl: string;
  healthPath?: string;
  enabled: boolean;
  routes: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/api-gateway-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/api-gateway.log' })
  ]
});

class APIGateway {
  private app: express.Application;
  private redis: Redis;
  private services: Map<string, ServiceConfig> = new Map();
  private healthStatus: Map<string, HealthStatus> = new Map();
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.API_GATEWAY_PORT || '3000');
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.setupMiddleware();
    this.registerServices();
    this.setupRoutes();
    this.startHealthChecks();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-User-ID']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  private registerServices(): void {
    const services: ServiceConfig[] = [
      {
        id: 'ai-proposal-engine',
        name: 'AI Proposal Engine',
        baseUrl: process.env.AI_PROPOSAL_ENGINE_URL || 'http://localhost:3001',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/proposals', '/api/v1/buying-signals'],
        rateLimit: { windowMs: 60000, max: 100 }
      },
      {
        id: 'ai-content-generator',
        name: 'AI Content Generator',
        baseUrl: process.env.AI_CONTENT_GENERATOR_URL || 'http://localhost:3002',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/content', '/api/v1/generation'],
        rateLimit: { windowMs: 60000, max: 50 }
      },
      {
        id: 'ai-customer-support',
        name: 'AI Customer Support',
        baseUrl: process.env.AI_CUSTOMER_SUPPORT_URL || 'http://localhost:3003',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/support', '/api/v1/sessions', '/api/v1/chatbot'],
        rateLimit: { windowMs: 60000, max: 200 }
      },
      {
        id: 'ai-analytics-platform',
        name: 'AI Analytics Platform',
        baseUrl: process.env.AI_ANALYTICS_PLATFORM_URL || 'http://localhost:3004',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/analytics', '/api/v1/predictions', '/api/v1/models'],
        rateLimit: { windowMs: 60000, max: 300 }
      },
      {
        id: 'enhanced-crm',
        name: 'Enhanced CRM',
        baseUrl: process.env.ENHANCED_CRM_URL || 'http://localhost:3005',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/crm', '/api/v1/leads', '/api/v1/scoring'],
        rateLimit: { windowMs: 60000, max: 500 }
      },
      {
        id: 'marketing-automation',
        name: 'Marketing Automation',
        baseUrl: process.env.MARKETING_AUTOMATION_URL || 'http://localhost:3006',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/marketing', '/api/v1/campaigns', '/api/v1/automation'],
        rateLimit: { windowMs: 60000, max: 100 }
      },
      {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        baseUrl: process.env.BUSINESS_INTELLIGENCE_URL || 'http://localhost:3007',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/bi', '/api/v1/reports', '/api/v1/dashboards'],
        rateLimit: { windowMs: 60000, max: 200 }
      },
      {
        id: 'project-management',
        name: 'Project Management',
        baseUrl: process.env.PROJECT_MANAGEMENT_URL || 'http://localhost:3008',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/projects', '/api/v1/tasks', '/api/v1/collaboration'],
        rateLimit: { windowMs: 60000, max: 300 }
      },
      {
        id: 'voice-ai-cv',
        name: 'Voice AI & Computer Vision',
        baseUrl: process.env.VOICE_AI_CV_URL || 'http://localhost:3009',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/voice', '/api/v1/vision', '/api/v1/multimedia'],
        rateLimit: { windowMs: 60000, max: 50 }
      },
      {
        id: 'predictive-models',
        name: 'Predictive Models',
        baseUrl: process.env.PREDICTIVE_MODELS_URL || 'http://localhost:3010',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/models', '/api/v1/predictions', '/api/v1/training'],
        rateLimit: { windowMs: 60000, max: 100 }
      },
      {
        id: 'tekup-crm-api',
        name: 'Tekup CRM API',
        baseUrl: process.env.TEKUP_CRM_API_URL || 'http://localhost:3333',
        healthPath: '/health',
        enabled: true,
        routes: ['/api/v1/contacts', '/api/v1/companies', '/api/v1/deals', '/api/v1/activities'],
        rateLimit: { windowMs: 60000, max: 1000 }
      }
    ];

    services.forEach(service => {
      this.services.set(service.id, service);
      this.healthStatus.set(service.id, {
        service: service.id,
        status: 'unknown',
        lastCheck: new Date()
      });
    });

    logger.info('Registered services', { count: services.length, services: services.map(s => s.id) });
  }

  private setupRoutes(): void {
    // Health check endpoint for the gateway itself
    this.app.get('/health', (req, res) => {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Array.from(this.healthStatus.values()),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      res.json(healthData);
    });

    // Service discovery endpoint
    this.app.get('/api/v1/services', (req, res) => {
      const serviceList = Array.from(this.services.values()).map(service => ({
        id: service.id,
        name: service.name,
        enabled: service.enabled,
        routes: service.routes,
        status: this.healthStatus.get(service.id)?.status || 'unknown'
      }));
      res.json({ services: serviceList });
    });

    // Authentication middleware for protected routes
    const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No authorization token provided' });
        }

        // Validate token (implement your JWT validation logic here)
        // For now, we'll assume any token is valid
        req.headers['x-user-id'] = 'user-123'; // Extract from JWT
        req.headers['x-tenant-id'] = 'tenant-123'; // Extract from JWT
        
        next();
      } catch (error) {
        logger.error('Authentication error', { error: error.message });
        res.status(401).json({ error: 'Invalid authorization token' });
      }
    };

    // Setup service proxies
    this.services.forEach((service, serviceId) => {
      if (!service.enabled) return;

      service.routes.forEach(route => {
        // Apply service-specific rate limiting
        if (service.rateLimit) {
          const serviceRateLimit = rateLimit({
            windowMs: service.rateLimit.windowMs,
            max: service.rateLimit.max,
            message: `Rate limit exceeded for ${service.name}`,
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => `${req.ip}:${serviceId}`
          });
          this.app.use(route, serviceRateLimit);
        }

        // Apply authentication to all routes except health checks
        if (!route.includes('/health')) {
          this.app.use(route, authMiddleware);
        }

        // Create proxy middleware
        const proxyMiddleware = createProxyMiddleware({
          target: service.baseUrl,
          changeOrigin: true,
          pathRewrite: {
            [`^${route}`]: route // Keep the original path
          },
          onProxyReq: (proxyReq, req) => {
            // Add service metadata to requests
            proxyReq.setHeader('X-Gateway-Service', serviceId);
            proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
            
            // Forward user and tenant information
            if (req.headers['x-user-id']) {
              proxyReq.setHeader('X-User-ID', req.headers['x-user-id'] as string);
            }
            if (req.headers['x-tenant-id']) {
              proxyReq.setHeader('X-Tenant-ID', req.headers['x-tenant-id'] as string);
            }
          },
          onProxyRes: (proxyRes, req, res) => {
            // Add gateway headers to responses
            proxyRes.headers['X-Gateway-Service'] = serviceId;
            proxyRes.headers['X-Gateway-Timestamp'] = new Date().toISOString();
          },
          onError: (err, req, res) => {
            logger.error('Proxy error', {
              service: serviceId,
              route,
              error: err.message,
              url: req.url
            });
            
            // Update service health status
            this.healthStatus.set(serviceId, {
              service: serviceId,
              status: 'unhealthy',
              lastCheck: new Date(),
              error: err.message
            });

            res.status(503).json({
              error: 'Service temporarily unavailable',
              service: service.name,
              timestamp: new Date().toISOString()
            });
          }
        });

        this.app.use(route, proxyMiddleware);
        logger.info('Registered proxy route', { service: serviceId, route, target: service.baseUrl });
      });
    });

    // Catch-all for unmatched routes
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', { method: req.method, url: req.url });
      res.status(404).json({
        error: 'Route not found',
        availableServices: Array.from(this.services.keys()),
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const start = Date.now();
    try {
      const healthUrl = `${service.baseUrl}${service.healthPath || '/health'}`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: 5000
      });

      const responseTime = Date.now() - start;
      const status = response.ok ? 'healthy' : 'unhealthy';

      this.healthStatus.set(service.id, {
        service: service.id,
        status,
        lastCheck: new Date(),
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });

      // Cache health status in Redis
      await this.redis.setex(
        `health:${service.id}`,
        60, // 1 minute TTL
        JSON.stringify(this.healthStatus.get(service.id))
      );

    } catch (error) {
      const responseTime = Date.now() - start;
      this.healthStatus.set(service.id, {
        service: service.id,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      logger.warn('Service health check failed', {
        service: service.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
    }
  }

  private startHealthChecks(): void {
    // Initial health check
    this.services.forEach(service => {
      if (service.enabled && service.healthPath) {
        this.checkServiceHealth(service);
      }
    });

    // Periodic health checks every 30 seconds
    setInterval(() => {
      this.services.forEach(service => {
        if (service.enabled && service.healthPath) {
          this.checkServiceHealth(service);
        }
      });
    }, 30000);

    logger.info('Health checks started', { interval: '30s' });
  }

  public async start(): Promise<void> {
    try {
      this.app.listen(this.port, '0.0.0.0', () => {
        logger.info('API Gateway started', {
          port: this.port,
          services: this.services.size,
          env: process.env.NODE_ENV || 'development'
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        this.shutdown();
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        this.shutdown();
      });

    } catch (error) {
      logger.error('Failed to start API Gateway', { error: error.message });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('API Gateway shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Start the API Gateway
const gateway = new APIGateway();
gateway.start().catch(error => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});

export default APIGateway;

