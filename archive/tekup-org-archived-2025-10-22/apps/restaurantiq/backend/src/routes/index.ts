/**
 * RestaurantIQ API Routes Index
 * Central router that mounts all API endpoints
 */

import { Router } from 'express';
import { loggers } from '../config/logger';

// Import route modules (will be created as we build them)
// import authRoutes from './auth';
// import tenantRoutes from './tenants';
// import locationRoutes from './locations';
// import inventoryRoutes from './inventory';
// import menuRoutes from './menu';
// import employeeRoutes from './employees';
// import scheduleRoutes from './schedules';
// import salesRoutes from './sales';
// import analyticsRoutes from './analytics';
// import reportRoutes from './reports';
// import uploadRoutes from './uploads';
// import webhookRoutes from './webhooks';

const router = Router();

/**
 * API Version and Info
 */
router.get('/', (req, res) => {
  res.json({
    name: 'RestaurantIQ API',
    version: '1.0.0',
    description: 'AI-powered restaurant management platform for Danish restaurants',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      tenants: '/api/tenants',
      locations: '/api/locations',
      inventory: '/api/inventory',
      menu: '/api/menu',
      employees: '/api/employees',
      schedules: '/api/schedules',
      sales: '/api/sales',
      analytics: '/api/analytics',
      reports: '/api/reports',
      uploads: '/api/uploads',
      webhooks: '/api/webhooks',
      health: '/health',
    },
    documentation: 'https://docs.restaurantiq.dk',
    support: 'support@restaurantiq.dk',
  });
});

/**
 * Mount route modules
 * TODO: Uncomment as routes are implemented
 */

// Authentication routes (public)
// router.use('/auth', authRoutes);

// Tenant management routes
// router.use('/tenants', tenantRoutes);

// Location management routes  
// router.use('/locations', locationRoutes);

// Inventory management routes
// router.use('/inventory', inventoryRoutes);

// Menu management routes
// router.use('/menu', menuRoutes);

// Employee management routes
// router.use('/employees', employeeRoutes);

// Schedule management routes
// router.use('/schedules', scheduleRoutes);

// Sales and POS integration routes
// router.use('/sales', salesRoutes);

// Analytics and reporting routes
// router.use('/analytics', analyticsRoutes);
// router.use('/reports', reportRoutes);

// File upload routes
// router.use('/uploads', uploadRoutes);

// Webhook routes (public)
// router.use('/webhooks', webhookRoutes);

/**
 * Development routes (only in development environment)
 */
if (process.env.NODE_ENV === 'development') {
  // Test endpoints for development
  router.get('/dev/test', (req, res) => {
    res.json({
      message: 'Development test endpoint',
      requestId: req.requestId,
      tenant: req.tenant,
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  });

  // Redis test endpoint
  router.get('/dev/redis', async (req, res) => {
    try {
      const { cache } = await import('../config/redis');
      
      // Test Redis operations
      const testKey = `test:${req.requestId}`;
      const testValue = { message: 'Redis test', timestamp: new Date().toISOString() };
      
      await cache.set(testKey, testValue, 60); // 1 minute TTL
      const retrievedValue = await cache.get(testKey);
      
      res.json({
        message: 'Redis test successful',
        testKey,
        setValue: testValue,
        getValue: retrievedValue,
        match: JSON.stringify(testValue) === JSON.stringify(retrievedValue),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Redis test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Database test endpoint
  router.get('/dev/database', async (req, res) => {
    try {
      const { db } = await import('../config/database');
      
      // Test database connection
      const result = await db.raw('SELECT NOW() as current_time');
      
      res.json({
        message: 'Database test successful',
        currentTime: result.rows?.[0]?.current_time || result[0]?.current_time,
        database: db.client.database,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Database test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  loggers.info('Development routes enabled');
}

/**
 * API Status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const { healthCheck: dbHealth } = await import('../config/database');
    const { healthCheck: redisHealth } = await import('../config/redis');
    
    const [dbStatus, redisStatus] = await Promise.all([
      dbHealth(),
      redisHealth(),
    ]);
    
    const overallStatus = dbStatus.status === 'healthy' && redisStatus.status === 'healthy' 
      ? 'operational' 
      : 'degraded';
    
    res.json({
      status: overallStatus,
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'operational' },
        database: dbStatus,
        redis: redisStatus,
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
