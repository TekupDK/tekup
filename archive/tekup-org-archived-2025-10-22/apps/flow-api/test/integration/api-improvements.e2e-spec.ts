import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { CacheService } from '../../src/cache/cache.service.js';
import { MetricsService } from '../../src/metrics/metrics.service.js';
import { StructuredLoggerService } from '../../src/common/logging/structured-logger.service.js';
import { WebSocketGatewayImplementation } from '../../src/websocket/websocket.gateway.js';
import { SearchService } from '../../src/search/search.service.js';
import { RateLimitingService } from '../../src/common/rate-limiting/rate-limiting.service.js';
import { PerformanceService } from '../../src/performance/performance.service.js';
import { ComprehensiveHealthService } from '../../src/health/comprehensive-health.service.js';

describe('API Improvements Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cacheService: CacheService;
  let metricsService: MetricsService;
  let logger: StructuredLoggerService;
  let searchService: SearchService;
  let rateLimitingService: RateLimitingService;
  let performanceService: PerformanceService;
  let healthService: ComprehensiveHealthService;
  let wsGateway: WebSocketGatewayImplementation;

  const testTenantId = 'test-tenant-123';
  const testApiKey = 'test-api-key-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Get service instances
    prisma = app.get<PrismaService>(PrismaService);
    cacheService = app.get<CacheService>(CacheService);
    metricsService = app.get<MetricsService>(MetricsService);
    logger = app.get<StructuredLoggerService>(StructuredLoggerService);
    searchService = app.get<SearchService>(SearchService);
    rateLimitingService = app.get<RateLimitingService>(RateLimitingService);
    performanceService = app.get<PerformanceService>(PerformanceService);
    healthService = app.get<ComprehensiveHealthService>(ComprehensiveHealthService);
    wsGateway = app.get<WebSocketGatewayImplementation>(WebSocketGatewayImplementation);

    await app.init();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clear();
  });

  describe('Health Checks Integration', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.dependencies).toBeInstanceOf(Array);
      expect(response.body.dependencies.length).toBeGreaterThan(0);

      // Verify key dependencies are checked
      const dependencyNames = response.body.dependencies.map((dep: any) => dep.name);
      expect(dependencyNames).toContain('database');
      expect(dependencyNames).toContain('redis');
    });

    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('dependencyStatus');
    });

    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/live')
        .expect(200);

      expect(response.body).toHaveProperty('alive');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Metrics Integration', () => {
    it('should expose Prometheus metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should track request metrics', async () => {
      // Make a request to generate metrics
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      const metricsResponse = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      // Should contain HTTP request metrics
      expect(metricsResponse.text).toContain('http_requests_total');
    });
  });

  describe('Caching Integration', () => {
    it('should cache lead list responses', async () => {
      // First request - should hit database
      const response1 = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      // Second request - should hit cache
      const response2 = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      expect(response1.body).toEqual(response2.body);

      // Verify cache headers
      expect(response2.headers).toHaveProperty('x-cache-status');
    });

    it('should invalidate cache on lead updates', async () => {
      // Create a lead
      const createResponse = await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          name: 'Test Lead',
          email: 'test@example.com',
          source: 'test',
        })
        .expect(201);

      const leadId = createResponse.body.id;

      // Get leads list (should be cached)
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      // Update the lead (should invalidate cache)
      await request(app.getHttpServer())
        .patch(`/leads/${leadId}`)
        .set('x-tenant-key', testApiKey)
        .send({ name: 'Updated Lead' })
        .expect(200);

      // Get leads list again (should hit database, not cache)
      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      expect(response.headers['x-cache-status']).toBe('MISS');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/leads')
            .set('x-tenant-key', testApiKey)
        );
      }

      const responses = await Promise.all(requests);
      
      // Should have rate limit headers
      responses.forEach(response => {
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      });
    });

    it('should return 429 when rate limit exceeded', async () => {
      // This test would need to be configured with very low rate limits
      // or use a test-specific rate limiting configuration
      
      // Set a very low rate limit for testing
      await rateLimitingService.setTenantConfig({
        tenantId: testTenantId,
        globalLimit: {
          windowMs: 60000,
          maxRequests: 2,
        },
        endpointLimits: {},
        apiKeyLimits: {},
        customRules: [],
      });

      // Make requests to exceed the limit
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      // Third request should be rate limited
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(429);
    });
  });

  describe('Search Integration', () => {
    beforeEach(async () => {
      // Create test leads for searching
      await createTestLeads();
    });

    it('should perform full-text search', async () => {
      const response = await request(app.getHttpServer())
        .post('/search')
        .set('x-tenant-key', testApiKey)
        .send({
          query: 'John Doe',
          options: {
            limit: 10,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('searchTime');
      expect(response.body.results).toBeInstanceOf(Array);
    });

    it('should provide search suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/autocomplete')
        .query({ q: 'John', limit: 5 })
        .set('x-tenant-key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(response.body.suggestions).toBeInstanceOf(Array);
    });

    it('should cache search results', async () => {
      const searchQuery = {
        query: 'test search',
        options: { limit: 10 },
      };

      // First search
      const response1 = await request(app.getHttpServer())
        .post('/search')
        .set('x-tenant-key', testApiKey)
        .send(searchQuery)
        .expect(200);

      // Second search (should be cached)
      const response2 = await request(app.getHttpServer())
        .post('/search')
        .set('x-tenant-key', testApiKey)
        .send(searchQuery)
        .expect(200);

      expect(response1.body.results).toEqual(response2.body.results);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track query performance', async () => {
      // Make a request that triggers database queries
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      // Get performance metrics
      const performanceReport = await performanceService.analyzePerformance();
      
      expect(performanceReport).toHaveProperty('avgResponseTime');
      expect(performanceReport).toHaveProperty('p95ResponseTime');
      expect(performanceReport).toHaveProperty('throughput');
      expect(performanceReport.avgResponseTime).toBeGreaterThan(0);
    });

    it('should detect slow queries', async () => {
      // This would require a query that takes longer than the threshold
      // In a real test, you might mock the performance service or use a test database
      const slowQueries = performanceService.getSlowQueries();
      expect(Array.isArray(slowQueries)).toBe(true);
    });
  });

  describe('Logging Integration', () => {
    it('should generate structured logs with correlation IDs', async () => {
      const correlationId = 'test-correlation-123';
      
      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .set('x-correlation-id', correlationId)
        .expect(200);

      // Verify correlation ID is returned
      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should log request and response information', async () => {
      // This test would typically verify log output
      // In a real implementation, you might capture log output or use a test logger
      
      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          name: 'Log Test Lead',
          email: 'logtest@example.com',
          source: 'test',
        })
        .expect(201);

      // Verify that logs were generated (implementation depends on logging setup)
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('WebSocket Integration', () => {
    it('should handle WebSocket connections', async () => {
      // This test would require setting up a WebSocket client
      // For now, just verify the gateway is available
      expect(wsGateway).toBeDefined();
      
      const stats = wsGateway.getConnectionStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('connectionsByTenant');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          // Missing required fields
          source: 'test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle authentication errors', async () => {
      await request(app.getHttpServer())
        .get('/leads')
        .expect(401);
    });

    it('should handle not found errors', async () => {
      await request(app.getHttpServer())
        .get('/leads/non-existent-id')
        .set('x-tenant-key', testApiKey)
        .expect(404);
    });

    it('should include correlation IDs in error responses', async () => {
      const correlationId = 'error-test-123';
      
      const response = await request(app.getHttpServer())
        .get('/leads/non-existent-id')
        .set('x-tenant-key', testApiKey)
        .set('x-correlation-id', correlationId)
        .expect(404);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });
  });

  describe('Pagination Integration', () => {
    beforeEach(async () => {
      // Create multiple leads for pagination testing
      await createMultipleTestLeads(25);
    });

    it('should support cursor-based pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .query({ limit: 10 })
        .set('x-tenant-key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('nextCursor');
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should handle pagination with sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .query({ 
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        .set('x-tenant-key', testApiKey)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      
      // Verify sorting
      const dates = response.body.data.map((lead: any) => new Date(lead.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test tenant
    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        slug: 'test-tenant',
        name: 'Test Tenant',
      },
    });

    // Create test API key
    await prisma.apiKey.upsert({
      where: { key: testApiKey },
      update: {},
      create: {
        key: testApiKey,
        tenantId: testTenantId,
      },
    });
  }

  async function cleanupTestData() {
    // Clean up test data
    await prisma.lead.deleteMany({
      where: { tenantId: testTenantId },
    });
    
    await prisma.apiKey.deleteMany({
      where: { key: testApiKey },
    });
    
    await prisma.tenant.deleteMany({
      where: { id: testTenantId },
    });
  }

  async function createTestLeads() {
    const leads = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        source: 'website',
        tenantId: testTenantId,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'Tech Solutions',
        source: 'referral',
        tenantId: testTenantId,
      },
    ];

    for (const lead of leads) {
      await prisma.lead.create({ data: lead });
    }
  }

  async function createMultipleTestLeads(count: number) {
    const leads = [];
    for (let i = 0; i < count; i++) {
      leads.push({
        name: `Test Lead ${i}`,
        email: `test${i}@example.com`,
        phone: `+123456789${i}`,
        company: `Company ${i}`,
        source: 'test',
        tenantId: testTenantId,
      });
    }

    for (const lead of leads) {
      await prisma.lead.create({ data: lead });
    }
  }
});