import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGatewayImplementation } from './websocket.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

export interface NotificationQueueItem {
  id: string;
  tenantId: string;
  type: string;
  payload: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  processed: boolean;
  processedAt?: Date;
}

export interface NotificationSubscription {
  id: string;
  tenantId: string;
  userId?: string;
  eventType: string;
  channel: string;
  createdAt: Date;
  active: boolean;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private notificationQueue: NotificationQueueItem[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(
    private readonly gateway: WebSocketGatewayImplementation,
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService,
  ) {
    // Start queue processing
    this.startQueueProcessing();
  }

  /**
   * Queue a notification for delivery
   */
  async queueNotification(
    tenantId: string,
    type: string,
    payload: any,
    priority: 'high' | 'normal' | 'low' = 'normal',
  ): Promise<void> {
    try {
      const queueItem: NotificationQueueItem = {
        id: this.generateId(),
        tenantId,
        type,
        payload,
        createdAt: new Date(),
        attempts: 0,
        maxAttempts: this.MAX_RETRY_ATTEMPTS,
        processed: false,
      };

      // Add to queue based on priority
      if (priority === 'high') {
        this.notificationQueue.unshift(queueItem);
      } else {
        this.notificationQueue.push(queueItem);
      }

      // Trim queue if it exceeds maximum size
      if (this.notificationQueue.length > this.MAX_QUEUE_SIZE) {
        this.notificationQueue = this.notificationQueue.slice(
          -this.MAX_QUEUE_SIZE,
        );
        this.logger.warn(
          `Notification queue trimmed to ${this.MAX_QUEUE_SIZE} items`,
        );
      }

      // Record metrics
      this.metricsService.increment('websocket_notifications_queued_total', {
        tenant: tenantId,
        type,
        priority,
      });

      this.structuredLogger.info('Notification queued', {
        ...this.contextService.toLogContext(),
        metadata: {
          notificationId: queueItem.id,
          tenantId,
          type,
          payload,
        },
      });
    } catch (error) {
      this.logger.error('Failed to queue notification:', error);
    }
  }

  /**
   * Send lead update notification
   */
  async sendLeadUpdate(tenantId: string, leadId: string, updateData: any) {
    try {
      await this.gateway.sendLeadUpdate(tenantId, leadId, updateData);

      // Queue for persistence
      await this.queueNotification(
        tenantId,
        'lead.update',
        {
          leadId,
          ...updateData,
        },
        'normal',
      );

      this.structuredLogger.info('Lead update notification sent', {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          leadId,
          updateData,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send lead update notification:', error);
      throw error;
    }
  }

  /**
   * Send status change notification
   */
  async sendStatusChange(
    tenantId: string,
    leadId: string,
    fromStatus: string,
    toStatus: string,
  ) {
    try {
      await this.gateway.sendStatusChange(tenantId, leadId, fromStatus, toStatus);

      // Queue for persistence
      await this.queueNotification(
        tenantId,
        'lead.status.change',
        {
          leadId,
          fromStatus,
          toStatus,
        },
        'high',
      );

      this.structuredLogger.info('Status change notification sent', {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          leadId,
          fromStatus,
          toStatus,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send status change notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notification to all tenants or specific tenant
   */
  async sendBulkNotification(
    tenantId: string | null,
    type: string,
    payload: any,
  ) {
    try {
      if (tenantId) {
        // Send to specific tenant
        await this.gateway.sendTenantNotification(tenantId, {
          type,
          data: payload,
          timestamp: new Date(),
          tenantId,
        });
      } else {
        // Send system-wide notification (would need to iterate through all tenants)
        this.logger.warn('System-wide notifications not implemented yet');
      }

      this.structuredLogger.info('Bulk notification sent', {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId,
          type,
          payload,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send bulk notification:', error);
      throw error;
    }
  }

  /**
   * Get notification queue statistics
   */
  getQueueStats() {
    const stats = {
      queueSize: this.notificationQueue.length,
      pendingNotifications: this.notificationQueue.filter(
        (item) => !item.processed,
      ).length,
      processedNotifications: this.notificationQueue.filter(
        (item) => item.processed,
      ).length,
      failedNotifications: this.notificationQueue.filter(
        (item) => item.attempts >= item.maxAttempts && !item.processed,
      ).length,
    };

    return stats;
  }

  /**
   * Get connection statistics from gateway
   */
  getConnectionStats() {
    return this.gateway.getConnectionStats();
  }

  /**
   * Process notification queue
   */
  private async processQueue() {
    try {
      // Process pending notifications
      for (const item of this.notificationQueue) {
        if (item.processed || item.attempts >= item.maxAttempts) {
          continue;
        }

        try {
          // Send notification
          await this.gateway.sendTenantNotification(item.tenantId, {
            type: item.type,
            data: item.payload,
            timestamp: new Date(),
            tenantId: item.tenantId,
          });

          // Mark as processed
          item.processed = true;
          item.processedAt = new Date();

          // Record metrics
          this.metricsService.increment(
            'websocket_notifications_processed_total',
            {
              tenant: item.tenantId,
              type: item.type,
            },
          );
        } catch (error) {
          item.attempts++;
          this.logger.error(
            `Failed to process notification ${item.id} (attempt ${item.attempts}):`,
            error,
          );

          // Record metrics
          this.metricsService.increment('websocket_notifications_failed_total', {
            tenant: item.tenantId,
            type: item.type,
            attempt: item.attempts.toString(),
          });

          if (item.attempts >= item.maxAttempts) {
            this.structuredLogger.error('Notification delivery failed permanently', {
              ...this.contextService.toLogContext(),
              metadata: {
                notificationId: item.id,
                tenantId: item.tenantId,
                type: item.type,
                payload: item.payload,
                attempts: item.attempts,
              },
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing notification queue:', error);
    }
  }

  /**
   * Start periodic queue processing
   */
  private startQueueProcessing() {
    // Process queue every 5 seconds
    setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}