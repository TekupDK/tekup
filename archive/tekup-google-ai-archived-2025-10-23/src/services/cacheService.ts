import { logger } from "../logger";
import { redisService } from "./redisService";

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

/**
 * Simple in-memory cache with TTL support
 * Optimized for Gmail and Calendar API responses
 */
class CacheService {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private stats: CacheStats = { hits: 0, misses: 0, size: 0 };

    /**
     * Get value from cache (Redis + in-memory fallback)
     */
    async get<T>(key: string): Promise<T | null> {
        // Try Redis first (silently fail to memory)
        try {
            const redisValue = await redisService.get(key);
            if (redisValue) {
                this.stats.hits++;
                logger.debug({ key, source: 'redis' }, "Cache hit");
                return JSON.parse(redisValue) as T;
            }
        } catch (error) {
            // Silent fallback to memory
        }

        // Fallback to in-memory cache
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            logger.debug({ key, source: 'memory' }, "Cache miss");
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size = this.cache.size;
            logger.debug({ key, source: 'memory' }, "Cache expired");
            return null;
        }

        this.stats.hits++;
        logger.debug({ key, source: 'memory' }, "Cache hit");
        return entry.data as T;
    }

    /**
     * Set value in cache with TTL in seconds
     */
    async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
        const expiresAt = Date.now() + ttlSeconds * 1000;

        // Set in Redis first (silently fail to memory)
        try {
            await redisService.set(key, JSON.stringify(data), ttlSeconds);
            logger.debug({ key, ttlSeconds, source: 'redis' }, "Cache set");
        } catch (error) {
            // Silent fallback to memory
        }

        // Always set in memory as fallback
        this.cache.set(key, { data, expiresAt });
        this.stats.size = this.cache.size;
        logger.debug({ key, ttlSeconds, source: 'memory' }, "Cache set");
    }

    /**
     * Delete value from cache
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.size = this.cache.size;
            logger.debug({ key }, "Cache invalidated");
        }
        return deleted;
    }

    /**
     * Delete all keys matching a pattern
     */
    invalidatePattern(pattern: string): number {
        let count = 0;
        const regex = new RegExp(pattern);

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }

        this.stats.size = this.cache.size;
        logger.info({ pattern, count }, "Cache pattern invalidated");
        return count;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, size: 0 };
        logger.info("Cache cleared");
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get cache hit rate
     */
    getHitRate(): number {
        const total = this.stats.hits + this.stats.misses;
        return total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Remove expired entries
     */
    cleanup(): number {
        let count = 0;
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                count++;
            }
        }

        this.stats.size = this.cache.size;
        if (count > 0) {
            logger.debug({ count }, "Cache cleanup completed");
        }

        return count;
    }
}

// Singleton instance
export const cache = new CacheService();

// Cache key builders for different data types
export const CacheKeys = {
    // Gmail cache keys
    email: (emailId: string) => `gmail:email:${emailId}`,
    emailList: (maxResults: number, query?: string) =>
        `gmail:list:${maxResults}:${query || "all"}`,
    thread: (threadId: string) => `gmail:thread:${threadId}`,

    // Calendar cache keys
    event: (eventId: string) => `calendar:event:${eventId}`,
    eventList: (calendarId: string, timeMin: string, timeMax?: string) =>
        `calendar:list:${calendarId}:${timeMin}:${timeMax || "none"}`,
    availability: (calendarId: string, timeMin: string, timeMax: string) =>
        `calendar:availability:${calendarId}:${timeMin}:${timeMax}`,
    nextSlot: (
        calendarId: string,
        durationMinutes: number,
        startAfter: string
    ) =>
        `calendar:nextslot:${calendarId}:${durationMinutes}:${startAfter}`,

    // Lead cache keys
    lead: (leadId: string) => `lead:${leadId}`,
    leadList: () => `lead:list`,
} as const;

// Default TTL values in seconds
export const CacheTTL = {
    email: 5 * 60, // 5 minutes
    emailList: 2 * 60, // 2 minutes
    thread: 5 * 60, // 5 minutes
    event: 15 * 60, // 15 minutes
    eventList: 5 * 60, // 5 minutes
    availability: 5 * 60, // 5 minutes
    nextSlot: 5 * 60, // 5 minutes
    lead: 10 * 60, // 10 minutes
    leadList: 2 * 60, // 2 minutes
    medium: 10 * 60, // 10 minutes (for labels and other medium-duration data)
} as const;

// Start automatic cleanup every 5 minutes
setInterval(() => {
    cache.cleanup();
}, 5 * 60 * 1000);

logger.info("Cache service initialized with automatic cleanup");
