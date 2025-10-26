import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService, QueryMetadata } from '../performance.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let prismaService: jest.Mocked<PrismaService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRawUnsafe: jest.fn(),
    };

    const mockMetricsService = {
      histogram: jest.fn(),
      increment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    prismaService = module.get(PrismaService);
    metricsService = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('measureQuery', () => {
    it('should measure query execution time', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const metadata: QueryMetadata = {
        operation: 'SELECT',
        table: 'leads',
        tenantId: 'tenant1',
      };

      const result = await service.measureQuery(mockQuery, metadata);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(metricsService.histogram).toHaveBeenCalledWith(
        'database_query_duration_seconds',
        expect.any(Number),
        {
          operation: 'SELECT',
          table: 'leads',
          tenant_id: 'tenant1',
        }
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'database_queries_total',
        {
          operation: 'SELECT',
          table: 'leads',
          tenant_id: 'tenant1',
          status: 'success',
        }
      );
    });

    it('should handle query errors and record metrics', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('Database error'));
      const metadata: QueryMetadata = {
        operation: 'SELECT',
        table: 'leads',
        tenantId: 'tenant1',
      };

      await expect(service.measureQuery(mockQuery, metadata)).rejects.toThrow('Database error');

      expect(metricsService.increment).toHaveBeenCalledWith(
        'database_queries_total',
        {
          operation: 'SELECT',
          table: 'leads',
          tenant_id: 'tenant1',
          status: 'error',
        }
      );
    });

    it('should detect slow queries', async () => {
      const mockQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1100))
      );
      const metadata: QueryMetadata = {
        operation: 'SELECT',
        table: 'leads',
        tenantId: 'tenant1',
      };

      await service.measureQuery(mockQuery, metadata);

      const slowQueries = service.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].metadata.operation).toBe('SELECT');
      expect(slowQueries[0].metadata.table).toBe('leads');
    });
  });

  describe('optimizeQuery', () => {
    it('should provide optimization suggestions for SELECT *', () => {
      const query = 'SELECT * FROM leads WHERE tenant_id = $1';
      const result = service.optimizeQuery(query, ['tenant1']);

      expect(result.suggestions).toContain('Avoid SELECT * - specify only needed columns');
      expect(result.estimatedImprovement).toBeGreaterThan(0);
    });

    it('should suggest LIMIT for ORDER BY queries', () => {
      const query = 'SELECT id FROM leads ORDER BY created_at';
      const result = service.optimizeQuery(query, []);

      expect(result.suggestions).toContain('Consider adding LIMIT when using ORDER BY');
    });

    it('should suggest full-text search for LIKE queries', () => {
      const query = 'SELECT id FROM leads WHERE payload LIKE %search%';
      const result = service.optimizeQuery(query, []);

      expect(result.suggestions).toContain('Consider using full-text search instead of LIKE with leading wildcard');
    });
  });

  describe('analyzePerformance', () => {
    it('should return empty report when no queries recorded', async () => {
      const report = await service.analyzePerformance();

      expect(report.avgResponseTime).toBe(0);
      expect(report.p95ResponseTime).toBe(0);
      expect(report.p99ResponseTime).toBe(0);
      expect(report.throughput).toBe(0);
      expect(report.recommendations).toContain('No query data available yet');
    });

    it('should calculate performance metrics correctly', async () => {
      // Simulate some queries with artificial delay
      const mockQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10))
      );
      const metadata: QueryMetadata = {
        operation: 'SELECT',
        table: 'leads',
        tenantId: 'tenant1',
      };

      // Add multiple queries with different execution times
      for (let i = 0; i < 10; i++) {
        await service.measureQuery(mockQuery, metadata);
      }

      const report = await service.analyzePerformance();

      expect(report.avgResponseTime).toBeGreaterThan(0);
      expect(report.p95ResponseTime).toBeGreaterThan(0);
      expect(report.recommendations).toBeDefined();
      expect(report.throughput).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSlowQueries', () => {
    it('should return slow queries sorted by execution time', async () => {
      const fastQuery = jest.fn().mockResolvedValue([]);
      const slowQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1100))
      );

      const metadata: QueryMetadata = {
        operation: 'SELECT',
        table: 'leads',
        tenantId: 'tenant1',
      };

      await service.measureQuery(fastQuery, metadata);
      await service.measureQuery(slowQuery, { ...metadata, operation: 'SLOW_SELECT' });

      const slowQueries = service.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].metadata.operation).toBe('SLOW_SELECT');
    });
  });

  describe('getMetrics', () => {
    it('should return current performance metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics).toHaveProperty('totalQueries');
      expect(metrics).toHaveProperty('totalExecutionTime');
      expect(metrics).toHaveProperty('slowQueryCount');
      expect(metrics).toHaveProperty('avgExecutionTime');
      expect(metrics).toHaveProperty('slowQueryRate');
    });
  });
});