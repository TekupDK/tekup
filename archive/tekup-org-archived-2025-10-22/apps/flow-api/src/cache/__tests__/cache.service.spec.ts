import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service.js';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

const mockRedis = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  expire: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  config: jest.fn(),
  smembers: jest.fn(),
  sadd: jest.fn(),
  pipeline: jest.fn(),
  flushdb: jest.fn(),
  on: jest.fn(),
};

const mockPipeline = {
  sadd: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
};

describe('CacheService', () => {
  let service: CacheService;
  let redis: jest.Mocked<Redis>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis as any);
    mockRedis.pipeline.mockReturnValue(mockPipeline as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = mockRedis as any;

    // Initialize the service
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('initialization', () => {
    it('should connect to Redis on module init', async () => {
      expect(redis.connect).toHaveBeenCalled();
      expect(redis.config).toHaveBeenCalledWith('SET', 'maxmemory-policy', 'allkeys-lru');
      expect(redis.config).toHaveBeenCalledWith('SET', 'maxmemory', '256mb');
    });

    it('should disconnect from Redis on module destroy', async () => {
      await service.onModuleDestroy();
      expect(redis.disconnect).toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      const errorService = new CacheService();
      redis.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(errorService.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { id: 1, name: 'test' };
      redis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null when key does not exist', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      redis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testData = { id: 1, name: 'test' };

      await service.set('test-key', testData);

      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
    });

    it('should set value with custom TTL', async () => {
      const testData = { id: 1, name: 'test' };

      await service.set('test-key', testData, { ttl: 600 });

      expect(redis.setex).toHaveBeenCalledWith('test-key', 600, JSON.stringify(testData));
    });

    it('should set value without TTL when ttl is 0', async () => {
      const testData = { id: 1, name: 'test' };

      await service.set('test-key', testData, { ttl: 0 });

      expect(redis.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    it('should handle tags for tag-based invalidation', async () => {
      const testData = { id: 1, name: 'test' };
      mockPipeline.exec.mockResolvedValue([]);

      await service.set('test-key', testData, { tags: ['tag1', 'tag2'] });

      expect(mockPipeline.sadd).toHaveBeenCalledWith('tag:tag1', 'test-key');
      expect(mockPipeline.sadd).toHaveBeenCalledWith('tag:tag2', 'test-key');
      expect(mockPipeline.expire).toHaveBeenCalledWith('tag:tag1', 600);
      expect(mockPipeline.expire).toHaveBeenCalledWith('tag:tag2', 600);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should throw error when Redis set fails', async () => {
      redis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('test-key', 'value')).rejects.toThrow('Redis error');
    });
  });

  describe('delete', () => {
    it('should delete key and return true when key exists', async () => {
      redis.del.mockResolvedValue(1);

      const result = await service.delete('test-key');

      expect(redis.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      redis.del.mockResolvedValue(0);

      const result = await service.delete('non-existent-key');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      redis.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.delete('error-key');

      expect(result).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should invalidate keys matching pattern', async () => {
      redis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      redis.del.mockResolvedValue(3);

      const result = await service.invalidate('test:*');

      expect(redis.keys).toHaveBeenCalledWith('test:*');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      expect(result).toBe(3);
    });

    it('should return 0 when no keys match pattern', async () => {
      redis.keys.mockResolvedValue([]);

      const result = await service.invalidate('test:*');

      expect(result).toBe(0);
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      redis.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.invalidate('test:*');

      expect(result).toBe(0);
    });
  });

  describe('invalidateByTags', () => {
    it('should invalidate keys by tags', async () => {
      redis.smembers
        .mockResolvedValueOnce(['key1', 'key2'])
        .mockResolvedValueOnce(['key2', 'key3']);
      redis.del
        .mockResolvedValueOnce(2) // For keys
        .mockResolvedValueOnce(1) // For tag set
        .mockResolvedValueOnce(2) // For keys
        .mockResolvedValueOnce(1); // For tag set

      const result = await service.invalidateByTags(['tag1', 'tag2']);

      expect(redis.smembers).toHaveBeenCalledWith('tag:tag1');
      expect(redis.smembers).toHaveBeenCalledWith('tag:tag2');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
      expect(redis.del).toHaveBeenCalledWith('key2', 'key3');
      expect(result).toBe(4);
    });

    it('should handle empty tag sets', async () => {
      redis.smembers.mockResolvedValue([]);

      const result = await service.invalidateByTags(['empty-tag']);

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      redis.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      redis.exists.mockResolvedValue(0);

      const result = await service.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('should return TTL for key', async () => {
      redis.ttl.mockResolvedValue(300);

      const result = await service.getTTL('test-key');

      expect(result).toBe(300);
    });

    it('should handle Redis errors gracefully', async () => {
      redis.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await service.getTTL('test-key');

      expect(result).toBe(-1);
    });
  });

  describe('extendTTL', () => {
    it('should extend TTL for key', async () => {
      redis.expire.mockResolvedValue(1);

      const result = await service.extendTTL('test-key', 600);

      expect(redis.expire).toHaveBeenCalledWith('test-key', 600);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      redis.expire.mockResolvedValue(0);

      const result = await service.extendTTL('test-key', 600);

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      redis.info
        .mockResolvedValueOnce('used_memory:1048576\n')
        .mockResolvedValueOnce('db0:keys=100,expires=50\n')
        .mockResolvedValueOnce('connected_clients:5\n');

      const stats = await service.getStats();

      expect(stats).toEqual({
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        memoryUsage: 1048576,
        totalKeys: 100,
        connectedClients: 5,
      });
    });

    it('should handle Redis info errors gracefully', async () => {
      redis.info.mockRejectedValue(new Error('Redis error'));

      const stats = await service.getStats();

      expect(stats).toEqual({
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        memoryUsage: 0,
        totalKeys: 0,
        connectedClients: 0,
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when Redis is responsive', async () => {
      redis.ping.mockResolvedValue('PONG');

      const health = await service.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when Redis is not responsive', async () => {
      redis.ping.mockRejectedValue(new Error('Connection failed'));

      const health = await service.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Connection failed');
    });
  });

  describe('generateKey', () => {
    it('should generate key with tenant isolation', () => {
      const key = service.generateKey('tenant1', 'leads', 'list');

      expect(key).toBe('tenant1:leads:list');
    });

    it('should generate key with parameters', () => {
      const key = service.generateKey('tenant1', 'leads', 'list', { status: 'new', limit: 10 });

      expect(key).toContain('tenant1:leads:list:');
      expect(key).toContain(Buffer.from('limit=10&status=new').toString('base64'));
    });

    it('should generate consistent keys for same parameters', () => {
      const key1 = service.generateKey('tenant1', 'leads', 'list', { status: 'new', limit: 10 });
      const key2 = service.generateKey('tenant1', 'leads', 'list', { limit: 10, status: 'new' });

      expect(key1).toBe(key2);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await service.clear();

      expect(redis.flushdb).toHaveBeenCalled();
    });

    it('should throw error when Redis flushdb fails', async () => {
      redis.flushdb.mockRejectedValue(new Error('Redis error'));

      await expect(service.clear()).rejects.toThrow('Redis error');
    });
  });
});