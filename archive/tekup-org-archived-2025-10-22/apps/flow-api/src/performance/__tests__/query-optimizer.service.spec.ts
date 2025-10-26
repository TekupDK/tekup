import { Test, TestingModule } from '@nestjs/testing';
import { QueryOptimizerService } from '../query-optimizer.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('QueryOptimizerService', () => {
  let service: QueryOptimizerService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryOptimizerService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QueryOptimizerService>(QueryOptimizerService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeQuery', () => {
    it('should analyze a simple SELECT query', async () => {
      const query = 'SELECT * FROM leads WHERE tenant_id = $1';
      
      // Mock the EXPLAIN query result
      prismaService.$queryRawUnsafe.mockResolvedValue([
        {
          'QUERY PLAN': [
            {
              Plan: {
                'Node Type': 'Seq Scan',
                'Total Cost': 100.0,
                'Plan Rows': 1000,
                'Plan Width': 50,
              }
            }
          ]
        }
      ]);

      const result = await service.analyzeQuery(query, ['tenant1']);

      expect(result.originalQuery).toBe(query);
      expect(result.queryPlan).toHaveLength(1);
      expect(result.queryPlan[0].nodeType).toBe('Seq Scan');
      expect(result.suggestions).toContain('Replace SELECT * with specific column names to reduce data transfer');
      expect(result.indexRecommendations).toBeDefined();
    });

    it('should handle query analysis errors gracefully', async () => {
      const query = 'SELECT * FROM invalid_table WHERE bad_syntax';
      
      // Mock the EXPLAIN query to fail
      prismaService.$queryRawUnsafe.mockRejectedValue(new Error('Syntax error'));

      const result = await service.analyzeQuery(query);

      expect(result.originalQuery).toBe(query);
      expect(result.queryPlan).toHaveLength(0);
      // Should still provide basic optimization suggestions even when query plan fails
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Replace SELECT * with specific column names to reduce data transfer');
    });

    it('should recommend indexes for sequential scans', async () => {
      const query = 'SELECT id FROM leads WHERE status = \'new\'';
      
      prismaService.$queryRawUnsafe.mockResolvedValue([
        {
          'QUERY PLAN': [
            {
              Plan: {
                'Node Type': 'Seq Scan',
                'Total Cost': 1000.0,
                'Plan Rows': 5000,
                'Plan Width': 4,
              }
            }
          ]
        }
      ]);

      const result = await service.analyzeQuery(query);

      expect(result.indexRecommendations).toHaveLength(1);
      expect(result.indexRecommendations[0].table).toBe('leads');
      expect(result.indexRecommendations[0].reason).toBe('Sequential scan detected on large table');
      expect(result.indexRecommendations[0].priority).toBe('medium');
    });

    it('should suggest GIN indexes for JSON operations', async () => {
      const query = 'SELECT id FROM leads WHERE payload->\'email\' = \'test@example.com\'';
      
      prismaService.$queryRawUnsafe.mockResolvedValue([]);

      const result = await service.analyzeQuery(query);

      expect(result.indexRecommendations.some(rec => rec.type === 'gin')).toBe(true);
    });
  });

  describe('generateIndexSQL', () => {
    it('should generate correct B-tree index SQL', () => {
      const recommendation = {
        table: 'leads',
        columns: ['tenant_id', 'status'],
        type: 'btree' as const,
        reason: 'Test',
        estimatedImprovement: 50,
        priority: 'high' as const,
      };

      const sql = service.generateIndexSQL(recommendation);

      expect(sql).toBe('CREATE INDEX CONCURRENTLY idx_leads_tenant_id_status ON leads (tenant_id, status);');
    });

    it('should generate correct GIN index SQL', () => {
      const recommendation = {
        table: 'leads',
        columns: ['payload'],
        type: 'gin' as const,
        reason: 'JSON operations',
        estimatedImprovement: 70,
        priority: 'high' as const,
      };

      const sql = service.generateIndexSQL(recommendation);

      expect(sql).toBe('CREATE INDEX CONCURRENTLY idx_leads_payload ON leads USING GIN (payload);');
    });
  });

  describe('getFrequentQueries', () => {
    it('should track and return frequent queries', async () => {
      const query1 = 'SELECT * FROM leads WHERE tenant_id = $1';
      const query2 = 'SELECT count(*) FROM leads WHERE status = $1';

      // Analyze the same queries multiple times
      await service.analyzeQuery(query1);
      await service.analyzeQuery(query1);
      await service.analyzeQuery(query2);

      const frequentQueries = service.getFrequentQueries();

      expect(frequentQueries).toHaveLength(2);
      expect(frequentQueries[0].frequency).toBe(2); // Most frequent first
    });
  });
});