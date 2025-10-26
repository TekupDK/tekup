import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Cluster } from 'ioredis';
import { CacheConfig, defaultCacheConfig } from './cache.config.js';

@Injectable()
export class RedisClusterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisClusterService.name);
  private cluster: Cluster;
  private config: CacheConfig;
  private isClusterMode = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...defaultCacheConfig, ...config };
    // Check if we should use cluster mode based on environment variables
    this.isClusterMode = process.env.REDIS_CLUSTER_ENABLED === 'true';
  }

  async onModuleInit() {
    try {
      if (this.isClusterMode) {
        await this.initializeCluster();
      } else {
        this.logger.log('Redis cluster mode not enabled, using standalone Redis');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis cluster service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.cluster) {
      await this.cluster.quit();
      this.logger.log('Redis cluster connection closed');
    }
  }

  private async initializeCluster() {
    // Parse cluster nodes from environment variable
    const clusterNodes = this.parseClusterNodes(process.env.REDIS_CLUSTER_NODES);
    
    if (clusterNodes.length === 0) {
      this.logger.warn('No cluster nodes configured, falling back to standalone Redis');
      this.isClusterMode = false;
      return;
    }

    this.cluster = new Redis.Cluster(clusterNodes, {
      redisOptions: {
        password: this.config.password,
        keyPrefix: this.config.keyPrefix,
      },
      clusterRetryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(`Redis cluster retry attempt ${times}, delaying ${delay}ms`);
        return delay;
      },
      enableOfflineQueue: true,
      enableReadyCheck: true,
    });

    // Event listeners for monitoring
    this.cluster.on('connect', () => {
      this.logger.log('Redis cluster connected successfully');
    });

    this.cluster.on('ready', () => {
      this.logger.log('Redis cluster ready for operations');
    });

    this.cluster.on('error', (error) => {
      this.logger.error('Redis cluster error:', error);
    });

    this.cluster.on('reconnecting', () => {
      this.logger.warn('Redis cluster reconnecting...');
    });

    this.cluster.on('close', () => {
      this.logger.warn('Redis cluster connection closed');
    });

    this.cluster.on('end', () => {
      this.logger.warn('Redis cluster connection ended');
    });

    this.logger.log('Redis cluster initialized with nodes:', clusterNodes);
  }

  private parseClusterNodes(nodesString: string): { host: string; port: number }[] {
    if (!nodesString) {
      return [];
    }

    try {
      return nodesString.split(',').map(node => {
        const [host, port] = node.split(':');
        return {
          host: host.trim(),
          port: parseInt(port.trim(), 10),
        };
      });
    } catch (error) {
      this.logger.error('Failed to parse Redis cluster nodes:', error);
      return [];
    }
  }

  /**
   * Get value from cache (cluster or standalone)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isClusterMode && this.cluster) {
        const value = await this.cluster.get(key);
        return value ? JSON.parse(value) : null;
      }
      return null;
    } catch (error) {
      this.logger.error(`Redis cluster get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache (cluster or standalone)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (this.isClusterMode && this.cluster) {
        const serializedValue = JSON.stringify(value);
        if (ttl && ttl > 0) {
          await this.cluster.setex(key, ttl, serializedValue);
        } else {
          await this.cluster.set(key, serializedValue);
        }
      }
    } catch (error) {
      this.logger.error(`Redis cluster set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete key from cache (cluster or standalone)
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.isClusterMode && this.cluster) {
        const result = await this.cluster.del(key);
        return result > 0;
      }
      return false;
    } catch (error) {
      this.logger.error(`Redis cluster delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache (cluster or standalone)
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.isClusterMode && this.cluster) {
        const result = await this.cluster.exists(key);
        return result === 1;
      }
      return false;
    } catch (error) {
      this.logger.error(`Redis cluster exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cluster nodes information
   */
  async getClusterInfo(): Promise<any> {
    if (!this.isClusterMode || !this.cluster) {
      return { mode: 'standalone', enabled: false };
    }

    try {
      const nodes = this.cluster.nodes();
      const nodeInfo = await Promise.all(
        nodes.map(async (node) => {
          try {
            const info = await node.info();
            const role = await node.cluster('INFO');
            return {
              host: node.options.host,
              port: node.options.port,
              status: node.status,
              info,
              role,
            };
          } catch (error) {
            return {
              host: node.options.host,
              port: node.options.port,
              status: node.status,
              error: error.message,
            };
          }
        })
      );

      return {
        mode: 'cluster',
        enabled: true,
        nodes: nodeInfo,
        status: this.cluster.status,
      };
    } catch (error) {
      this.logger.error('Failed to get cluster info:', error);
      return {
        mode: 'cluster',
        enabled: true,
        error: error.message,
      };
    }
  }

  /**
   * Health check for Redis cluster
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; nodes?: number; error?: string }> {
    try {
      if (!this.isClusterMode || !this.cluster) {
        return { status: 'healthy', nodes: 0 };
      }

      // Test connectivity
      await this.cluster.ping();
      
      // Test set/get operations
      const testKey = `cluster_health_check_${Date.now()}`;
      await this.set(testKey, 'test', 10);
      const testValue = await this.get<string>(testKey);
      await this.delete(testKey);
      
      if (testValue !== 'test') {
        return { status: 'degraded', nodes: this.cluster.nodes().length, error: 'Set/get test failed' };
      }

      return {
        status: 'healthy',
        nodes: this.cluster.nodes().length,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        nodes: this.isClusterMode && this.cluster ? this.cluster.nodes().length : 0,
        error: error.message,
      };
    }
  }

  /**
   * Get the underlying cluster client (for advanced operations)
   */
  getClusterClient(): Cluster | null {
    return this.isClusterMode ? this.cluster : null;
  }

  /**
   * Check if cluster mode is enabled
   */
  isClusterEnabled(): boolean {
    return this.isClusterMode;
  }
}