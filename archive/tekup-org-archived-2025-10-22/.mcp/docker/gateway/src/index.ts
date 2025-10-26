#!/usr/bin/env node

/**
 * @fileoverview TekUp MCP Gateway Service
 * 
 * Central API gateway that coordinates and load balances requests across
 * containerized MCP services with service discovery, health monitoring,
 * and unified configuration management.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { Registry } from 'prom-client';
import { counter, histogram, gauge } from 'prom-client';

import { loadMCPConfig } from '../../scripts/config-loader.js';
import { MCPServiceDiscovery } from './service-discovery.js';
import { MCPHealthMonitor } from './health-monitor.js';
import { MCPLoadBalancer } from './load-balancer.js';
import { MCPLogger } from './logger.js';
import { MCPMetrics } from './metrics.js';
import { MCPWebSocketHandler } from './websocket.js';

// =============================================================================
// ENVIRONMENT & CONFIGURATION
// =============================================================================

const PORT = parseInt(process.env.MCP_GATEWAY_PORT || '3000');
const HOST = process.env.MCP_GATEWAY_HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const MCP_ENV = process.env.MCP_ENV || 'development';

// =============================================================================
// GATEWAY CLASS
// =============================================================================

export class MCPGateway {
  private app: Application;
  private server: any;
  private io: SocketServer;
  private logger: MCPLogger;
  private config: any;
  private serviceDiscovery: MCPServiceDiscovery;
  private healthMonitor: MCPHealthMonitor;
  private loadBalancer: MCPLoadBalancer;
  private metrics: MCPMetrics;
  private wsHandler: MCPWebSocketHandler;
  
  constructor() {
    this.app = express();
    this.logger = new MCPLogger('gateway');
    this.metrics = new MCPMetrics();
  }
  
  /**
   * Initialize the gateway with configuration and services
   */
  async initialize(): Promise<void> {
    try {
      // Load configuration
      this.config = await loadMCPConfig();
      this.logger.info('Configuration loaded', { environment: MCP_ENV });
      
      // Initialize service discovery
      this.serviceDiscovery = new MCPServiceDiscovery(this.config, this.logger);
      await this.serviceDiscovery.initialize();
      
      // Initialize health monitoring
      this.healthMonitor = new MCPHealthMonitor(this.serviceDiscovery, this.logger);
      this.healthMonitor.startMonitoring();
      
      // Initialize load balancer
      this.loadBalancer = new MCPLoadBalancer(this.serviceDiscovery, this.logger);
      
      // Setup HTTP server and WebSocket
      this.server = createServer(this.app);
      this.io = new SocketServer(this.server, {
        cors: {
          origin: NODE_ENV === 'development' ? '*' : false,
          methods: ['GET', 'POST']
        }
      });
      
      // Initialize WebSocket handler
      this.wsHandler = new MCPWebSocketHandler(this.io, this.serviceDiscovery, this.logger);
      
      // Configure Express middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.logger.info('Gateway initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize gateway', error);
      throw error;
    }
  }
  
  /**
   * Setup Express middleware stack
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: NODE_ENV === 'development' ? '*' : this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-MCP-Service', 'X-Request-ID']
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Rate limiting
    if (NODE_ENV === 'production') {
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use(limiter);
    }
    
    // Request logging and metrics
    this.app.use(this.requestLoggingMiddleware.bind(this));
    this.app.use(this.metricsMiddleware.bind(this));
  }
  
  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.healthCheckHandler.bind(this));
    
    // Metrics endpoint for Prometheus
    this.app.get('/metrics', this.metricsHandler.bind(this));
    
    // Service discovery endpoints
    this.app.get('/api/services', this.getServicesHandler.bind(this));
    this.app.get('/api/services/:serviceId/health', this.getServiceHealthHandler.bind(this));
    
    // Configuration endpoints
    this.app.get('/api/config', this.getConfigHandler.bind(this));
    this.app.post('/api/config/reload', this.reloadConfigHandler.bind(this));
    
    // MCP Protocol endpoints - WebSocket upgrade
    this.app.get('/mcp/:serviceId', this.mcpWebSocketUpgradeHandler.bind(this));
    
    // Proxy endpoints for HTTP-based MCP services
    this.setupServiceProxies();
    
    // Catch-all route for unknown endpoints
    this.app.use('*', this.notFoundHandler.bind(this));
  }
  
  /**
   * Setup proxy routes for each MCP service
   */
  private setupServiceProxies(): void {
    const services = this.serviceDiscovery.getServices();
    
    for (const [serviceId, serviceConfig] of services) {
      const proxyPath = `/api/mcp/${serviceId}`;
      
      this.app.use(proxyPath, createProxyMiddleware({
        target: serviceConfig.url,
        changeOrigin: true,
        pathRewrite: {
          [`^${proxyPath}`]: ''
        },
        onProxyReq: (proxyReq, req: any, res) => {
          // Add custom headers
          proxyReq.setHeader('X-Forwarded-By', 'mcp-gateway');
          proxyReq.setHeader('X-Request-ID', req.requestId);
          
          this.logger.debug('Proxying request', {
            service: serviceId,
            path: req.path,
            method: req.method
          });
        },
        onError: (err, req, res: any) => {
          this.logger.error('Proxy error', {
            service: serviceId,
            error: err.message,
            path: req.url
          });
          
          this.metrics.incrementCounter('mcp_proxy_errors_total', {
            service: serviceId,
            error_type: err.code || 'unknown'
          });
          
          res.status(502).json({
            error: 'Service unavailable',
            service: serviceId,
            message: 'The requested MCP service is temporarily unavailable'
          });
        }
      }));
      
      this.logger.info('Proxy route configured', { service: serviceId, path: proxyPath });
    }
  }
  
  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(this.notFoundHandler.bind(this));
    
    // Global error handler
    this.app.use(this.errorHandler.bind(this));
    
    // Graceful shutdown handling
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    
    // Unhandled promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Promise Rejection', { reason, promise });
    });
    
    // Uncaught exception
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }
  
  // =============================================================================
  // MIDDLEWARE HANDLERS
  // =============================================================================
  
  private requestLoggingMiddleware(req: any, res: Response, next: NextFunction): void {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - req.startTime;
      this.logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    
    next();
  }
  
  private metricsMiddleware(req: any, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.metrics.incrementCounter('mcp_gateway_requests_total', {
        method: req.method,
        status_code: res.statusCode.toString(),
        path: req.route?.path || req.path
      });
      
      this.metrics.observeHistogram('mcp_gateway_request_duration_seconds', duration / 1000, {
        method: req.method,
        path: req.route?.path || req.path
      });
    });
    
    next();
  }
  
  // =============================================================================
  // ROUTE HANDLERS
  // =============================================================================
  
  private async healthCheckHandler(req: Request, res: Response): Promise<void> {
    const services = await this.healthMonitor.getAllServiceHealth();
    const overallHealth = Object.values(services).every(service => service.healthy);
    
    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: MCP_ENV,
      services
    });
  }
  
  private async metricsHandler(req: Request, res: Response): Promise<void> {
    res.set('Content-Type', this.metrics.register.contentType);
    res.end(await this.metrics.register.metrics());
  }
  
  private async getServicesHandler(req: Request, res: Response): Promise<void> {
    const services = this.serviceDiscovery.getServices();
    const servicesArray = Array.from(services.entries()).map(([id, config]) => ({
      id,
      ...config
    }));
    
    res.json({
      services: servicesArray,
      count: servicesArray.length
    });
  }
  
  private async getServiceHealthHandler(req: Request, res: Response): Promise<void> {
    const serviceId = req.params.serviceId;
    const health = await this.healthMonitor.getServiceHealth(serviceId);
    
    if (!health) {
      return res.status(404).json({
        error: 'Service not found',
        serviceId
      });
    }
    
    res.json(health);
  }
  
  private async getConfigHandler(req: Request, res: Response): Promise<void> {
    // Return sanitized configuration (remove sensitive data)
    const sanitizedConfig = this.sanitizeConfig(this.config);
    res.json(sanitizedConfig);
  }
  
  private async reloadConfigHandler(req: Request, res: Response): Promise<void> {
    try {
      this.config = await loadMCPConfig({ skipCache: true });
      await this.serviceDiscovery.updateConfiguration(this.config);
      
      this.logger.info('Configuration reloaded');
      res.json({
        message: 'Configuration reloaded successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to reload configuration', error);
      res.status(500).json({
        error: 'Failed to reload configuration',
        message: error.message
      });
    }
  }
  
  private mcpWebSocketUpgradeHandler(req: Request, res: Response): void {
    const serviceId = req.params.serviceId;
    
    if (!this.serviceDiscovery.hasService(serviceId)) {
      return res.status(404).json({
        error: 'Service not found',
        serviceId
      });
    }
    
    // WebSocket upgrade will be handled by Socket.IO
    res.json({
      message: 'Use WebSocket connection for MCP protocol',
      serviceId,
      endpoints: {
        websocket: `/socket.io/?service=${serviceId}`,
        http: `/api/mcp/${serviceId}`
      }
    });
  }
  
  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  private errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('Unhandled request error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    
    this.metrics.incrementCounter('mcp_gateway_errors_total', {
      error_type: error.constructor.name
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: NODE_ENV === 'development' ? error.message : 'Something went wrong',
      requestId: (req as any).requestId
    });
  }
  
  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  private getAllowedOrigins(): string[] {
    // Configure based on environment and config
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://app.tekup.org'
    ];
  }
  
  private sanitizeConfig(config: any): any {
    // Remove sensitive information from configuration
    const sanitized = JSON.parse(JSON.stringify(config));
    
    // Remove API keys and secrets
    const removeKeys = (obj: any): any => {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (key.toLowerCase().includes('key') || 
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('password')) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            removeKeys(obj[key]);
          }
        }
      }
      return obj;
    };
    
    return removeKeys(sanitized);
  }
  
  private async gracefulShutdown(signal: string): Promise<void> {
    this.logger.info('Received shutdown signal', { signal });
    
    try {
      // Stop accepting new connections
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });
      
      // Stop WebSocket server
      this.io.close(() => {
        this.logger.info('WebSocket server closed');
      });
      
      // Stop health monitoring
      if (this.healthMonitor) {
        this.healthMonitor.stopMonitoring();
      }
      
      // Cleanup service discovery
      if (this.serviceDiscovery) {
        await this.serviceDiscovery.cleanup();
      }
      
      this.logger.info('Gateway shutdown complete');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }
  
  /**
   * Start the gateway server
   */
  async start(): Promise<void> {
    await this.initialize();
    
    this.server.listen(PORT, HOST, () => {
      this.logger.info('MCP Gateway started', {
        port: PORT,
        host: HOST,
        environment: MCP_ENV,
        nodeVersion: process.version
      });
    });
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (require.main === module) {
  const gateway = new MCPGateway();
  
  gateway.start().catch((error) => {
    console.error('Failed to start MCP Gateway:', error);
    process.exit(1);
  });
}

export default MCPGateway;
