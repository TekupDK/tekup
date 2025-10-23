// Comprehensive Health Check System for RendetaljeOS

const axios = require('axios');
const { Pool } = require('pg');
const Redis = require('ioredis');

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.results = new Map();
    this.isRunning = false;
    
    // Initialize database connection
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    this.registerDefaultChecks();
  }
  
  registerDefaultChecks() {
    // Database health check
    this.registerCheck('database', async () => {
      try {
        const result = await this.db.query('SELECT 1 as health_check');
        return {
          status: 'healthy',
          responseTime: Date.now(),
          details: {
            connected: true,
            result: result.rows[0].health_check === 1
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false
          }
        };
      }
    });
    
    // Redis health check
    this.registerCheck('redis', async () => {
      try {
        const start = Date.now();
        const result = await this.redis.ping();
        const responseTime = Date.now() - start;
        
        return {
          status: result === 'PONG' ? 'healthy' : 'unhealthy',
          responseTime,
          details: {
            connected: true,
            response: result
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false
          }
        };
      }
    });
    
    // Supabase health check
    this.registerCheck('supabase', async () => {
      try {
        const start = Date.now();
        const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
          },
          timeout: 5000
        });
        const responseTime = Date.now() - start;
        
        return {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime,
          details: {
            statusCode: response.status,
            connected: true
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false,
            statusCode: error.response?.status
          }
        };
      }
    });
    
    // External API health checks
    this.registerCheck('billy-api', async () => {
      if (!process.env.BILLY_API_KEY) {
        return {
          status: 'skipped',
          details: { reason: 'API key not configured' }
        };
      }
      
      try {
        const start = Date.now();
        const response = await axios.get('https://api.billy.dk/v2/ping', {
          headers: {
            'X-Access-Token': process.env.BILLY_API_KEY
          },
          timeout: 5000
        });
        const responseTime = Date.now() - start;
        
        return {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime,
          details: {
            statusCode: response.status,
            connected: true
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false,
            statusCode: error.response?.status
          }
        };
      }
    });
    
    // AI Friday health check
    this.registerCheck('ai-friday', async () => {
      if (!process.env.AI_FRIDAY_URL) {
        return {
          status: 'skipped',
          details: { reason: 'AI Friday URL not configured' }
        };
      }
      
      try {
        const start = Date.now();
        const response = await axios.get(`${process.env.AI_FRIDAY_URL}/health`, {
          headers: {
            'Authorization': `Bearer ${process.env.AI_FRIDAY_API_KEY}`
          },
          timeout: 5000
        });
        const responseTime = Date.now() - start;
        
        return {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime,
          details: {
            statusCode: response.status,
            connected: true
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: {
            connected: false,
            statusCode: error.response?.status
          }
        };
      }
    });
    
    // Memory usage check
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const usagePercent = (usedMB / totalMB) * 100;
      
      return {
        status: usagePercent < 90 ? 'healthy' : 'unhealthy',
        details: {
          heapUsed: `${usedMB}MB`,
          heapTotal: `${totalMB}MB`,
          usagePercent: `${usagePercent.toFixed(1)}%`,
          external: `${Math.round(usage.external / 1024 / 1024)}MB`
        }
      };
    });
    
    // Disk space check (if applicable)
    this.registerCheck('disk', async () => {
      try {
        const fs = require('fs');
        const stats = fs.statSync('.');
        
        return {
          status: 'healthy',
          details: {
            available: 'N/A (Render.com managed)',
            note: 'Disk space managed by hosting provider'
          }
        };
      } catch (error) {
        return {
          status: 'healthy',
          details: {
            note: 'Disk check not applicable in containerized environment'
          }
        };
      }
    });
    
    // Environment variables check
    this.registerCheck('environment', async () => {
      const requiredVars = [
        'DATABASE_URL',
        'REDIS_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      return {
        status: missing.length === 0 ? 'healthy' : 'unhealthy',
        details: {
          required: requiredVars.length,
          configured: requiredVars.length - missing.length,
          missing: missing
        }
      };
    });
  }
  
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }
  
  async runCheck(name) {
    const checkFunction = this.checks.get(name);
    if (!checkFunction) {
      throw new Error(`Health check '${name}' not found`);
    }
    
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        )
      ]);
      
      const endTime = Date.now();
      const finalResult = {
        ...result,
        responseTime: result.responseTime || (endTime - startTime),
        timestamp: new Date().toISOString(),
        name
      };
      
      this.results.set(name, finalResult);
      return finalResult;
    } catch (error) {
      const errorResult = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        name
      };
      
      this.results.set(name, errorResult);
      return errorResult;
    }
  }
  
  async runAllChecks() {
    const checkNames = Array.from(this.checks.keys());
    const results = await Promise.allSettled(
      checkNames.map(name => this.runCheck(name))
    );
    
    const healthResults = {};
    results.forEach((result, index) => {
      const checkName = checkNames[index];
      healthResults[checkName] = result.status === 'fulfilled' 
        ? result.value 
        : {
            status: 'unhealthy',
            error: result.reason.message,
            timestamp: new Date().toISOString(),
            name: checkName
          };
    });
    
    return healthResults;
  }
  
  async getHealthSummary() {
    const results = await this.runAllChecks();
    
    const summary = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      checks: results
    };
    
    // Determine overall status
    const statuses = Object.values(results).map(r => r.status);
    if (statuses.includes('unhealthy')) {
      summary.status = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      summary.status = 'degraded';
    }
    
    return summary;
  }
  
  async getDetailedHealth() {
    const summary = await this.getHealthSummary();
    
    return {
      ...summary,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      metrics: {
        totalChecks: this.checks.size,
        healthyChecks: Object.values(summary.checks).filter(c => c.status === 'healthy').length,
        unhealthyChecks: Object.values(summary.checks).filter(c => c.status === 'unhealthy').length,
        skippedChecks: Object.values(summary.checks).filter(c => c.status === 'skipped').length
      }
    };
  }
  
  startPeriodicChecks(intervalMs = 60000) {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.interval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, intervalMs);
    
    console.log(`Started periodic health checks every ${intervalMs}ms`);
  }
  
  stopPeriodicChecks() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Stopped periodic health checks');
  }
  
  async cleanup() {
    this.stopPeriodicChecks();
    
    try {
      await this.db.end();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
    
    try {
      await this.redis.disconnect();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Express middleware for health checks
const createHealthCheckMiddleware = (healthService) => {
  return {
    // Basic health check endpoint
    basic: async (req, res) => {
      try {
        const summary = await healthService.getHealthSummary();
        const statusCode = summary.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(summary);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    // Detailed health check endpoint
    detailed: async (req, res) => {
      try {
        const detailed = await healthService.getDetailedHealth();
        const statusCode = detailed.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(detailed);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    // Individual check endpoint
    individual: async (req, res) => {
      try {
        const { checkName } = req.params;
        const result = await healthService.runCheck(checkName);
        const statusCode = result.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(result);
      } catch (error) {
        res.status(404).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
};

// Readiness probe (for Kubernetes/container orchestration)
const readinessProbe = async (healthService) => {
  const criticalChecks = ['database', 'redis'];
  
  for (const checkName of criticalChecks) {
    const result = await healthService.runCheck(checkName);
    if (result.status !== 'healthy') {
      return false;
    }
  }
  
  return true;
};

// Liveness probe (for Kubernetes/container orchestration)
const livenessProbe = async () => {
  // Simple check to ensure the process is responsive
  return process.uptime() > 0;
};

module.exports = {
  HealthCheckService,
  createHealthCheckMiddleware,
  readinessProbe,
  livenessProbe
};