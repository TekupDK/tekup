export interface CacheConfig {
  defaultTTL: number;
  maxMemory: string;
  evictionPolicy: 'allkeys-lru' | 'volatile-lru';
  keyPrefix: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
}

export const defaultCacheConfig: CacheConfig = {
  defaultTTL: 300, // 5 minutes
  maxMemory: '256mb',
  evictionPolicy: 'allkeys-lru',
  keyPrefix: 'px:',
  host: process.env.PX_REDIS_HOST || 'localhost',
  port: parseInt(process.env.PX_REDIS_PORT || '6379'),
  password: process.env.PX_REDIS_PASSWORD,
  db: parseInt(process.env.PX_REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number;
  tags: string[];
  createdAt: Date;
  accessCount: number;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  totalKeys: number;
  connectedClients: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}