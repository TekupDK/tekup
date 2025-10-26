// Health check endpoint for TekUp Job Scheduling System
// Used by Docker healthcheck and load balancers

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TekUp Job Scheduling System',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      checks: {
        api: 'ok',
        database: 'not_implemented', // Will be updated when backend is added
        cache: 'not_implemented', // Will be updated when Redis is integrated
      }
    };

    // Add any additional health checks here
    // For example: database connectivity, external service availability, etc.

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'TekUp Job Scheduling System',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}