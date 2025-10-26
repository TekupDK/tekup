import { createClient, RedisClientType } from 'redis';
import { logger } from '../logger';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Skip Redis if explicitly disabled
    if (process.env.CACHE_PROVIDER === 'memory' || process.env.REDIS_ENABLED === 'false') {
      logger.info('Redis disabled, using in-memory cache only');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis connection failed after 3 retries, using memory fallback');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 1000);
          }
        }
      });

      let errorLogged = false;
      this.client.on('error', (error) => {
        if (!errorLogged) {
          logger.debug({ error }, 'Redis client error (suppressing further errors)');
          errorLogged = true;
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn({ error }, 'Redis not available, using in-memory cache fallback');
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const result = await this.client.get(key) as string | null;
      return result;
    } catch (error) {
      logger.error({ error, key }, 'Redis get error');
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Redis set error');
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Redis del error');
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Redis exists error');
      return false;
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error({ error }, 'Redis flushAll error');
      return false;
    }
  }

  async getStats(): Promise<{ connected: boolean; memory?: string }> {
    if (!this.client || !this.isConnected) {
      return { connected: false };
    }

    try {
      const memory = await (this.client as any).memory('USAGE') as string;
      return { connected: true, memory };
    } catch (error) {
      logger.error({ error }, 'Redis stats error');
      return { connected: true };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default redisService;