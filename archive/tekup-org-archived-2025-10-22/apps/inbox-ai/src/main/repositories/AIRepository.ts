/**
 * AI repository for managing AI requests, cache, and usage
 */

import { AIRequest, AICache, AIUsage, AIBatch, AIRepository, AIProvider } from '@shared/types'
import { BaseRepository } from './BaseRepository.js'
import { AppDatabase } from '../database/Database.js'
import { LogService } from '../services/LogService.js'

export class AIRepositoryImpl implements AIRepository {
  public requests: AIRequestRepository
  public cache: AICacheRepository
  public usage: AIUsageRepository
  public batches: AIBatchRepository
  private database: AppDatabase
  private log: LogService

  constructor(database: AppDatabase) {
    this.database = database
    this.log = new LogService()
    this.requests = new AIRequestRepository(database)
    this.cache = new AICacheRepository(database)
    this.usage = new AIUsageRepository(database)
    this.batches = new AIBatchRepository(database)
  }

  /**
   * Get cached result for email and request type
   */
  async getCachedResult(emailId: string, requestType: string, requestHash: string): Promise<any | null> {
    return this.cache.getCachedResult(emailId, requestType, requestHash)
  }

  /**
   * Cache AI result
   */
  async cacheResult(emailId: string, requestType: string, requestHash: string, result: any, expiresIn: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn)
    return this.cache.cacheResult(emailId, requestType, requestHash, result, 'unknown', 'unknown', 0.5, expiresAt)
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    return this.cache.cleanupExpired()
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    return this.cache.cleanupExpired()
  }

  /**
   * Increment cache hit counter
   */
  async incrementCacheHit(emailId: string, requestType: string, requestHash: string): Promise<void> {
    return this.cache.incrementHit(emailId, requestType, requestHash)
  }

  /**
   * Create AI request
   */
  async createRequest(request: AIRequest): Promise<void> {
    await this.requests.create(request as any)
  }

  /**
   * Update AI request
   */
  async updateRequest(requestId: string, updates: Partial<AIRequest>): Promise<void> {
    return this.requests.updateResult(requestId, updates.status || '', updates.result, updates.error)
  }

  /**
   * Record usage statistics
   */
  async recordUsage(usage: AIUsage): Promise<void> {
    await this.usage.create(usage as any)
  }

  /**
   * Get recent usage count
   */
  async getRecentUsage(provider: string, windowMs: number): Promise<number> {
    return this.usage.getRecentUsageCount(provider, windowMs)
  }

  /**
   * Get enabled AI providers
   */
  async getEnabledProviders(): Promise<AIProvider[]> {
    try {
      // Load from configuration repository
      const { ConfigRepositoryImpl } = await import('./ConfigRepository.js')
      const configRepo = new ConfigRepositoryImpl(this.database)
      const allProviders = await configRepo.getAIProviders()
      
      // Return only enabled providers
      return allProviders.filter(provider => provider.enabled)
    } catch (error) {
      // If there are no providers in database, return empty array
      // This allows the system to start without AI providers
      this.log.debug('No AI providers found or error loading providers', { error: (error as Error).message })
      return []
    }
  }

  /**
   * Update provider configuration
   */
  async updateProvider(providerId: string, updates: Partial<AIProvider>): Promise<void> {
    try {
      const { ConfigRepositoryImpl } = await import('./ConfigRepository.js')
      const configRepo = new ConfigRepositoryImpl(this.database)
      
      // Get the existing provider
      const providers = await configRepo.getAIProviders()
      const existingProvider = providers.find(p => p.id === providerId)
      
      if (!existingProvider) {
        throw new Error(`Provider not found: ${providerId}`)
      }
      
      // Update the provider
      const updatedProvider = { ...existingProvider, ...updates, updatedAt: new Date() }
      await configRepo.saveAIProvider(updatedProvider)
      
      this.log.info('AI provider updated', { providerId, updates })
    } catch (error) {
      this.log.error('Failed to update AI provider', error as Error, { providerId, updates })
      throw error
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    return this.usage.getUsageStats(dateRange ? dateRange as any : undefined)
  }
}

/**
 * AI Request Repository
 */
class AIRequestRepository extends BaseRepository<AIRequest> {
  constructor(database: AppDatabase) {
    super(database, 'ai_requests')
  }

  /**
   * Find requests by status
   */
  async findByStatus(status: string): Promise<AIRequest[]> {
    return this.findAll({
      where: { status },
      orderBy: 'created_at',
      orderDirection: 'DESC'
    })
  }

  /**
   * Find requests by email ID
   */
  async findByEmail(emailId: string): Promise<AIRequest[]> {
    return this.findAll({
      where: { email_id: emailId },
      orderBy: 'created_at',
      orderDirection: 'DESC'
    })
  }

  /**
   * Update request status and result
   */
  async updateResult(requestId: string, status: string, result?: any, error?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        completed_at: new Date().toISOString()
      }

      if (result) {
        updates.result = JSON.stringify(result)
      }

      if (error) {
        updates.error = error
      }

      const sql = `
        UPDATE ${this.tableName} 
        SET status = ?, result = ?, error = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [status, updates.result, updates.error, updates.completed_at, requestId])
    } catch (err) {
      this.log.error('Failed to update AI request result', err as Error, { requestId, status })
      throw err
    }
  }

  protected mapFromDatabase(row: any): AIRequest {
    return {
      id: row.id,
      type: row.type,
      email: row.email_id,
      context: row.context ? JSON.parse(row.context) : undefined,
      prompt: row.prompt,
      options: row.options ? JSON.parse(row.options) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error,
      provider: row.provider,
      model: row.model,
      tokensUsed: row.tokens_used,
      cost: row.cost,
    }
  }

  protected mapToDatabase(request: AIRequest): any {
    return {
      id: request.id,
      type: request.type,
      email_id: request.email,
      context: request.context ? JSON.stringify(request.context) : null,
      prompt: request.prompt,
      options: request.options ? JSON.stringify(request.options) : null,
      status: request.status,
      result: request.result ? JSON.stringify(request.result) : null,
      error: request.error,
      provider: request.provider,
      model: request.model,
      tokens_used: request.tokensUsed,
      cost: request.cost,
      created_at: request.createdAt.toISOString(),
      started_at: request.startedAt?.toISOString(),
      completed_at: request.completedAt?.toISOString(),
    }
  }
}

/**
 * AI Cache Repository
 */
class AICacheRepository extends BaseRepository<AICache> {
  constructor(database: AppDatabase) {
    super(database, 'ai_cache')
  }

  /**
   * Get cached result
   */
  async getCachedResult(emailId: string, requestType: string, requestHash: string): Promise<any | null> {
    try {
      const sql = `
        SELECT result, confidence 
        FROM ${this.tableName} 
        WHERE email_id = ? AND request_type = ? AND request_hash = ? AND expires_at > CURRENT_TIMESTAMP
      `
      const result = this.executeQuery(sql, [emailId, requestType, requestHash])[0]
      
      if (!result) {
        return null
      }

      // Update hit count and last used
      this.executeStatement(`
        UPDATE ${this.tableName} 
        SET hit_count = hit_count + 1, last_used = CURRENT_TIMESTAMP 
        WHERE email_id = ? AND request_type = ? AND request_hash = ?
      `, [emailId, requestType, requestHash])

      return JSON.parse(result.result)
    } catch (error) {
      this.log.error('Failed to get cached result', error as Error, { emailId, requestType, requestHash })
      throw error
    }
  }

  /**
   * Cache AI result
   */
  async cacheResult(emailId: string, requestType: string, requestHash: string, result: any, provider: string, model: string, confidence: number, expiresAt: Date): Promise<void> {
    try {
      const cacheEntry: Partial<AICache> = {
        emailId,
        requestType: requestType as any,
        requestHash,
        result: JSON.stringify(result),
        confidence,
        provider,
        model,
        hitCount: 0,
        expiresAt,
        lastUsed: new Date(),
        createdAt: new Date()
      }

      await this.create(cacheEntry as any)
    } catch (error) {
      this.log.error('Failed to cache result', error as Error, { emailId, requestType, requestHash })
      throw error
    }
  }

  /**
   * Increment cache hit counter
   */
  async incrementHit(emailId: string, requestType: string, requestHash: string): Promise<void> {
    try {
      this.executeStatement(`
        UPDATE ${this.tableName} 
        SET hit_count = hit_count + 1, last_used = CURRENT_TIMESTAMP 
        WHERE email_id = ? AND request_type = ? AND request_hash = ?
      `, [emailId, requestType, requestHash])
    } catch (error) {
      this.log.error('Failed to increment cache hit', error as Error, { emailId, requestType, requestHash })
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE expires_at < CURRENT_TIMESTAMP`
      const result = this.executeStatement(sql)
      return result.changes
    } catch (error) {
      this.log.error('Failed to cleanup expired cache', error as Error)
      throw error
    }
  }

  protected mapFromDatabase(row: any): AICache {
    return {
      id: row.id,
      emailId: row.email_id,
      requestType: row.request_type,
      requestHash: row.request_hash,
      result: JSON.parse(row.result),
      confidence: row.confidence,
      provider: row.provider,
      model: row.model,
      hitCount: row.hit_count,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      lastUsed: new Date(row.last_used),
    }
  }

  protected mapToDatabase(cache: AICache): any {
    return {
      id: cache.id,
      email_id: cache.emailId,
      request_type: cache.requestType,
      request_hash: cache.requestHash,
      result: typeof cache.result === 'string' ? cache.result : JSON.stringify(cache.result),
      confidence: cache.confidence,
      provider: cache.provider,
      model: cache.model,
      hit_count: cache.hitCount,
      created_at: cache.createdAt.toISOString(),
      expires_at: cache.expiresAt.toISOString(),
      last_used: cache.lastUsed.toISOString(),
    }
  }
}

/**
 * AI Usage Repository
 */
class AIUsageRepository extends BaseRepository<AIUsage> {
  constructor(database: AppDatabase) {
    super(database, 'ai_usage')
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(filters?: { provider?: string; dateRange?: { start: Date; end: Date } }): Promise<any> {
    try {
      let sql = `
        SELECT 
          provider,
          model,
          request_type,
          COUNT(*) as total_requests,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
          SUM(tokens_used) as total_tokens,
          SUM(cost) as total_cost,
          AVG(processing_time) as avg_processing_time
        FROM ${this.tableName}
      `
      const params: any[] = []
      const conditions: string[] = []

      if (filters?.provider) {
        conditions.push('provider = ?')
        params.push(filters.provider)
      }

      if (filters?.dateRange) {
        conditions.push('date BETWEEN ? AND ?')
        params.push(filters.dateRange.start.toISOString().split('T')[0])
        params.push(filters.dateRange.end.toISOString().split('T')[0])
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ')
      }

      sql += ` GROUP BY provider, model, request_type ORDER BY total_requests DESC`

      const results = this.executeQuery(sql, params)
      
      return {
        byProvider: this.groupBy(results, 'provider'),
        byModel: this.groupBy(results, 'model'),
        byRequestType: this.groupBy(results, 'request_type'),
        totals: this.calculateTotals(results),
      }
    } catch (error) {
      this.log.error('Failed to get usage stats', error as Error, { filters })
      throw error
    }
  }

  /**
   * Get recent usage count for rate limiting
   */
  async getRecentUsageCount(provider: string, windowMs: number): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - windowMs)
      const sql = `
        SELECT COUNT(*) as count 
        FROM ${this.tableName} 
        WHERE provider = ? AND created_at >= ?
      `
      const result = this.executeQuery(sql, [provider, windowStart.toISOString()])[0]
      return result?.count || 0
    } catch (error) {
      this.log.error('Failed to get recent usage count', error as Error, { provider, windowMs })
      return 0
    }
  }

  private groupBy(results: any[], key: string): any {
    return results.reduce((groups, item) => {
      const group = item[key]
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {})
  }

  private calculateTotals(results: any[]): any {
    return results.reduce((totals, item) => {
      totals.totalRequests += item.total_requests
      totals.successfulRequests += item.successful_requests
      totals.totalTokens += item.total_tokens
      totals.totalCost += item.total_cost
      return totals
    }, {
      totalRequests: 0,
      successfulRequests: 0,
      totalTokens: 0,
      totalCost: 0,
    })
  }

  protected mapFromDatabase(row: any): AIUsage {
    return {
      id: row.id,
      provider: row.provider,
      model: row.model,
      requestType: row.request_type,
      tokensUsed: row.tokens_used,
      cost: row.cost,
      date: new Date(row.date),
      success: Boolean(row.success),
      processingTime: row.processing_time,
    }
  }

  protected mapToDatabase(usage: AIUsage): any {
    return {
      id: usage.id,
      provider: usage.provider,
      model: usage.model,
      request_type: usage.requestType,
      tokens_used: usage.tokensUsed,
      cost: usage.cost,
      date: usage.date.toISOString().split('T')[0],
      success: usage.success ? 1 : 0,
      processing_time: usage.processingTime,
      created_at: new Date().toISOString(),
    }
  }
}

/**
 * AI Batch Repository
 */
class AIBatchRepository extends BaseRepository<AIBatch> {
  constructor(database: AppDatabase) {
    super(database, 'ai_batches')
  }

  /**
   * Find batches by status
   */
  async findByStatus(status: string): Promise<AIBatch[]> {
    return this.findAll({
      where: { status },
      orderBy: 'created_at',
      orderDirection: 'DESC'
    })
  }

  /**
   * Update batch progress
   */
  async updateProgress(batchId: string, progress: number): Promise<void> {
    try {
      const sql = `
        UPDATE ${this.tableName} 
        SET progress = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.executeStatement(sql, [progress, batchId])
    } catch (error) {
      this.log.error('Failed to update batch progress', error as Error, { batchId, progress })
      throw error
    }
  }

  protected mapFromDatabase(row: any): AIBatch {
    return {
      id: row.id,
      emails: JSON.parse(row.emails),
      requestType: row.request_type,
      options: row.options ? JSON.parse(row.options) : undefined,
      status: row.status,
      progress: row.progress,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      results: JSON.parse(row.results),
      errors: JSON.parse(row.errors),
      provider: row.provider,
      model: row.model,
      totalTokens: row.total_tokens,
      totalCost: row.total_cost,
    }
  }

  protected mapToDatabase(batch: AIBatch): any {
    return {
      id: batch.id,
      emails: JSON.stringify(batch.emails),
      request_type: batch.requestType,
      options: batch.options ? JSON.stringify(batch.options) : null,
      status: batch.status,
      progress: batch.progress,
      results: JSON.stringify(batch.results),
      errors: JSON.stringify(batch.errors),
      provider: batch.provider,
      model: batch.model,
      total_tokens: batch.totalTokens,
      total_cost: batch.totalCost,
      created_at: batch.createdAt.toISOString(),
      started_at: batch.startedAt?.toISOString(),
      completed_at: batch.completedAt?.toISOString(),
    }
  }
}