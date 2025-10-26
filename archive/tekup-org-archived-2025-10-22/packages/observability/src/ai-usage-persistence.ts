import { PrismaClient } from '@prisma/client';
import { recordAiUsage, recentUsage, type AggregatedUsage } from '@tekup/observability';

interface AiUsageRecord {
  id: string;
  tenantId: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: Date;
  metadata?: any;
}

export class AiUsagePersistence {
  private prisma: PrismaClient;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds
  private readonly RETENTION_DAYS = 90;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.startPeriodicFlush();
  }

  /**
   * Start periodic flush of in-memory AI usage data to database
   */
  private startPeriodicFlush() {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(async () => {
      try {
        await this.flushToBatch();
      } catch (error) {
        console.error('AI usage flush failed:', error);
      }
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Flush recent AI usage records to database in batch
   */
  async flushToBatch(): Promise<number> {
    const records = recentUsage(this.BATCH_SIZE);
    if (records.length === 0) return 0;

    const dbRecords = records.map(r => ({
      id: `${Date.now()}-${Math.random().toString(36)}`,
      tenantId: r.tenant || null,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costUsd: r.costUsd || 0,
      timestamp: new Date(r.ts),
      metadata: {}
    }));

    try {
      // Use upsert to handle potential duplicates
      const result = await this.prisma.$transaction(
        dbRecords.map(record => 
          this.prisma.aiUsageRecord.upsert({
            where: { id: record.id },
            update: {},
            create: record
          })
        )
      );
      
      console.log(`Flushed ${result.length} AI usage records to database`);
      return result.length;
    } catch (error) {
      console.error('Database flush error:', error);
      throw error;
    }
  }

  /**
   * Get aggregated usage stats for a tenant within time range
   */
  async getUsageStats(
    tenantId: string, 
    from: Date, 
    to: Date = new Date()
  ): Promise<AggregatedUsage[]> {
    const raw = await this.prisma.aiUsageRecord.groupBy({
      by: ['model', 'tenantId'],
      where: {
        tenantId,
        timestamp: { gte: from, lte: to }
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        costUsd: true
      },
      _count: true
    });

    return raw.map(r => ({
      model: r.model,
      tenant: r.tenantId || undefined,
      inputTokens: r._sum.inputTokens || 0,
      outputTokens: r._sum.outputTokens || 0,
      calls: r._count,
      costUsd: r._sum.costUsd || 0
    }));
  }

  /**
   * Clean up old records based on retention policy
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const result = await this.prisma.aiUsageRecord.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    console.log(`Cleaned up ${result.count} old AI usage records`);
    return result.count;
  }

  /**
   * Get hourly usage summary for cost monitoring
   */
  async getHourlyUsage(tenantId?: string): Promise<Array<{
    hour: string;
    totalTokens: number;
    totalCost: number;
    models: string[];
  }>> {
    const whereClause = tenantId ? { tenantId } : {};
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Raw SQL for hourly aggregation (adjust for your DB)
    const hourlyStats = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        SUM(input_tokens + output_tokens) as total_tokens,
        SUM(cost_usd) as total_cost,
        ARRAY_AGG(DISTINCT model) as models
      FROM ai_usage_record 
      WHERE timestamp >= ${oneDayAgo}
        ${tenantId ? Prisma.sql`AND tenant_id = ${tenantId}` : Prisma.empty}
      GROUP BY DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC
    `;

    return (hourlyStats as any[]).map((row: any) => ({
      hour: row.hour.toISOString(),
      totalTokens: parseInt(row.total_tokens) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      models: row.models || []
    }));
  }

  /**
   * Stop periodic flush (cleanup)
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}