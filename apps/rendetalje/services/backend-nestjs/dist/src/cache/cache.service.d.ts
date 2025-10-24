import { ConfigService } from '@nestjs/config';
export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    tags?: string[];
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
}
export declare class CacheService {
    private readonly configService;
    private readonly logger;
    private redis;
    private stats;
    constructor(configService: ConfigService);
    private initializeRedis;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(keyValuePairs: Array<{
        key: string;
        value: T;
        options?: CacheOptions;
    }>): Promise<boolean>;
    invalidateByTag(tag: string): Promise<number>;
    invalidateByTags(tags: string[]): Promise<number>;
    deleteByPattern(pattern: string): Promise<number>;
    warmCache<T>(key: string, dataLoader: () => Promise<T>, options?: CacheOptions): Promise<T>;
    warmCacheBatch<T>(items: Array<{
        key: string;
        dataLoader: () => Promise<T>;
        options?: CacheOptions;
    }>): Promise<T[]>;
    getStats(): Promise<CacheStats>;
    healthCheck(): Promise<boolean>;
    cleanup(): Promise<void>;
    private prefixKey;
    private tagKey;
    private addKeyToTags;
}
export declare function Cacheable(key: string, options?: CacheOptions): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
export declare function CacheEvict(tags: string[]): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
