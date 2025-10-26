import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';

export interface ArchivingConfig {
  enabled: boolean;
  cronSchedule: string;
  defaultRetentionDays: number;
  batchSize: number;
  archiveOlderThanDays: number;
  enableCompression: boolean;
  deleteArchivedAfterDays?: number;
}

export interface TenantArchivingConfig {
  tenantId: string;
  retentionDays: number;
  archiveOlderThanDays: number;
  enableCompression: boolean;
  deleteArchivedAfterDays?: number;
  excludedEntities?: string[];
}

export interface ArchiveJob {
  id: string;
  tenantId: string;
  entity: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  archivedRecords: number;
  failedRecords: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  archivePath?: string;
}

export interface ArchiveStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalArchivedRecords: number;
  totalFailedRecords: number;
  lastRun: Date;
}

@Injectable()
export class ArchivingService implements OnModuleInit {
  private readonly logger = new Logger(ArchivingService.name);
  private readonly config: ArchivingConfig;
  private isArchivingInProgress = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
  ) {
    this.config = {
      enabled: process.env.ARCHIVING_ENABLED === 'true',
      cronSchedule: process.env.ARCHIVING_CRON_SCHEDULE || '0 2 * * *', // Run daily at 2 AM
      defaultRetentionDays: parseInt(process.env.ARCHIVING_DEFAULT_RETENTION_DAYS || '365'), // 1 year
      batchSize: parseInt(process.env.ARCHIVING_BATCH_SIZE || '1000'),
      archiveOlderThanDays: parseInt(process.env.ARCHIVING_OLDER_THAN_DAYS || '180'), // 6 months
      enableCompression: process.env.ARCHIVING_ENABLE_COMPRESSION === 'true',
      deleteArchivedAfterDays: process.env.ARCHIVING_DELETE_AFTER_DAYS 
        ? parseInt(process.env.ARCHIVING_DELETE_AFTER_DAYS || '0') 
        : undefined,
    };
  }

  async onModuleInit() {
    if (this.config.enabled) {
      this.logger.log('Archiving service initialized with config:', this.config);
    } else {
      this.logger.log('Archiving service is disabled');
    }
  }

  /**
   * Get tenant-specific archiving configuration
   */
  async getTenantConfig(tenantId: string): Promise<TenantArchivingConfig> {
    try {
      const setting = await this.prisma.tenantSetting.findUnique({
        where: {
          tenantId_key: {
            tenantId,
            key: 'archiving_config',
          },
        },
      });

      if (setting) {
        return { ...JSON.parse(setting.value as string), tenantId };
      }

      // Return default config with tenant ID
      return {
        tenantId,
        retentionDays: this.config.defaultRetentionDays,
        archiveOlderThanDays: this.config.archiveOlderThanDays,
        enableCompression: this.config.enableCompression,
        deleteArchivedAfterDays: this.config.deleteArchivedAfterDays,
      };
    } catch (error) {
      this.logger.warn(`Failed to get tenant config for ${tenantId}, using defaults:`, error);
      return {
        tenantId,
        retentionDays: this.config.defaultRetentionDays,
        archiveOlderThanDays: this.config.archiveOlderThanDays,
        enableCompression: this.config.enableCompression,
        deleteArchivedAfterDays: this.config.deleteArchivedAfterDays,
      };
    }
  }

  /**
   * Update tenant archiving configuration
   */
  async updateTenantConfig(
    tenantId: string,
    config: Partial<TenantArchivingConfig>
  ): Promise<TenantArchivingConfig> {
    const existingConfig = await this.getTenantConfig(tenantId);
    const updatedConfig = { ...existingConfig, ...config };

    await this.prisma.tenantSetting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: 'archiving_config',
        },
      },
      create: {
        tenantId,
        key: 'archiving_config',
        value: JSON.stringify(updatedConfig),
      },
      update: {
        value: JSON.stringify(updatedConfig),
      },
    });

    this.structuredLogger.info(
      'Archiving config updated',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          updatedFields: Object.keys(config),
        },
      }
    );

    return updatedConfig;
  }

  /**
   * Archive old leads based on retention policy
   */
  async archiveOldLeads(tenantId: string): Promise<{ archived: number; failed: number }> {
    if (!this.config.enabled) {
      return { archived: 0, failed: 0 };
    }

    const tenantConfig = await this.getTenantConfig(tenantId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - tenantConfig.archiveOlderThanDays);

    this.structuredLogger.info(
      'Starting lead archiving process',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          cutoffDate: cutoffDate.toISOString(),
          batchSize: this.config.batchSize,
        },
      }
    );

    let totalArchived = 0;
    let totalFailed = 0;

    try {
      // Process leads in batches
      let hasMore = true;
      let lastId: string | null = null;

      while (hasMore && !this.isArchivingInProgress) {
        // Find leads to archive
        const whereClause: {
          tenantId: string;
          createdAt: { lt: Date };
          status: { in: string[] };
          id?: { gt: string };
        } = {
          tenantId,
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: ['LOST', 'CONVERTED', 'ARCHIVED'], // Only archive leads that are already in final states
          },
        };

        if (lastId) {
          whereClause.id = { gt: lastId };
        }

        const leads = await this.prisma.lead.findMany({
          where: whereClause,
          orderBy: { id: 'asc' },
          take: this.config.batchSize,
        });

        if (leads.length === 0) {
          hasMore = false;
          break;
        }

        // Process each lead
        for (const lead of leads) {
          try {
            // Move lead to archive table (if it exists) or update status
            await this.prisma.$transaction(async (tx: any) => {
              // Check if archive table exists, if not, just update status
              // In a real implementation, you might have a separate archive table
              await tx.lead.update({
                where: { id: lead.id },
                data: { 
                  status: 'ARCHIVED',
                  archivedAt: new Date(),
                },
              });

              // Also archive related events
              await tx.leadEvent.updateMany({
                where: { leadId: lead.id },
                data: { 
                  archivedAt: new Date(),
                },
              });
            });

            totalArchived++;
          } catch (error) {
            this.logger.error(`Failed to archive lead ${lead.id}:`, error);
            totalFailed++;
          }
        }

        // Update lastId for next batch
        lastId = leads[leads.length - 1].id;

        // Record metrics
        this.metrics.increment('leads_archived_total', { 
          tenant: tenantId, 
          status: 'success' 
        }, totalArchived);
        
        this.metrics.increment('leads_archived_total', { 
          tenant: tenantId, 
          status: 'failed' 
        }, totalFailed);
      }

      this.structuredLogger.info(
        'Lead archiving process completed',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId,
            totalArchived,
            totalFailed,
            cutoffDate: cutoffDate.toISOString(),
          },
        }
      );

      return { archived: totalArchived, failed: totalFailed };
    } catch (error) {
      this.logger.error(`Failed to archive leads for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Delete archived data based on retention policy
   */
  async deleteArchivedData(tenantId: string): Promise<{ deleted: number; failed: number }> {
    if (!this.config.enabled || !this.config.deleteArchivedAfterDays) {
      return { deleted: 0, failed: 0 };
    }

    const tenantConfig = await this.getTenantConfig(tenantId);
    if (!tenantConfig.deleteArchivedAfterDays) {
      return { deleted: 0, failed: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - tenantConfig.deleteArchivedAfterDays);

    this.structuredLogger.info(
      'Starting archived data deletion process',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          cutoffDate: cutoffDate.toISOString(),
          batchSize: this.config.batchSize,
        },
      }
    );

    let totalDeleted = 0;
    let totalFailed = 0;

    try {
      // Process archived leads in batches
      let hasMore = true;
      let lastId: string | null = null;

      while (hasMore) {
        // Find archived leads to delete
        const whereClause: {
          tenantId: string;
          status: 'ARCHIVED';
          archivedAt: { lt: Date };
          id?: { gt: string };
        } = {
          tenantId,
          status: 'ARCHIVED',
          archivedAt: {
            lt: cutoffDate,
          },
        };

        if (lastId) {
          whereClause.id = { gt: lastId };
        }

        const leads = await this.prisma.lead.findMany({
          where: whereClause,
          orderBy: { id: 'asc' },
          take: this.config.batchSize,
        });

        if (leads.length === 0) {
          hasMore = false;
          break;
        }

        // Process each lead
        for (const lead of leads) {
          try {
            // Delete lead and related events
            await this.prisma.$transaction(async (tx: any) => {
              // Delete related events first
              await tx.leadEvent.deleteMany({
                where: { leadId: lead.id },
              });

              // Delete the lead
              await tx.lead.delete({
                where: { id: lead.id },
              });
            });

            totalDeleted++;
          } catch (error) {
            this.logger.error(`Failed to delete archived lead ${lead.id}:`, error);
            totalFailed++;
          }
        }

        // Update lastId for next batch
        lastId = leads[leads.length - 1].id;

        // Record metrics
        this.metrics.increment('archived_leads_deleted_total', { 
          tenant: tenantId, 
          status: 'success' 
        }, totalDeleted);
        
        this.metrics.increment('archived_leads_deleted_total', { 
          tenant: tenantId, 
          status: 'failed' 
        }, totalFailed);
      }

      this.structuredLogger.info(
        'Archived data deletion process completed',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId,
            totalDeleted,
            totalFailed,
            cutoffDate: cutoffDate.toISOString(),
          },
        }
      );

      return { deleted: totalDeleted, failed: totalFailed };
    } catch (error) {
      this.logger.error(`Failed to delete archived data for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Scheduled archiving job
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledArchiving(): Promise<void> {
    if (!this.config.enabled || this.isArchivingInProgress) {
      return;
    }

    this.isArchivingInProgress = true;
    this.logger.log('Starting scheduled archiving process');

    try {
      // Get all tenants with archiving enabled
      const tenants = await this.prisma.tenant.findMany({
        where: {
          settings: {
            some: {
              key: 'archiving_config',
            },
          },
        },
      });

      this.logger.log(`Found ${tenants.length} tenants with archiving configuration`);

      // Process each tenant
      for (const tenant of tenants) {
        try {
          this.logger.log(`Archiving data for tenant ${tenant.id}`);
          
          // Archive old leads
          const archiveResult = await this.archiveOldLeads(tenant.id);
          
          // Delete archived data if configured
          const deleteResult = await this.deleteArchivedData(tenant.id);
          
          this.logger.log(
            `Completed archiving for tenant ${tenant.id}: ` +
            `${archiveResult.archived} archived, ${archiveResult.failed} failed, ` +
            `${deleteResult.deleted} deleted, ${deleteResult.failed} delete failures`
          );
        } catch (error) {
          this.logger.error(`Failed to archive data for tenant ${tenant.id}:`, error);
        }
      }

      this.logger.log('Scheduled archiving process completed');
    } catch (error) {
      this.logger.error('Scheduled archiving process failed:', error);
    } finally {
      this.isArchivingInProgress = false;
    }
  }

  /**
   * Get archiving statistics
   */
  async getArchivingStats(tenantId?: string): Promise<ArchiveStats> {
    try {
      // In a real implementation, you might have a separate table to track archive jobs
      // For now, we'll simulate statistics based on recent activity
      
      const whereClause: any = {};
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const archivedLeads = await this.prisma.lead.count({
        where: {
          ...whereClause,
          status: 'ARCHIVED',
        },
      });

      return {
        totalJobs: 1, // Simulated
        completedJobs: 1, // Simulated
        failedJobs: 0, // Simulated
        totalArchivedRecords: archivedLeads,
        totalFailedRecords: 0, // Simulated
        lastRun: new Date(), // Simulated
      };
    } catch (error) {
      this.logger.error('Failed to get archiving stats:', error);
      return {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        totalArchivedRecords: 0,
        totalFailedRecords: 0,
        lastRun: new Date(),
      };
    }
  }

  /**
   * Manual archiving trigger
   */
  async triggerArchiving(tenantId: string): Promise<{ archived: number; deleted: number }> {
    if (!this.config.enabled) {
      throw new Error('Archiving is not enabled');
    }

    this.logger.log(`Manual archiving triggered for tenant ${tenantId}`);

    const archiveResult = await this.archiveOldLeads(tenantId);
    const deleteResult = await this.deleteArchivedData(tenantId);

    return {
      archived: archiveResult.archived,
      deleted: deleteResult.deleted,
    };
  }

  /**
   * Get archiving configuration
   */
  getConfig(): ArchivingConfig {
    return { ...this.config };
  }

  /**
   * Health check for archiving service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }> {
    try {
      if (!this.config.enabled) {
        return { status: 'healthy', error: 'Archiving disabled' };
      }

      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: (error as any).message };
    }
  }
}