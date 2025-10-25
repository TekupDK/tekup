import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditLogEntry {
  id?: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityEvent {
  id?: string;
  organizationId: string;
  userId?: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an action to the audit log
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.renosAuditLog.create({
        data: {
          organizationId: entry.organizationId,
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValues: entry.oldValues || null,
          newValues: entry.newValues || null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log entry', error);
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Create security event
      await this.prisma.renosSecurityEvent.create({
        data: {
          organizationId: event.organizationId,
          userId: event.userId,
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata || null,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          resolved: event.resolved || false,
          resolvedAt: event.resolvedAt || null,
          resolvedBy: event.resolvedBy,
        },
      });

      // Also log to audit log for traceability
      await this.logAction({
        organizationId: event.organizationId,
        userId: event.userId,
        action: 'security_event',
        entityType: 'security',
        entityId: event.eventType,
        newValues: {
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata,
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      });

      // Log to application logs for immediate monitoring
      const logLevel = this.getLogLevel(event.severity);
      this.logger[logLevel](`Security Event: ${event.eventType} - ${event.description}`, {
        organizationId: event.organizationId,
        userId: event.userId,
        severity: event.severity,
        metadata: event.metadata,
      });
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  /**
   * Get audit logs for an organization with filters
   */
  async getAuditLogs(
    organizationId: string,
    filters?: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    try {
      const where: any = { organizationId };

      if (filters?.userId) where.userId = filters.userId;
      if (filters?.action) where.action = filters.action;
      if (filters?.entityType) where.entityType = filters.entityType;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const logs = await this.prisma.renosAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
      });

      return logs;
    } catch (error) {
      this.logger.error('Failed to get audit logs', error);
      return [];
    }
  }

  /**
   * Get security events for an organization with filters
   */
  async getSecurityEvents(
    organizationId: string,
    filters?: {
      userId?: string;
      eventType?: string;
      severity?: string;
      resolved?: boolean;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    try {
      const where: any = { organizationId };

      if (filters?.userId) where.userId = filters.userId;
      if (filters?.eventType) where.eventType = filters.eventType;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.resolved !== undefined) where.resolved = filters.resolved;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const events = await this.prisma.renosSecurityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to get security events', error);
      return [];
    }
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
  ): Promise<void> {
    try {
      await this.prisma.renosSecurityEvent.update({
        where: { id: eventId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
        },
      });

      this.logger.log(`Security event ${eventId} resolved by ${resolvedBy}`);
    } catch (error) {
      this.logger.error('Failed to resolve security event', error);
    }
  }

  /**
   * Get security statistics for an organization
   */
  async getSecurityStatistics(
    organizationId: string,
    days: number = 30,
  ): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalEvents, unresolvedEvents, eventsBySeverity] = await Promise.all([
        // Total events in period
        this.prisma.renosSecurityEvent.count({
          where: {
            organizationId,
            createdAt: { gte: startDate },
          },
        }),

        // Unresolved events
        this.prisma.renosSecurityEvent.count({
          where: {
            organizationId,
            resolved: false,
          },
        }),

        // Events by severity
        this.prisma.renosSecurityEvent.groupBy({
          by: ['severity'],
          where: {
            organizationId,
            createdAt: { gte: startDate },
          },
          _count: true,
        }),
      ]);

      const severityCounts = eventsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents,
        unresolvedEvents,
        eventsBySeverity: severityCounts,
        period: `${days} days`,
      };
    } catch (error) {
      this.logger.error('Failed to get security statistics', error);
      return null;
    }
  }

  /**
   * Helper to map severity to log level
   */
  private getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }
}
