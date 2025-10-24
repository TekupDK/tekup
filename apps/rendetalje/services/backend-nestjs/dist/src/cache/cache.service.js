"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
exports.Cacheable = Cacheable;
exports.CacheEvict = CacheEvict;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let CacheService = CacheService_1 = class CacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.stats = {
            hits: 0,
            misses: 0
        };
        this.initializeRedis();
    }
    initializeRedis() {
        const redisUrl = this.configService.get('REDIS_URL');
        const redisHost = this.configService.get('REDIS_HOST', 'localhost');
        const redisPort = this.configService.get('REDIS_PORT', 6379);
        const redisPassword = this.configService.get('REDIS_PASSWORD');
        try {
            if (redisUrl) {
                this.redis = new ioredis_1.default(redisUrl);
            }
            else {
                this.redis = new ioredis_1.default({
                    host: redisHost,
                    port: redisPort,
                    password: redisPassword,
                    retryDelayOnFailover: 100,
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                });
            }
            this.redis.on('connect', () => {
                this.logger.log('Connected to Redis');
            });
            this.redis.on('error', (error) => {
                this.logger.error('Redis connection error:', error);
            });
            this.redis.on('ready', () => {
                this.logger.log('Redis is ready');
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis:', error);
        }
    }
    async get(key) {
        try {
            const value = await this.redis.get(this.prefixKey(key));
            if (value === null) {
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.error(`Failed to get cache key ${key}:`, error);
            this.stats.misses++;
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            const serializedValue = JSON.stringify(value);
            const prefixedKey = this.prefixKey(key);
            if (options.ttl) {
                await this.redis.setex(prefixedKey, options.ttl, serializedValue);
            }
            else {
                await this.redis.set(prefixedKey, serializedValue);
            }
            if (options.tags && options.tags.length > 0) {
                await this.addKeyToTags(key, options.tags);
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to set cache key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        try {
            const result = await this.redis.del(this.prefixKey(key));
            return result > 0;
        }
        catch (error) {
            this.logger.error(`Failed to delete cache key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(this.prefixKey(key));
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Failed to check cache key existence ${key}:`, error);
            return false;
        }
    }
    async mget(keys) {
        try {
            const prefixedKeys = keys.map(key => this.prefixKey(key));
            const values = await this.redis.mget(...prefixedKeys);
            return values.map(value => {
                if (value === null) {
                    this.stats.misses++;
                    return null;
                }
                this.stats.hits++;
                return JSON.parse(value);
            });
        }
        catch (error) {
            this.logger.error('Failed to get multiple cache keys:', error);
            this.stats.misses += keys.length;
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            const pipeline = this.redis.pipeline();
            for (const { key, value, options = {} } of keyValuePairs) {
                const serializedValue = JSON.stringify(value);
                const prefixedKey = this.prefixKey(key);
                if (options.ttl) {
                    pipeline.setex(prefixedKey, options.ttl, serializedValue);
                }
                else {
                    pipeline.set(prefixedKey, serializedValue);
                }
                if (options.tags && options.tags.length > 0) {
                    for (const tag of options.tags) {
                        pipeline.sadd(this.tagKey(tag), key);
                    }
                }
            }
            await pipeline.exec();
            return true;
        }
        catch (error) {
            this.logger.error('Failed to set multiple cache keys:', error);
            return false;
        }
    }
    async invalidateByTag(tag) {
        try {
            const keys = await this.redis.smembers(this.tagKey(tag));
            if (keys.length === 0) {
                return 0;
            }
            const prefixedKeys = keys.map(key => this.prefixKey(key));
            const pipeline = this.redis.pipeline();
            for (const key of prefixedKeys) {
                pipeline.del(key);
            }
            pipeline.del(this.tagKey(tag));
            const results = await pipeline.exec();
            return keys.length;
        }
        catch (error) {
            this.logger.error(`Failed to invalidate cache by tag ${tag}:`, error);
            return 0;
        }
    }
    async invalidateByTags(tags) {
        let totalInvalidated = 0;
        for (const tag of tags) {
            totalInvalidated += await this.invalidateByTag(tag);
        }
        return totalInvalidated;
    }
    async deleteByPattern(pattern) {
        try {
            const keys = await this.redis.keys(this.prefixKey(pattern));
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to delete keys by pattern ${pattern}:`, error);
            return 0;
        }
    }
    async warmCache(key, dataLoader, options = {}) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const data = await dataLoader();
            await this.set(key, data, options);
            return data;
        }
        catch (error) {
            this.logger.error(`Failed to warm cache for key ${key}:`, error);
            return await dataLoader();
        }
    }
    async warmCacheBatch(items) {
        const results = [];
        const keys = items.map(item => item.key);
        const cachedValues = await this.mget(keys);
        const itemsToLoad = [];
        for (let i = 0; i < items.length; i++) {
            if (cachedValues[i] === null) {
                itemsToLoad.push({ index: i, item: items[i] });
            }
            else {
                results[i] = cachedValues[i];
            }
        }
        const loadPromises = itemsToLoad.map(async ({ index, item }) => {
            try {
                const data = await item.dataLoader();
                results[index] = data;
                await this.set(item.key, data, item.options);
                return data;
            }
            catch (error) {
                this.logger.error(`Failed to load data for key ${item.key}:`, error);
                throw error;
            }
        });
        await Promise.all(loadPromises);
        return results;
    }
    async getStats() {
        try {
            const info = await this.redis.info('memory');
            const keyCount = await this.redis.dbsize();
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';
            const totalRequests = this.stats.hits + this.stats.misses;
            const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: Math.round(hitRate * 100) / 100,
                totalKeys: keyCount,
                memoryUsage
            };
        }
        catch (error) {
            this.logger.error('Failed to get cache stats:', error);
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: 'Unknown'
            };
        }
    }
    async healthCheck() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            this.logger.error('Redis health check failed:', error);
            return false;
        }
    }
    async cleanup() {
        try {
            await this.redis.disconnect();
            this.logger.log('Redis connection closed');
        }
        catch (error) {
            this.logger.error('Failed to cleanup Redis connection:', error);
        }
    }
    prefixKey(key) {
        const prefix = this.configService.get('CACHE_PREFIX', 'rendetalje');
        return `${prefix}:${key}`;
    }
    tagKey(tag) {
        return this.prefixKey(`tag:${tag}`);
    }
    async addKeyToTags(key, tags) {
        const pipeline = this.redis.pipeline();
        for (const tag of tags) {
            pipeline.sadd(this.tagKey(tag), key);
        }
        await pipeline.exec();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
function Cacheable(key, options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheService = this.cacheService;
            if (!cacheService) {
                return method.apply(this, args);
            }
            const cacheKey = `${key}:${JSON.stringify(args)}`;
            const cached = await cacheService.get(cacheKey);
            if (cached !== null) {
                return cached;
            }
            const result = await method.apply(this, args);
            await cacheService.set(cacheKey, result, options);
            return result;
        };
    };
}
function CacheEvict(tags) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await method.apply(this, args);
            const cacheService = this.cacheService;
            if (cacheService) {
                await cacheService.invalidateByTags(tags);
            }
            return result;
        };
    };
}
//# sourceMappingURL=cache.service.js.map