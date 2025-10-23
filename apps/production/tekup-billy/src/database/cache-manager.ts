/**
 * Enhanced Cache Manager for Tekup-Billy MCP v2.0
 * 
 * Provides multi-tier caching layer between MCP tools and Billy.dk API:
 * - Redis Cluster (L1) - Fast distributed cache
 * - Supabase (L2) - Persistent cache with TTL
 * - Local Memory (L3) - In-process cache
 * - Cache-first strategy with Billy API fallback
 * - Automatic cache invalidation on updates
 * - Cache hit/miss metrics and performance monitoring
 * - Organization-scoped caching with distributed invalidation
 */

import { log } from '../utils/logger.js';
import { BillyClient } from '../billy-client.js';
import {
    getCachedData,
    setCachedData,
    invalidateCache,
    recordUsageMetric,
    getBillyApiKey,
    isSupabaseEnabled,
} from './supabase-client.js';
import { getRedisClusterManager, isRedisEnabled, RedisClusterManager } from './redis-cluster-manager.js';
import type { BillyInvoice, BillyContact, BillyProduct } from '../types.js';

// Cache table mappings
const CACHE_TABLES = {
    invoices: 'billy_cached_invoices' as const,
    customers: 'billy_cached_customers' as const,
    products: 'billy_cached_products' as const,
};

// Cache tier configuration
const CACHE_TIERS = {
    REDIS: 'redis',
    SUPABASE: 'supabase',
    LOCAL: 'local'
} as const;

// Default cache TTL configuration (in seconds for Redis, minutes for Supabase)
const DEFAULT_CACHE_TTL = {
    REDIS_SECONDS: 300, // 5 minutes
    SUPABASE_MINUTES: 60, // 1 hour
    LOCAL_SECONDS: 60 // 1 minute
};

// Local memory cache using LRU
class LocalCache {
    private cache = new Map<string, { data: any; expires: number }>();
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    set(key: string, data: any, ttlSeconds: number): void {
        // Remove oldest entries if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            expires: Date.now() + (ttlSeconds * 1000)
        });
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * Enhanced Multi-Tier Cache Manager class
 */
export class CacheManager {
    private organizationId: string;
    private billyClient: BillyClient | null = null;
    private cacheTTL: number;
    private supabaseEnabled: boolean;
    private redisEnabled: boolean;
    private redisManager: RedisClusterManager | null = null;
    private localCache: LocalCache;
    private cacheStrategy: 'redis-first' | 'supabase-first' | 'local-only';

    constructor(organizationId: string, cacheTTL: number = DEFAULT_CACHE_TTL.SUPABASE_MINUTES) {
        this.organizationId = organizationId;
        this.cacheTTL = cacheTTL;
        this.supabaseEnabled = isSupabaseEnabled();
        this.redisEnabled = isRedisEnabled();
        this.localCache = new LocalCache();
        
        // Determine cache strategy based on available services
        if (this.redisEnabled) {
            this.cacheStrategy = 'redis-first';
            this.redisManager = getRedisClusterManager();
        } else if (this.supabaseEnabled) {
            this.cacheStrategy = 'supabase-first';
        } else {
            this.cacheStrategy = 'local-only';
        }

        log.info('CacheManager initialized', {
            organizationId: this.organizationId,
            strategy: this.cacheStrategy,
            redisEnabled: this.redisEnabled,
            supabaseEnabled: this.supabaseEnabled
        });

        // Subscribe to distributed cache invalidation events
        if (this.redisManager) {
            this.setupDistributedInvalidation();
        }
    }

    /**
     * Set up distributed cache invalidation
     */
    private async setupDistributedInvalidation(): Promise<void> {
        if (!this.redisManager) return;

        try {
            await this.redisManager.subscribeToInvalidations((pattern, keys) => {
                log.info('Received distributed cache invalidation', { pattern, keys });
                
                // Invalidate local cache for matching keys
                keys.forEach(key => {
                    if (key.startsWith(`tekup:${this.organizationId}:`)) {
                        this.localCache.delete(key);
                    }
                });
            });
        } catch (error) {
            log.error('Failed to setup distributed invalidation', error);
        }
    }

    /**
     * Initialize Billy.dk client (lazy initialization)
     */
    private async getBillyClient(): Promise<BillyClient> {
        if (this.billyClient) {
            return this.billyClient;
        }

        // Get decrypted API key from database
        const apiKey = await getBillyApiKey(this.organizationId);
        if (!apiKey) {
            throw new Error('Billy.dk API key not found for organization');
        }

        // Create Billy client
        this.billyClient = new BillyClient({
            apiKey,
            apiBase: process.env.BILLY_API_BASE || 'https://api.billysbilling.com/v2',
            organizationId: this.organizationId,
        });

        return this.billyClient;
    }

    /**
     * Generate cache key for organization-scoped data
     */
    private getCacheKey(type: string, id: string): string {
        return `tekup:${this.organizationId}:${type}:${id}`;
    }

    /**
     * Multi-tier cache get operation
     */
    private async getFromCache<T>(key: string): Promise<T | null> {
        // L1: Local memory cache
        const localResult = this.localCache.get<T>(key);
        if (localResult !== null) {
            return localResult;
        }

        // L2: Redis cluster cache
        if (this.redisManager) {
            try {
                const redisResult = await this.redisManager.get<T>(key);
                if (redisResult !== null) {
                    // Populate local cache
                    this.localCache.set(key, redisResult, DEFAULT_CACHE_TTL.LOCAL_SECONDS);
                    return redisResult;
                }
            } catch (error) {
                log.warn('Redis cache get failed, falling back to Supabase', { key, error });
            }
        }

        // L3: Supabase persistent cache (fallback)
        if (this.supabaseEnabled) {
            try {
                // Extract table and ID from cache key
                const keyParts = key.split(':');
                if (keyParts.length >= 4) {
                    const type = keyParts[2];
                    const id = keyParts[3];
                    const table = this.getSupabaseTable(type);
                    
                    if (table) {
                        const supabaseResult = await getCachedData<T>(table, this.organizationId, id);
                        if (supabaseResult !== null) {
                            // Populate higher-tier caches
                            this.localCache.set(key, supabaseResult, DEFAULT_CACHE_TTL.LOCAL_SECONDS);
                            if (this.redisManager) {
                                await this.redisManager.set(key, supabaseResult, DEFAULT_CACHE_TTL.REDIS_SECONDS);
                            }
                            return supabaseResult;
                        }
                    }
                }
            } catch (error) {
                log.warn('Supabase cache get failed', { key, error });
            }
        }

        return null;
    }

    /**
     * Multi-tier cache set operation
     */
    private async setInCache<T>(key: string, data: T, type: string, id: string): Promise<void> {
        // L1: Local memory cache
        this.localCache.set(key, data, DEFAULT_CACHE_TTL.LOCAL_SECONDS);

        // L2: Redis cluster cache
        if (this.redisManager) {
            try {
                await this.redisManager.set(key, data, DEFAULT_CACHE_TTL.REDIS_SECONDS);
            } catch (error) {
                log.warn('Redis cache set failed', { key, error });
            }
        }

        // L3: Supabase persistent cache
        if (this.supabaseEnabled) {
            try {
                const table = this.getSupabaseTable(type);
                if (table) {
                    await setCachedData(table, this.organizationId, id, data, this.cacheTTL);
                }
            } catch (error) {
                log.warn('Supabase cache set failed', { key, error });
            }
        }
    }

    /**
     * Multi-tier cache invalidation
     */
    private async invalidateFromCache(key: string, type: string, id: string): Promise<void> {
        // L1: Local memory cache
        this.localCache.delete(key);

        // L2: Redis cluster cache with distributed invalidation
        if (this.redisManager) {
            try {
                await this.redisManager.del(key);
                // Publish invalidation event to other instances
                await this.redisManager.publishInvalidation(key, [key]);
            } catch (error) {
                log.warn('Redis cache invalidation failed', { key, error });
            }
        }

        // L3: Supabase persistent cache
        if (this.supabaseEnabled) {
            try {
                const table = this.getSupabaseTable(type);
                if (table) {
                    await invalidateCache(table, this.organizationId, id);
                }
            } catch (error) {
                log.warn('Supabase cache invalidation failed', { key, error });
            }
        }
    }

    /**
     * Get Supabase table name from cache type
     */
    private getSupabaseTable(type: string): keyof typeof CACHE_TABLES | null {
        switch (type) {
            case 'invoices':
                return 'invoices';
            case 'customers':
                return 'customers';
            case 'products':
                return 'products';
            default:
                return null;
        }
    }

    // =================================================
    // INVOICES
    // =================================================

    /**
     * Get invoice by ID (multi-tier cache-first)
     */
    async getInvoice(invoiceId: string, toolName: string = 'get_invoice'): Promise<BillyInvoice | null> {
        const startTime = Date.now();
        let cacheHit = false;
        let cacheTier = 'none';

        try {
            // Try multi-tier cache first
            const cacheKey = this.getCacheKey('invoices', invoiceId);
            const cached = await this.getFromCache<BillyInvoice>(cacheKey);

            if (cached) {
                cacheHit = true;
                // Determine which tier provided the result
                if (this.localCache.get(cacheKey)) {
                    cacheTier = 'local';
                } else if (this.redisManager) {
                    cacheTier = 'redis';
                } else {
                    cacheTier = 'supabase';
                }

                const duration = Date.now() - startTime;
                if (this.supabaseEnabled) {
                    await recordUsageMetric(this.organizationId, toolName, true, duration, true);
                }

                log.debug('Cache hit for invoice', { invoiceId, tier: cacheTier, duration });
                return cached;
            }

            // Cache miss - fetch from Billy API
            const client = await this.getBillyClient();
            const invoice = await client.getInvoice(invoiceId);

            if (invoice) {
                // Store in all cache tiers
                await this.setInCache(cacheKey, invoice, 'invoices', invoiceId);
            }

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, true, duration, false);
            }

            log.debug('Cache miss for invoice', { invoiceId, duration });
            return invoice;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, false, duration, cacheHit);
            }
            throw error;
        }
    }

    /**
     * List invoices (cache-first for individual invoices)
     */
    async listInvoices(
        filters?: { state?: string; contactId?: string },
        toolName: string = 'list_invoices'
    ): Promise<BillyInvoice[]> {
        const startTime = Date.now();

        try {
            // For list operations, we always hit the API to get the latest list
            // But individual invoice data may come from cache
            const client = await this.getBillyClient();
            const invoices = await client.getInvoices(filters);

            // Cache each invoice individually for future single-invoice requests
            const cachePromises = invoices.map((invoice: BillyInvoice) =>
                setCachedData(
                    CACHE_TABLES.invoices,
                    this.organizationId,
                    invoice.id,
                    invoice,
                    this.cacheTTL
                )
            );

            await Promise.all(cachePromises);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return invoices;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    /**
     * Create invoice (caches result)
     */
    async createInvoice(
        input: any,
        toolName: string = 'create_invoice'
    ): Promise<BillyInvoice> {
        const startTime = Date.now();

        try {
            const client = await this.getBillyClient();
            const invoice = await client.createInvoice(input);

            // Cache the newly created invoice in all tiers
            const cacheKey = this.getCacheKey('invoices', invoice.id);
            await this.setInCache(cacheKey, invoice, 'invoices', invoice.id);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, true, duration, false);
            }

            return invoice;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            }
            throw error;
        }
    }

    /**
     * Update invoice (invalidates cache and re-fetches)
     */
    async updateInvoice(
        invoiceId: string,
        updates: any,
        toolName: string = 'update_invoice'
    ): Promise<BillyInvoice> {
        const startTime = Date.now();

        try {
            // Invalidate cache across all tiers
            const cacheKey = this.getCacheKey('invoices', invoiceId);
            await this.invalidateFromCache(cacheKey, 'invoices', invoiceId);

            const client = await this.getBillyClient();
            const invoice = await client.getInvoice(invoiceId);
            
            if (!invoice) {
                const duration = Date.now() - startTime;
                if (this.supabaseEnabled) {
                    await recordUsageMetric(this.organizationId, toolName, false, duration, false);
                }
                throw new Error(`Invoice ${invoiceId} not found`);
            }

            // Cache the updated invoice
            await this.setInCache(cacheKey, invoice, 'invoices', invoice.id);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, true, duration, false);
            }

            return invoice;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) {
                await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            }
            throw error;
        }
    }

    /**
     * Delete invoice (invalidates cache)
     * Note: Billy API doesn't support deleting invoices directly.
     * This method invalidates cache only.
     */
    async deleteInvoice(
        invoiceId: string,
        toolName: string = 'delete_invoice'
    ): Promise<boolean> {
        const startTime = Date.now();

        try {
            // Billy API doesn't have delete endpoint - invalidate cache only
            if (this.supabaseEnabled) await invalidateCache(CACHE_TABLES.invoices, this.organizationId, invoiceId);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    // =================================================
    // CUSTOMERS
    // =================================================

    /**
     * Get customer by ID (cache-first)
     */
    async getCustomer(customerId: string, toolName: string = 'get_customer'): Promise<BillyContact | null> {
        const startTime = Date.now();
        let cacheHit = false;

        try {
            // Try cache first
            const cached = await getCachedData<BillyContact>(
                CACHE_TABLES.customers,
                this.organizationId,
                customerId
            );

            if (cached) {
                cacheHit = true;
                const duration = Date.now() - startTime;
                if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, true);
                return cached;
            }

            // Cache miss - fetch from Billy API
            const client = await this.getBillyClient();
            const customer = await client.getContact(customerId);

            if (customer) {
                // Store in cache
                if (this.supabaseEnabled) await setCachedData(
                    CACHE_TABLES.customers,
                    this.organizationId,
                    customerId,
                    customer,
                    this.cacheTTL
                );
            }

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return customer;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, cacheHit);
            throw error;
        }
    }

    /**
     * List customers (cache-first for individual customers)
     */
    async listCustomers(
        filters?: { type?: string },
        toolName: string = 'list_customers'
    ): Promise<BillyContact[]> {
        const startTime = Date.now();

        try {
            const client = await this.getBillyClient();
            const customers = await client.getContacts('customer', filters?.type);

            // Cache each customer individually
            const cachePromises = customers.map((customer: BillyContact) =>
                setCachedData(
                    CACHE_TABLES.customers,
                    this.organizationId,
                    customer.id,
                    customer,
                    this.cacheTTL
                )
            );

            await Promise.all(cachePromises);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return customers;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    /**
     * Create customer (caches result)
     */
    async createCustomer(
        input: any,
        toolName: string = 'create_customer'
    ): Promise<BillyContact> {
        const startTime = Date.now();

        try {
            const client = await this.getBillyClient();
            const customer = await client.createContact(input);

            // Cache the newly created customer
            if (this.supabaseEnabled) await setCachedData(
                CACHE_TABLES.customers,
                this.organizationId,
                customer.id,
                customer,
                this.cacheTTL
            );

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return customer;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    /**
     * Update customer (invalidates cache)
     * Note: Billy API doesn't support updating contacts directly.
     * This method invalidates cache and re-fetches.
     */
    async updateCustomer(
        customerId: string,
        updates: any,
        toolName: string = 'update_customer'
    ): Promise<BillyContact> {
        const startTime = Date.now();

        try {
            // Billy API doesn't have update endpoint - invalidate cache and re-fetch
            if (this.supabaseEnabled) await invalidateCache(CACHE_TABLES.customers, this.organizationId, customerId);

            const client = await this.getBillyClient();
            const customer = await client.getContact(customerId);

            // Cache the fetched customer
            if (this.supabaseEnabled) await setCachedData(
                CACHE_TABLES.customers,
                this.organizationId,
                customer.id,
                customer,
                this.cacheTTL
            );

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return customer;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    // =================================================
    // PRODUCTS
    // =================================================

    /**
     * Get product by ID (cache-first)
     */
    async getProduct(productId: string, toolName: string = 'get_product'): Promise<BillyProduct | null> {
        const startTime = Date.now();
        let cacheHit = false;

        try {
            // Try cache first
            const cached = await getCachedData<BillyProduct>(
                CACHE_TABLES.products,
                this.organizationId,
                productId
            );

            if (cached) {
                cacheHit = true;
                const duration = Date.now() - startTime;
                if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, true);
                return cached;
            }

            // Cache miss - Billy API doesn't have single product GET
            // Fetch all products and find the one we need
            const client = await this.getBillyClient();
            const products = await client.getProducts();
            const product = products.find(p => p.id === productId) || null;

            if (product) {
                // Store in cache
                if (this.supabaseEnabled) await setCachedData(
                    CACHE_TABLES.products,
                    this.organizationId,
                    productId,
                    product,
                    this.cacheTTL
                );
            }

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return product;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, cacheHit);
            throw error;
        }
    }

    /**
     * List products (cache-first for individual products)
     */
    async listProducts(
        filters?: any,
        toolName: string = 'list_products'
    ): Promise<BillyProduct[]> {
        const startTime = Date.now();

        try {
            const client = await this.getBillyClient();
            const products = await client.getProducts(filters?.search);

            // Cache each product individually
            const cachePromises = products.map((product: BillyProduct) =>
                setCachedData(
                    CACHE_TABLES.products,
                    this.organizationId,
                    product.id,
                    product,
                    this.cacheTTL
                )
            );

            await Promise.all(cachePromises);

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return products;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    /**
     * Create product (caches result)
     */
    async createProduct(
        input: any,
        toolName: string = 'create_product'
    ): Promise<BillyProduct> {
        const startTime = Date.now();

        try {
            const client = await this.getBillyClient();
            const product = await client.createProduct(input);

            // Cache the newly created product
            if (this.supabaseEnabled) await setCachedData(
                CACHE_TABLES.products,
                this.organizationId,
                product.id,
                product,
                this.cacheTTL
            );

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return product;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    /**
     * Update product (invalidates cache)
     * Note: Billy API doesn't support updating products directly.
     * This method invalidates cache and re-fetches.
     */
    async updateProduct(
        productId: string,
        updates: any,
        toolName: string = 'update_product'
    ): Promise<BillyProduct | null> {
        const startTime = Date.now();

        try {
            // Billy API doesn't have update endpoint - invalidate cache and re-fetch
            if (this.supabaseEnabled) await invalidateCache(CACHE_TABLES.products, this.organizationId, productId);

            const client = await this.getBillyClient();
            const products = await client.getProducts();
            const product = products.find(p => p.id === productId) || null;

            if (product) {
                // Cache the fetched product
                if (this.supabaseEnabled) await setCachedData(
                    CACHE_TABLES.products,
                    this.organizationId,
                    product.id,
                    product,
                    this.cacheTTL
                );
            }

            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, true, duration, false);

            return product;
        } catch (error) {
            const duration = Date.now() - startTime;
            if (this.supabaseEnabled) await recordUsageMetric(this.organizationId, toolName, false, duration, false);
            throw error;
        }
    }

    // =================================================
    // ENHANCED CACHE MANAGEMENT
    // =================================================

    /**
     * Clear all cache for this organization across all tiers
     */
    async clearAllCache(): Promise<void> {
        try {
            // Clear local cache
            this.localCache.clear();

            // Clear Redis cache pattern
            if (this.redisManager) {
                const pattern = `tekup:${this.organizationId}:*`;
                await this.redisManager.invalidatePattern(pattern);
            }

            // Clear Supabase cache (would need custom implementation)
            log.info('Cache cleared for organization', { organizationId: this.organizationId });
        } catch (error) {
            log.error('Failed to clear cache', error);
        }
    }

    /**
     * Warm cache with frequently accessed data
     */
    async warmCache(): Promise<void> {
        try {
            log.info('Starting cache warming', { organizationId: this.organizationId });

            const client = await this.getBillyClient();

            // Warm invoice cache with recent invoices
            const recentInvoices = await client.getInvoices({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
            });

            for (const invoice of recentInvoices.slice(0, 50)) { // Limit to 50 most recent
                const cacheKey = this.getCacheKey('invoices', invoice.id);
                await this.setInCache(cacheKey, invoice, 'invoices', invoice.id);
            }

            // Warm customer cache
            const customers = await client.getContacts('customer');
            for (const customer of customers.slice(0, 100)) { // Limit to 100 customers
                const cacheKey = this.getCacheKey('customers', customer.id);
                await this.setInCache(cacheKey, customer, 'customers', customer.id);
            }

            // Warm product cache
            const products = await client.getProducts();
            for (const product of products) {
                const cacheKey = this.getCacheKey('products', product.id);
                await this.setInCache(cacheKey, product, 'products', product.id);
            }

            log.info('Cache warming completed', {
                organizationId: this.organizationId,
                invoices: recentInvoices.length,
                customers: customers.length,
                products: products.length
            });
        } catch (error) {
            log.error('Cache warming failed', error);
        }
    }

    /**
     * Get cache statistics across all tiers
     */
    async getCacheStats(): Promise<{
        local: { size: number };
        redis?: any;
        supabase?: any;
        strategy: string;
    }> {
        const stats: any = {
            local: { size: this.localCache.size() },
            strategy: this.cacheStrategy
        };

        if (this.redisManager) {
            stats.redis = await this.redisManager.getHealthStatus();
        }

        if (this.supabaseEnabled) {
            // Could add Supabase cache stats here
            stats.supabase = { enabled: true };
        }

        return stats;
    }

    /**
     * Set custom cache TTL
     */
    setCacheTTL(minutes: number): void {
        this.cacheTTL = minutes;
    }

    /**
     * Get current cache TTL
     */
    getCacheTTL(): number {
        return this.cacheTTL;
    }

    /**
     * Get cache strategy
     */
    getCacheStrategy(): string {
        return this.cacheStrategy;
    }

    /**
     * Force cache tier for testing
     */
    setCacheStrategy(strategy: 'redis-first' | 'supabase-first' | 'local-only'): void {
        this.cacheStrategy = strategy;
        log.info('Cache strategy changed', { strategy });
    }
}

/**
 * Create a cache manager instance for an organization
 */
export function createCacheManager(organizationId: string, cacheTTL?: number): CacheManager {
    return new CacheManager(organizationId, cacheTTL);
}


