/**
 * Google MCP HTTP Server
 * HTTP REST API wrapper for Google MCP Server
 * Compatible with other chatbots and HTTP clients
 */

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { getGoogleMcpConfig, validateGoogleMcpConfig } from './config.js';
import { log, logError } from './utils/logger.js';

// Import tool functions
import * as calendarTools from './tools/calendar.js';
import * as gmailTools from './tools/gmail.js';

// Types
interface ToolCallRequest {
  tool: string;
  arguments: Record<string, any>;
}

interface ToolCallResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  google: {
    configured: boolean;
    impersonatedUser: string;
  };
}

// Initialize Express app
const app = express();
const config = getGoogleMcpConfig();
const PORT = config.server.port;
const API_VERSION = 'v1';

// Server information
const SERVER_INFO = {
  name: 'google-mcp-server',
  version: '1.0.0',
  description: 'Google Workspace MCP Server - Gmail and Calendar integration',
};

// Track server start time
const serverStartTime = Date.now();

// Trust proxy for cloud deployments
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API key authentication middleware
function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  // Skip auth in development mode if no API key is set
  if (config.server.environment === 'development' && !config.server.apiKey) {
    return next();
  }
  
  if (!apiKey || apiKey !== config.server.apiKey) {
    log.warn('Unauthorized API request', { ip: req.ip });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing API key',
    });
  }
  
  next();
}

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: SERVER_INFO.version,
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    google: {
      configured: config.google.isConfigured,
      impersonatedUser: config.google.impersonatedUser,
    },
  };
  
  res.json(health);
});

// Tool list endpoint
app.get(`/api/${API_VERSION}/tools/list`, authenticateApiKey, (req: Request, res: Response) => {
  try {
    const tools = [
      'list_calendar_events',
      'get_calendar_event',
      'create_calendar_event',
      'update_calendar_event',
      'delete_calendar_event',
      'check_calendar_conflicts',
      'list_emails',
      'get_email',
      'search_emails',
      'send_email',
      'get_email_labels',
      'mark_email_as_read',
    ];
    
    res.json({
      success: true,
      tools,
    });
  } catch (error) {
    logError('Failed to list tools', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Tool call endpoint
app.post(`/api/${API_VERSION}/tools/call`, authenticateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { tool, arguments: args } = req.body as ToolCallRequest;
    
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: tool',
      });
    }
    
    log.info('Tool call received', { tool, args });
    
    let result: any;
    
    // Calendar tools
    if (tool === 'list_calendar_events') {
      result = await calendarTools.listCalendarEvents(args || {});
    } else if (tool === 'get_calendar_event') {
      result = await calendarTools.getCalendarEvent(args);
    } else if (tool === 'create_calendar_event') {
      result = await calendarTools.createCalendarEvent(args);
    } else if (tool === 'update_calendar_event') {
      result = await calendarTools.updateCalendarEvent(args);
    } else if (tool === 'delete_calendar_event') {
      result = await calendarTools.deleteCalendarEvent(args);
    } else if (tool === 'check_calendar_conflicts') {
      result = await calendarTools.checkCalendarConflicts(args);
    }
    // Gmail tools
    else if (tool === 'list_emails') {
      result = await gmailTools.listEmails(args || {});
    } else if (tool === 'get_email') {
      result = await gmailTools.getEmailById(args);
    } else if (tool === 'search_emails') {
      result = await gmailTools.searchEmails(args);
    } else if (tool === 'send_email') {
      result = await gmailTools.sendEmail(args);
    } else if (tool === 'get_email_labels') {
      result = await gmailTools.getEmailLabels();
    } else if (tool === 'mark_email_as_read') {
      result = await gmailTools.markEmailAsRead(args);
    } else {
      return res.status(404).json({
        success: false,
        error: `Unknown tool: ${tool}`,
      });
    }
    
    const executionTime = Date.now() - startTime;
    
    const response: ToolCallResponse = {
      success: true,
      data: result,
      executionTime,
    };
    
    log.info('Tool executed successfully', {
      tool,
      executionTime,
    });
    
    res.json(response);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logError('Tool execution failed', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
    });
  }
});

// MCP SSE endpoint (for MCP protocol over HTTP)
app.get('/mcp/sse', async (req: Request, res: Response) => {
  try {
    log.info('MCP SSE connection requested', { ip: req.ip });
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Create MCP server instance
    const server = new Server(SERVER_INFO, {
      capabilities: {
        tools: {},
      },
    });
    
    // Setup tools (simplified version for SSE)
    // In production, you would set up full tool handlers here
    
    // Create SSE transport
    const transport = new SSEServerTransport('/mcp/messages', res);
    
    // Connect server to transport
    await server.connect(transport);
    
    log.info('MCP SSE connection established');
    
    // Handle connection close
    req.on('close', () => {
      log.info('MCP SSE connection closed');
      server.close();
    });
  } catch (error) {
    logError('MCP SSE connection error', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logError('Unhandled error', err);
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
async function startServer() {
  try {
    // Validate configuration
    validateGoogleMcpConfig();
    
    app.listen(PORT, () => {
      log.info('Google MCP HTTP Server started', {
        port: PORT,
        environment: config.server.environment,
        googleConfigured: config.google.isConfigured,
        impersonatedUser: config.google.impersonatedUser,
      });
      
      log.info('Available endpoints:', {
        health: `http://localhost:${PORT}/health`,
        toolList: `http://localhost:${PORT}/api/${API_VERSION}/tools/list`,
        toolCall: `http://localhost:${PORT}/api/${API_VERSION}/tools/call`,
        mcpSse: `http://localhost:${PORT}/mcp/sse`,
      });
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();
