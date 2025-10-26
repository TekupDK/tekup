import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { PerformanceService } from '../../src/performance/performance.service.js';
import { MetricsService } from '../../src/metrics/metrics.service.js';

describe('Performance Load Testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let performanceService: PerformanceService;
  let metricsService: MetricsService;

  const testTenantId = 'perf-test-tenant';
  const testApiKey = 'perf-test-api-key';
  const targetP95ResponseTime = 400; // 400ms target

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-test-performance');

    }).compile();

    app = moduleFixture.createNestApplication();
    
    prisma = app.get<PrismaService>(PrismaService);
    performanceService = app.get<PerformanceService>(PerformanceService);
    metricsService = app.get<MetricsService>(MetricsService);

    await app.init();
    await setupPerformanceTestData();
  });

  afterAll(async () => {
    await cleanupPerformanceTestData();
    await app.close();
  });

  describe('Response Time Performance', () => {
    it('should meet P95 response time target for lead list endpoint', async () => {
      const responseTimes: number[] = [];
      const requestCount = 100;

      // Make multiple requests to measure response times
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        await request(app.getHttpServer())
          .get('/leads')
          .set('x-tenant-key', testApiKey)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      // Calculate P95 response time
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(requestCount * 0.95);
      const p95ResponseTime = responseTimes[p95Index];

      logger.info(`P95 Response Time: ${p95ResponseTime}ms (Target: ${targetP95ResponseTime}ms)`);
      logger.info(`Average Response Time: ${responseTimes.reduce((a, b) => a + b, 0) / requestCount}ms`);
      logger.info(`Min Response Time: ${Math.min(...responseTimes)}ms`);
      logger.info(`Max Response Time: ${Math.max(...responseTimes)}ms`);

      expect(p95ResponseTime).toBeLessThan(targetP95ResponseTime);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      // Make concurrent requests
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/leads')
          .set('x-tenant-key', testApiKey)
          .expect(200)
      );

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const averageTimePerRequest = totalTime / concurrentRequests;

      logger.info(`Concurrent requests: ${concurrentRequests}`);
      logger.info(`Total time: ${totalTime}ms`);
      logger.info(`Average time per request: ${averageTimePerRequest}ms`);

      // All requests should complete successfully
      expect(responses.length).toBe(concurrentRequests);
      
      // Average time per request should be reasonable under concurrent load
      expect(averageTimePerRequest).toBeLessThan(targetP95ResponseTime * 2);
    });
  });

  describe('Database Performance', () => {
    it('should efficiently handle large dataset queries', async () => {
      // Create a large dataset for testing
      await createLargeDataset(1000);

      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/leads')
        .query({ limit: 50 })
        .set('x-tenant-key', testApiKey)
        .expect(200);

      const queryTime = Date.now() - startTime;

      logger.info(`Large dataset query time: ${queryTime}ms`);
      
      expect(response.body.data.length).toBeLessThanOrEqual(50);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should optimize search queries', async () => {
      const searchQueries = [
        'John Doe',
        'test@example.com',
        'Acme Corp',
        'website',
      ];

      for (const query of searchQueries) {
        const startTime = Date.now();
        
        const response = await request(app.getHttpServer())
          .post('/search')
          .set('x-tenant-key', testApiKey)
          .send({
            query,
            options: { limit: 20 },
          })
          .expect(200);

        const searchTime = Date.now() - startTime;
        
        logger.info(`Search query "${query}" took ${searchTime}ms`);
        
        expect(searchTime).toBeLessThan(500); // Search should be fast
        expect(response.body).toHaveProperty('searchTime');
        expect(response.body.searchTime).toBeLessThan(200); // Internal search time
      }
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache performance improvement', async () => {
      const endpoint = '/leads';
      
      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(endpoint)
        .set('x-tenant-key', testApiKey)
        .expect(200);
      const missTime = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(endpoint)
        .set('x-tenant-key', testApiKey)
        .expect(200);
      const hitTime = Date.now() - startTime2;

      logger.info(`Cache miss time: ${missTime}ms`);
      logger.info(`Cache hit time: ${hitTime}ms`);
      logger.info(`Performance improvement: ${((missTime - hitTime) / missTime * 100).toFixed(1)}%`);

      // Cache hit should be significantly faster
      expect(hitTime).toBeLessThan(missTime * 0.5);
      expect(response1.body).toEqual(response2.body);
    });

    it('should maintain performance under cache invalidation', async () => {
      // Warm up cache
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);

      // Create a new lead (should invalidate cache)
      const createStart = Date.now();
      await request(app.getHttpServer())
        .post('/leads')
        .set('x-tenant-key', testApiKey)
        .send({
          name: 'Cache Test Lead',
          email: 'cachetest@example.com',
          source: 'test',
        })
        .expect(201);
      const createTime = Date.now() - createStart;

      // Next request should rebuild cache efficiently
      const rebuildStart = Date.now();
      await request(app.getHttpServer())
        .get('/leads')
        .set('x-tenant-key', testApiKey)
        .expect(200);
      const rebuildTime = Date.now() - rebuildStart;

      logger.info(`Create + invalidate time: ${createTime}ms`);
      logger.info(`Cache rebuild time: ${rebuildTime}ms`);

      expect(createTime).toBeLessThan(1000);
      expect(rebuildTime).toBeLessThan(targetP95ResponseTime);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should efficiently process requests within rate limits', async () => {
      const requestsPerSecond = 10;
      const testDuration = 5; // seconds
      const totalRequests = requestsPerSecond * testDuration;

      const startTime = Date.now();
      const requests = [];

      // Spread requests over time to stay within rate limits
      for (let i = 0; i < totalRequests; i++) {
        const delay = (i / requestsPerSecond) * 1000;
        
        requests.push(
          new Promise(resolve => {
            setTimeout(async () => {
              const reqStart = Date.now();
              const response = await request(app.getHttpServer())
                .get('/leads')
                .set('x-tenant-key', testApiKey);
              const reqTime = Date.now() - reqStart;
              resolve({ status: response.status, time: reqTime });
            }, delay);
          })
        );
      }

      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successfulRequests = results.filter((r: any) => r.status === 200);
      const averageResponseTime = successfulRequests.reduce((sum: number, r: any) => sum + r.time, 0) / successfulRequests.length;

      logger.info(`Total requests: ${totalRequests}`);
      logger.info(`Successful requests: ${successfulRequests.length}`);
      logger.info(`Total time: ${totalTime}ms`);
      logger.info(`Average response time: ${averageResponseTime}ms`);

      expect(successfulRequests.length).toBeGreaterThan(totalRequests * 0.9); // 90% success rate
      expect(averageResponseTime).toBeLessThan(targetP95ResponseTime);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate load
      const requests = Array(50).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/leads')
          .set('x-tenant-key', testApiKey)
      );

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      logger.info(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      logger.info(`Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      logger.info(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(1)}%)`);

      // Memory increase should be reasonable
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
    });
  });

  // Helper functions
  async function setupPerformanceTestData() {
    // Create test tenant
    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        slug: 'perf-test-tenant',
        name: 'Performance Test Tenant',
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

    // Create initial test data
    await createLargeDataset(100);
  }

  async function cleanupPerformanceTestData() {
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

  async function createLargeDataset(count: number) {
    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const leads = [];
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);

      for (let i = batchStart; i < batchEnd; i++) {
        leads.push({
          name: `Performance Test Lead ${i}`,
          email: `perftest${i}@example.com`,
          phone: `+1234567${String(i).padStart(3, '0')}`,
          company: `Performance Company ${i % 10}`,
          source: ['website', 'referral', 'social', 'email'][i % 4],
          tenantId: testTenantId,
          notes: `This is a performance test lead created for load testing. Lead number ${i}.`,
        });
      }

      // Insert batch
      await prisma.lead.createMany({
        data: leads,
      });
    }

    logger.info(`Created ${count} test leads for performance testing`);
  }
});