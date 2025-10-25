/**
 * RenOS Calendar Intelligence MCP - HTTP Server
 * Express HTTP API wrapper for cloud deployment (Render.com)
 */

import express, { Request, Response } from 'express';
import os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger.js';
import config, { validateConfiguration } from './config.js';

// Import integrations
import { initPrisma } from './integrations/database.js';
import { initCalendar } from './integrations/google-calendar.js';
import { initTwilio } from './integrations/twilio-voice.js';

// Import tool implementations
import { validateBookingDate, checkBookingConflicts } from './tools/booking-validator.js';
import { autoCreateInvoice } from './tools/invoice-automation.js';
import { trackOvertimeRisk } from './tools/overtime-tracker.js';
import { getCustomerMemory } from './tools/customer-memory.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.server.port;

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.debug('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// ==================== HEALTH CHECK ====================

app.get('/health', async (req: Request, res: Response) => {
  const checks = {
    database: !!config.supabase.isConfigured,
    googleCalendar: !!config.google.isConfigured,
    billyMcp: !!config.billy.isConfigured,
    twilio: !!config.twilio.isConfigured && config.features.voiceAlerts,
  };

  const configValidation = validateConfiguration();

  res.json({
    status: configValidation.valid ? 'healthy' : 'degraded',
    version: '0.1.0',
    uptime: process.uptime(),
    checks,
    configuration: {
      valid: configValidation.valid,
      errors: configValidation.errors,
    },
    features: config.features,
    timestamp: new Date().toISOString(),
  });
});

// ==================== DIAGNOSTICS SNAPSHOT ====================

app.get('/diagnostics/snapshot', async (req: Request, res: Response) => {
  const now = new Date();
  const memory = process.memoryUsage();

  const checks = {
    databaseConfigured: !!config.supabase.isConfigured,
    googleCalendarConfigured: !!config.google.isConfigured,
    billyMcpConfigured: !!config.billy.isConfigured,
    twilioConfigured: !!config.twilio.isConfigured && config.features.voiceAlerts,
  };

  res.json({
    status: 'ok',
    timestamp: now.toISOString(),
    version: '0.1.0',
    environment: config.server.env,
    uptimeSeconds: Math.round(process.uptime()),
    process: {
      pid: process.pid,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    },
    system: {
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMB: Math.round(os.freemem() / (1024 * 1024)),
      loadAvg: os.loadavg(),
    },
    memoryMB: {
      rss: Math.round(memory.rss / (1024 * 1024)),
      heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
      heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
      external: Math.round(memory.external / (1024 * 1024)),
    },
    services: checks,
    features: config.features,
    endpoints: {
      health: '/health',
      tools: '/api/v1/tools',
      validateBookingDate: '/api/v1/tools/validate_booking_date',
      checkBookingConflicts: '/api/v1/tools/check_booking_conflicts',
      autoCreateInvoice: '/api/v1/tools/auto_create_invoice',
      trackOvertimeRisk: '/api/v1/tools/track_overtime_risk',
      getCustomerMemory: '/api/v1/tools/get_customer_memory',
    },
  });
});

// ==================== MCP TOOLS ENDPOINTS ====================

// Tool 1: Validate Booking Date
app.post('/api/v1/tools/validate_booking_date', async (req: Request, res: Response) => {
  try {
    const result = await validateBookingDate(req.body);
    res.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    logger.error('API error: validate_booking_date', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Tool 2: Check Booking Conflicts
app.post('/api/v1/tools/check_booking_conflicts', async (req: Request, res: Response) => {
  try {
    const result = await checkBookingConflicts(req.body);
    res.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    logger.error('API error: check_booking_conflicts', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFLICT_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Tool 3: Auto Create Invoice
app.post('/api/v1/tools/auto_create_invoice', async (req: Request, res: Response) => {
  try {
    const result = await autoCreateInvoice(req.body);
    res.json({
      success: result.status !== 'failed',
      data: result,
    });
  } catch (error) {
    logger.error('API error: auto_create_invoice', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVOICE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Tool 4: Track Overtime Risk
app.post('/api/v1/tools/track_overtime_risk', async (req: Request, res: Response) => {
  try {
    const result = await trackOvertimeRisk(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('API error: track_overtime_risk', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OVERTIME_TRACKING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Tool 5: Get Customer Memory
app.post('/api/v1/tools/get_customer_memory', async (req: Request, res: Response) => {
  try {
    const result = await getCustomerMemory(req.body);
    res.json({
      success: result.found,
      data: result,
    });
  } catch (error) {
    logger.error('API error: get_customer_memory', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CUSTOMER_MEMORY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// ==================== UTILITY ENDPOINTS ====================

// List available tools
app.get('/api/v1/tools', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      tools: [
        {
          name: 'validate_booking_date',
          description: 'Validér booking dato og tjek mod ugedag. Stopper "28. oktober er mandag" fejl.',
          endpoint: '/api/v1/tools/validate_booking_date',
        },
        {
          name: 'check_booking_conflicts',
          description: 'Tjek for dobbeltbookinger i Google Calendar. 0 dobbeltbookinger garanteret!',
          endpoint: '/api/v1/tools/check_booking_conflicts',
        },
        {
          name: 'auto_create_invoice',
          description: 'Automatisk opret faktura via Billy.dk MCP. Ingen glemte fakturaer nogensinde!',
          endpoint: '/api/v1/tools/auto_create_invoice',
        },
        {
          name: 'track_overtime_risk',
          description: 'Track job duration og send voice alerts ved overtid.',
          endpoint: '/api/v1/tools/track_overtime_risk',
        },
        {
          name: 'get_customer_memory',
          description: 'Hent komplet kunde-intelligence: mønstre, præferencer, historik.',
          endpoint: '/api/v1/tools/get_customer_memory',
        },
      ],
      count: 5,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint not found: ${req.method} ${req.path}`,
    },
  });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: Function) => {
  logger.error('Unhandled error in HTTP server', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.server.isProduction ? 'Internal server error' : error.message,
    },
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Initialize integrations
    logger.info('Initializing integrations...');
    
    initPrisma();
    initCalendar();
    initTwilio();

    // Validate configuration
    const configValidation = validateConfiguration();
    if (!configValidation.valid) {
      logger.warn('Configuration issues detected', {
        errors: configValidation.errors,
      });
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info('RenOS Calendar Intelligence HTTP Server started', {
        port: PORT,
        env: config.server.env,
        tools: 5,
        url: `http://localhost:${PORT}`,
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${PORT}/health`,
        tools: `http://localhost:${PORT}/api/v1/tools`,
        validateDate: `http://localhost:${PORT}/api/v1/tools/validate_booking_date`,
        checkConflicts: `http://localhost:${PORT}/api/v1/tools/check_booking_conflicts`,
        autoInvoice: `http://localhost:${PORT}/api/v1/tools/auto_create_invoice`,
        trackOvertime: `http://localhost:${PORT}/api/v1/tools/track_overtime_risk`,
        customerMemory: `http://localhost:${PORT}/api/v1/tools/get_customer_memory`,
      });
    });
  } catch (error) {
    logger.error('Fatal error starting HTTP server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server
startServer();

