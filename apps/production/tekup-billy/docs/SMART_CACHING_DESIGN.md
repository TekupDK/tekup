# 🧠 Smart Caching Strategy - v1.3.0

**Feature:** AI-Powered Predictive Cache Management  
**Priority:** Phase 2 (Uge 4-5)  
**Effort:** High | **Value:** High  

---

## 🎯 **VISION**

Bygge et intelligent caching system som:
- **Lærer** af brugsmønstre og forudsiger behov
- **Optimerer** TTL baseret på ændringshyppighed
- **Præ-loader** data før det bedes om
- **Minimerer** Billy.dk API calls uden at ofre freshness
- **Tilpasser** sig automatisk til forskellige workloads

---

## 🏗️ **SYSTEM ARCHITECTURE**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Usage Analytics │    │  ML Predictor    │    │  Cache Warmer   │
│                 │───▶│                  │───▶│                 │
│ • Access Logs   │    │ • Pattern Learn  │    │ • Preload Data  │
│ • Frequency     │    │ • Next Request   │    │ • Background    │
│ • Time Patterns │    │ • TTL Optimize   │    │ • Scheduled     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Smart Cache     │
                       │                  │
                       │ • Dynamic TTL    │
                       │ • Priority Queue │
                       │ • Eviction Rules │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Supabase DB    │
                       │                  │
                       │ • Cache Data     │
                       │ • Access Stats   │
                       │ • Predictions    │
                       └──────────────────┘
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Smart Cache Manager (Core System):**

```typescript
// smart-cache-manager.ts
import { supabaseAdmin } from './supabase';
import { BillyClient } from './billy-client';

interface CacheEntry {
  id: string;
  organizationId: string;
  resourceType: 'customer' | 'product' | 'invoice';
  resourceId: string;
  data: any;
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
  ttlMinutes: number;
}

interface AccessPattern {
  resourceType: string;
  resourceId: string;
  accessTimes: Date[];
  frequency: number; // Accesses per hour
  lastModifiedAt?: Date;
  predictedNextAccess?: Date;
}

class SmartCacheManager {
  private billyClient: BillyClient;
  private mlPredictor: UsagePredictor;
  private cacheWarmer: CacheWarmer;

  constructor() {
    this.billyClient = new BillyClient();
    this.mlPredictor = new UsagePredictor();
    this.cacheWarmer = new CacheWarmer(this);
  }

  /**
   * Get resource with intelligent caching
   */
  async get<T>(
    resourceType: string,
    resourceId: string,
    organizationId: string
  ): Promise<T> {
    
    // 1. Check cache
    const cached = await this.getCached(resourceType, resourceId, organizationId);
    
    if (cached && !this.shouldRefresh(cached)) {
      // Track access for ML
      await this.trackAccess(resourceType, resourceId, organizationId);
      return cached.data as T;
    }

    // 2. Cache miss or expired - fetch from Billy.dk
    const fresh = await this.fetchFromBilly(resourceType, resourceId, organizationId);

    // 3. Calculate optimal TTL based on usage patterns
    const optimalTTL = await this.calculateOptimalTTL(resourceType, resourceId, organizationId);

    // 4. Store in cache with dynamic TTL
    await this.setCached(resourceType, resourceId, organizationId, fresh, optimalTTL);

    // 5. Track access and update predictions
    await this.trackAccess(resourceType, resourceId, organizationId);
    await this.mlPredictor.updatePredictions(resourceType, resourceId, organizationId);

    return fresh;
  }

  /**
   * Calculate optimal TTL based on access patterns and modification frequency
   */
  private async calculateOptimalTTL(
    resourceType: string,
    resourceId: string,
    organizationId: string
  ): Promise<number> {
    
    // Get historical access patterns
    const pattern = await this.getAccessPattern(resourceType, resourceId, organizationId);

    if (!pattern) {
      // Default TTL for new resources
      return this.getDefaultTTL(resourceType);
    }

    // Factors affecting TTL:
    const factors = {
      accessFrequency: pattern.frequency, // Higher frequency = longer TTL
      modificationRate: this.estimateModificationRate(pattern), // Higher mod rate = shorter TTL
      resourceType: resourceType, // Different defaults per type
      timeSinceLastModification: pattern.lastModifiedAt 
        ? Date.now() - pattern.lastModifiedAt.getTime() 
        : Infinity
    };

    // Algorithm: Balance freshness vs API calls
    let ttlMinutes: number;

    if (factors.accessFrequency > 10) {
      // High-traffic resource: longer TTL to save API calls
      ttlMinutes = 15;
    } else if (factors.accessFrequency > 5) {
      // Medium-traffic: moderate TTL
      ttlMinutes = 10;
    } else {
      // Low-traffic: shorter TTL to ensure freshness
      ttlMinutes = 5;
    }

    // Adjust based on modification rate
    const modRate = factors.modificationRate;
    if (modRate > 0.5) {
      // Changes frequently (>50% of accesses see updates)
      ttlMinutes = Math.max(2, ttlMinutes * 0.5);
    } else if (modRate < 0.1) {
      // Rarely changes (<10%)
      ttlMinutes = Math.min(30, ttlMinutes * 1.5);
    }

    // Resource-specific adjustments
    if (resourceType === 'product') {
      // Products change less frequently
      ttlMinutes *= 1.2;
    } else if (resourceType === 'invoice') {
      // Invoices can change status frequently
      ttlMinutes *= 0.8;
    }

    return Math.round(ttlMinutes);
  }

  /**
   * Estimate how often a resource gets modified
   */
  private estimateModificationRate(pattern: AccessPattern): number {
    // Logic: Track how often cache misses happen vs total accesses
    // Higher miss rate suggests more modifications
    
    // Placeholder - in production, track actual modification events
    const recentMisses = pattern.accessTimes
      .slice(-20) // Last 20 accesses
      .filter(time => {
        // Check if cache was expired at access time
        // This is simplified - real implementation would track misses
        return false; // Placeholder
      }).length;

    return recentMisses / Math.min(20, pattern.accessTimes.length);
  }

  /**
   * Determine if cached entry should be refreshed early
   */
  private shouldRefresh(entry: CacheEntry): boolean {
    // Expired?
    if (entry.expiresAt < new Date()) {
      return true;
    }

    // High-traffic resource near expiration?
    const timeToExpiration = entry.expiresAt.getTime() - Date.now();
    const ttlMs = entry.ttlMinutes * 60 * 1000;
    const percentRemaining = timeToExpiration / ttlMs;

    if (entry.accessCount > 50 && percentRemaining < 0.1) {
      // High traffic, <10% TTL remaining: proactive refresh
      return true;
    }

    return false;
  }

  /**
   * Track resource access for ML predictions
   */
  private async trackAccess(
    resourceType: string,
    resourceId: string,
    organizationId: string
  ) {
    await supabaseAdmin
      .from('billy_cache_access_log')
      .insert({
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: resourceId,
        accessed_at: new Date().toISOString()
      });
  }

  /**
   * Get access pattern for a resource
   */
  private async getAccessPattern(
    resourceType: string,
    resourceId: string,
    organizationId: string
  ): Promise<AccessPattern | null> {
    
    const { data: logs } = await supabaseAdmin
      .from('billy_cache_access_log')
      .select('accessed_at')
      .eq('organization_id', organizationId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .gte('accessed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      .order('accessed_at', { ascending: false });

    if (!logs || logs.length === 0) {
      return null;
    }

    const accessTimes = logs.map(l => new Date(l.accessed_at));
    const hoursSinceFirst = (Date.now() - accessTimes[accessTimes.length - 1].getTime()) / (1000 * 60 * 60);
    const frequency = logs.length / Math.max(hoursSinceFirst, 1);

    return {
      resourceType,
      resourceId,
      accessTimes,
      frequency,
      lastModifiedAt: undefined, // TODO: Track modifications
      predictedNextAccess: this.mlPredictor.predictNextAccess(accessTimes)
    };
  }

  private getDefaultTTL(resourceType: string): number {
    switch (resourceType) {
      case 'product': return 10; // Products change less
      case 'customer': return 7;  // Moderate
      case 'invoice': return 5;   // Changes more frequently
      default: return 5;
    }
  }
}
```

---

## 🤖 **MACHINE LEARNING PREDICTOR**

### **Usage Pattern Prediction:**

```typescript
// usage-predictor.ts

interface TimeSeries {
  timestamps: Date[];
  values: number[];
}

class UsagePredictor {
  /**
   * Predict next access time based on historical pattern
   */
  predictNextAccess(accessTimes: Date[]): Date | null {
    if (accessTimes.length < 3) {
      return null; // Not enough data
    }

    // Calculate average interval between accesses
    const intervals: number[] = [];
    for (let i = 1; i < accessTimes.length; i++) {
      intervals.push(
        accessTimes[i - 1].getTime() - accessTimes[i].getTime()
      );
    }

    // Use median interval to be robust against outliers
    const sortedIntervals = intervals.sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];

    // Predict next access
    const lastAccess = accessTimes[0];
    return new Date(lastAccess.getTime() + medianInterval);
  }

  /**
   * Detect access patterns (daily, hourly, etc.)
   */
  detectPattern(accessTimes: Date[]): 'hourly' | 'daily' | 'weekly' | 'irregular' {
    if (accessTimes.length < 10) {
      return 'irregular';
    }

    // Analyze intervals
    const intervals = this.calculateIntervals(accessTimes);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const week = 7 * day;

    // Classify pattern
    if (Math.abs(avgInterval - hour) < hour * 0.2) {
      return 'hourly';
    } else if (Math.abs(avgInterval - day) < day * 0.2) {
      return 'daily';
    } else if (Math.abs(avgInterval - week) < week * 0.2) {
      return 'weekly';
    }

    return 'irregular';
  }

  /**
   * Update ML predictions for a resource
   */
  async updatePredictions(
    resourceType: string,
    resourceId: string,
    organizationId: string
  ) {
    // Fetch recent access pattern
    const { data: logs } = await supabaseAdmin
      .from('billy_cache_access_log')
      .select('accessed_at')
      .eq('organization_id', organizationId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('accessed_at', { ascending: false })
      .limit(100);

    if (!logs || logs.length < 5) {
      return; // Not enough data
    }

    const accessTimes = logs.map(l => new Date(l.accessed_at));
    
    // Detect pattern and predict next access
    const pattern = this.detectPattern(accessTimes);
    const nextAccess = this.predictNextAccess(accessTimes);

    // Store prediction
    await supabaseAdmin
      .from('billy_cache_predictions')
      .upsert({
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: resourceId,
        pattern_type: pattern,
        predicted_next_access: nextAccess?.toISOString(),
        confidence: this.calculateConfidence(accessTimes),
        updated_at: new Date().toISOString()
      });
  }

  private calculateIntervals(times: Date[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i - 1].getTime() - times[i].getTime());
    }
    return intervals;
  }

  private calculateConfidence(accessTimes: Date[]): number {
    if (accessTimes.length < 5) return 0.3;
    if (accessTimes.length < 20) return 0.6;
    return 0.9;
  }
}
```

---

## 🔥 **CACHE WARMER (Proactive Preloading)**

### **Background Cache Preloading:**

```typescript
// cache-warmer.ts
import { CronJob } from 'cron';
import { SmartCacheManager } from './smart-cache-manager';

class CacheWarmer {
  private cacheManager: SmartCacheManager;
  private jobs: CronJob[] = [];

  constructor(cacheManager: SmartCacheManager) {
    this.cacheManager = cacheManager;
    this.startWarmingJobs();
  }

  /**
   * Start background cache warming jobs
   */
  private startWarmingJobs() {
    // Job 1: Warm frequently accessed resources every 5 minutes
    const frequentJob = new CronJob('*/5 * * * *', async () => {
      await this.warmFrequentlyAccessed();
    });
    frequentJob.start();
    this.jobs.push(frequentJob);

    // Job 2: Warm predicted-next-access resources every 15 minutes
    const predictiveJob = new CronJob('*/15 * * * *', async () => {
      await this.warmPredictedAccesses();
    });
    predictiveJob.start();
    this.jobs.push(predictiveJob);

    // Job 3: Clean up stale cache entries daily
    const cleanupJob = new CronJob('0 2 * * *', async () => { // 2 AM daily
      await this.cleanupStaleCache();
    });
    cleanupJob.start();
    this.jobs.push(cleanupJob);
  }

  /**
   * Preload frequently accessed resources
   */
  private async warmFrequentlyAccessed() {
    console.log('[CacheWarmer] Warming frequently accessed resources...');

    // Find resources accessed >10 times in last hour
    const { data: frequent } = await supabaseAdmin
      .from('billy_cache_access_log')
      .select('organization_id, resource_type, resource_id')
      .gte('accessed_at', new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      .group('organization_id, resource_type, resource_id')
      .having('COUNT(*) > 10');

    if (!frequent) return;

    // Refresh cache for each frequent resource
    for (const resource of frequent) {
      try {
        await this.cacheManager.get(
          resource.resource_type,
          resource.resource_id,
          resource.organization_id
        );
      } catch (error) {
        console.error(`Failed to warm cache for ${resource.resource_id}:`, error);
      }
    }

    console.log(`[CacheWarmer] Warmed ${frequent.length} resources`);
  }

  /**
   * Preload resources predicted to be accessed soon
   */
  private async warmPredictedAccesses() {
    console.log('[CacheWarmer] Warming predicted accesses...');

    // Find predictions with high confidence where next access is within 30 minutes
    const { data: predictions } = await supabaseAdmin
      .from('billy_cache_predictions')
      .select('*')
      .gte('confidence', 0.7)
      .lte('predicted_next_access', new Date(Date.now() + 30 * 60 * 1000))
      .gte('predicted_next_access', new Date());

    if (!predictions) return;

    // Preload predicted resources
    for (const pred of predictions) {
      try {
        await this.cacheManager.get(
          pred.resource_type,
          pred.resource_id,
          pred.organization_id
        );
      } catch (error) {
        console.error(`Failed to preload ${pred.resource_id}:`, error);
      }
    }

    console.log(`[CacheWarmer] Preloaded ${predictions.length} predicted resources`);
  }

  /**
   * Clean up old cache entries and access logs
   */
  private async cleanupStaleCache() {
    console.log('[CacheWarmer] Cleaning up stale cache...');

    // Delete expired cache entries
    const { count: expiredCount } = await supabaseAdmin
      .from('billy_cached_invoices')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Delete old access logs (>30 days)
    const { count: logCount } = await supabaseAdmin
      .from('billy_cache_access_log')
      .delete()
      .lt('accessed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    console.log(`[CacheWarmer] Cleaned up ${expiredCount} expired entries and ${logCount} old logs`);
  }

  /**
   * Stop all warming jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
  }
}
```

---

## 🗄️ **DATABASE SCHEMA ADDITIONS**

### **New Supabase Tables:**

```sql
-- Cache access logging for ML
CREATE TABLE billy_cache_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT TRUE,
  response_time_ms INTEGER
);

CREATE INDEX idx_cache_access_org ON billy_cache_access_log(organization_id);
CREATE INDEX idx_cache_access_resource ON billy_cache_access_log(resource_type, resource_id);
CREATE INDEX idx_cache_access_time ON billy_cache_access_log(accessed_at DESC);

-- ML predictions for cache warming
CREATE TABLE billy_cache_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(20), -- 'hourly', 'daily', 'weekly', 'irregular'
  predicted_next_access TIMESTAMP,
  confidence DECIMAL(3,2), -- 0.0 - 1.0
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, resource_type, resource_id)
);

CREATE INDEX idx_cache_predictions_next_access ON billy_cache_predictions(predicted_next_access);
CREATE INDEX idx_cache_predictions_confidence ON billy_cache_predictions(confidence DESC);

-- Update existing cache tables with dynamic TTL column
ALTER TABLE billy_cached_invoices ADD COLUMN ttl_minutes INTEGER DEFAULT 5;
ALTER TABLE billy_cached_invoices ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE billy_cached_invoices ADD COLUMN last_accessed_at TIMESTAMP DEFAULT NOW();

ALTER TABLE billy_cached_customers ADD COLUMN ttl_minutes INTEGER DEFAULT 5;
ALTER TABLE billy_cached_customers ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE billy_cached_customers ADD COLUMN last_accessed_at TIMESTAMP DEFAULT NOW();

ALTER TABLE billy_cached_products ADD COLUMN ttl_minutes INTEGER DEFAULT 5;
ALTER TABLE billy_cached_products ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE billy_cached_products ADD COLUMN last_accessed_at TIMESTAMP DEFAULT NOW();
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Cache Eviction Strategy:**

```typescript
// cache-eviction.ts

class CacheEvictionManager {
  /**
   * LRU with frequency boost: Evict least recently used, but protect high-frequency items
   */
  async evictLRU(resourceType: string, organizationId: string, maxSize: number) {
    // Get all cached items sorted by score (access time + frequency weight)
    const { data: cached } = await supabaseAdmin
      .from(`billy_cached_${resourceType}s`)
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_accessed_at', { ascending: true });

    if (!cached || cached.length <= maxSize) {
      return; // Under limit
    }

    // Calculate eviction score: older access + lower frequency = higher score (more likely to evict)
    const scored = cached.map(entry => ({
      ...entry,
      evictionScore: this.calculateEvictionScore(entry)
    }));

    // Sort by eviction score (highest = evict first)
    scored.sort((a, b) => b.evictionScore - a.evictionScore);

    // Evict excess entries
    const toEvict = scored.slice(maxSize);
    const idsToDelete = toEvict.map(e => e.id);

    await supabaseAdmin
      .from(`billy_cached_${resourceType}s`)
      .delete()
      .in('id', idsToDelete);

    console.log(`[Eviction] Removed ${toEvict.length} ${resourceType} entries`);
  }

  private calculateEvictionScore(entry: any): number {
    const now = Date.now();
    const lastAccess = new Date(entry.last_accessed_at).getTime();
    const ageMs = now - lastAccess;
    
    // Score components:
    const ageScore = ageMs / (1000 * 60 * 60); // Hours since last access
    const frequencyPenalty = -entry.access_count * 0.5; // Frequent items get negative score
    
    return ageScore + frequencyPenalty;
  }
}
```

---

## 🎯 **SUCCESS METRICS**

### **Performance Targets:**

- **Cache Hit Rate:** Improve from 68% to 85%+ with smart TTL
- **API Call Reduction:** 50% fewer Billy.dk API calls
- **Prediction Accuracy:** 80%+ accuracy for next-access predictions
- **Response Time:** Maintain <100ms avg with increased cache efficiency

### **Business Value:**

- **Cost Savings:** 50% reduction in Billy.dk API usage costs
- **Better UX:** Faster responses through proactive cache warming
- **Scalability:** Handle 10x traffic without proportional API increase
- **Resource Efficiency:** Intelligent eviction reduces database size

---

**Version:** 1.0  
**Created:** 2025-10-14  
**Author:** Jonas Abde (w/ GitHub Copilot)  
**Status:** 🧠 Design Complete - Ready for Implementation
