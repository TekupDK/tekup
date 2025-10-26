/**
 * Simple RestaurantIQ Backend Server Entry Point
 * Basic version for initial testing
 */

import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request ID middleware
app.use((req: Request & { requestId?: string }, res: Response, next) => {
  req.requestId = Date.now().toString();
  res.set('X-Request-ID', req.requestId);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'RestaurantIQ API',
    version: '1.0.0',
    description: 'AI-powered restaurant management platform for Danish restaurants',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'RestaurantIQ Backend API is working!',
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.path} was not found.`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 RestaurantIQ Backend Server');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API info: http://localhost:${PORT}/api`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

export default app;
