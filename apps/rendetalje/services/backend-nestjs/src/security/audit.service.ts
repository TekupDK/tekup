import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

export interface AuditLogEntry {
  id?: string;
  organization_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface SecurityEvent {
  id?: string;
  organization_id: string;
  user_id?: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("audit_logs")
        .insert({
          ...entry,
          created_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.error("Failed to create audit log entry", error);
      }
    } catch (error) {
      this.logger.error("Error creating audit log entry", error);
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to audit_logs table with security event type
      await this.logAction({
        organization_id: event.organization_id,
        user_id: event.user_id,
        action: "security_event",
        entity_type: "security",
        entity_id: event.event_type,
        new_values: {
          event_type: event.event_type,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata,
        },
        ip_address: event.ip_address,
        user_agent: event.user_agent,
      });

      // Also log to application logs for immediate monitoring
      const logLevel = this.getLogLevel(event.severity);
      this.logger[logLevel](
        `Security Event: ${event.event_type} - ${event.description}`,
        {
          organizationId: event.organization_id,
          userId: event.user_id,
          severity: event.severity,
          metadata: event.metadata,
        }
      );
    } catch (error) {
      this.logger.error("Error logging security event", error);
    }
  }

  async getAuditLogs(
    organizationId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabaseService.client
        .from("audit_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.action) {
        query = query.eq("action", filters.action);
      }

      if (filters.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error("Error getting audit logs", error);
      throw error;
    }
  }

  async getSecurityEvents(
    organizationId: string,
    filters: {
      severity?: string;
      eventType?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabaseService.client
        .from("audit_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("action", "security_event")
        .order("created_at", { ascending: false });

      if (filters.severity) {
        query = query.eq("new_values->severity", filters.severity);
      }

      if (filters.eventType) {
        query = query.eq("entity_id", filters.eventType);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get security events: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error("Error getting security events", error);
      throw error;
    }
  }

  async generateAuditReport(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{
    summary: {
      totalActions: number;
      uniqueUsers: number;
      topActions: Array<{ action: string; count: number }>;
      securityEvents: number;
    };
    details: {
      userActivity: Array<{ userId: string; actionCount: number }>;
      entityChanges: Array<{ entityType: string; changeCount: number }>;
      securityEventsByType: Array<{
        eventType: string;
        count: number;
        severity: string;
      }>;
    };
  }> {
    try {
      const auditLogs = await this.getAuditLogs(organizationId, {
        dateFrom,
        dateTo,
        limit: 10000, // Large limit for comprehensive report
      });

      const securityEvents = auditLogs.filter(
        (log) => log.action === "security_event"
      );

      // Calculate summary statistics
      const totalActions = auditLogs.length;
      const uniqueUsers = new Set(
        auditLogs.map((log) => log.user_id).filter(Boolean)
      ).size;

      // Top actions
      const actionCounts = auditLogs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // User activity
      const userActivity = auditLogs.reduce(
        (acc, log) => {
          if (log.user_id) {
            acc[log.user_id] = (acc[log.user_id] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const userActivityArray = Object.entries(userActivity)
        .sort(([, a], [, b]) => b - a)
        .map(([userId, actionCount]) => ({ userId, actionCount }));

      // Entity changes
      const entityChanges = auditLogs.reduce(
        (acc, log) => {
          acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const entityChangesArray = Object.entries(entityChanges)
        .sort(([, a], [, b]) => b - a)
        .map(([entityType, changeCount]) => ({ entityType, changeCount }));

      // Security events by type
      const securityEventsByType = securityEvents.reduce(
        (acc, event) => {
          const eventType = event.entity_id || "unknown";
          const severity = event.new_values?.severity || "unknown";
          const key = `${eventType}:${severity}`;

          if (!acc[key]) {
            acc[key] = { eventType, count: 0, severity };
          }
          acc[key].count++;
          return acc;
        },
        {} as Record<
          string,
          { eventType: string; count: number; severity: string }
        >
      );

      const securityEventsByTypeArray = Object.values(
        securityEventsByType
      ).sort((a, b) => b.count - a.count);

      return {
        summary: {
          totalActions,
          uniqueUsers,
          topActions,
          securityEvents: securityEvents.length,
        },
        details: {
          userActivity: userActivityArray,
          entityChanges: entityChangesArray,
          securityEventsByType: securityEventsByTypeArray,
        },
      };
    } catch (error) {
      this.logger.error("Error generating audit report", error);
      throw error;
    }
  }

  // Specific audit logging methods
  async logUserLogin(
    organizationId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      organization_id: organizationId,
      user_id: userId,
      action: "user_login",
      entity_type: "user",
      entity_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logUserLogout(
    organizationId: string,
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction({
      organization_id: organizationId,
      user_id: userId,
      action: "user_logout",
      entity_type: "user",
      entity_id: userId,
      ip_address: ipAddress,
    });
  }

  async logFailedLogin(
    organizationId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      organization_id: organizationId,
      event_type: "failed_login",
      severity: "medium",
      description: `Failed login attempt for email: ${email}`,
      metadata: { email },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async logDataAccess(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: "read" | "create" | "update" | "delete",
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      organization_id: organizationId,
      user_id: userId,
      action: `${entityType}_${action}`,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
    });
  }

  async logPermissionChange(
    organizationId: string,
    adminUserId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.logAction({
      organization_id: organizationId,
      user_id: adminUserId,
      action: "permission_change",
      entity_type: "user",
      entity_id: targetUserId,
      old_values: { role: oldRole },
      new_values: { role: newRole },
    });

    await this.logSecurityEvent({
      organization_id: organizationId,
      user_id: adminUserId,
      event_type: "permission_change",
      severity: "high",
      description: `User role changed from ${oldRole} to ${newRole}`,
      metadata: { targetUserId, oldRole, newRole },
    });
  }

  async logSuspiciousActivity(
    organizationId: string,
    userId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      organization_id: organizationId,
      user_id: userId,
      event_type: "suspicious_activity",
      severity: "high",
      description: `${activityType}: ${description}`,
      metadata: { activityType, ...metadata },
      ip_address: ipAddress,
    });
  }

  async logDataExport(
    organizationId: string,
    userId: string,
    dataType: string,
    recordCount: number
  ): Promise<void> {
    await this.logAction({
      organization_id: organizationId,
      user_id: userId,
      action: "data_export",
      entity_type: "data",
      entity_id: dataType,
      new_values: { recordCount, exportedAt: new Date().toISOString() },
    });

    await this.logSecurityEvent({
      organization_id: organizationId,
      user_id: userId,
      event_type: "data_export",
      severity: "medium",
      description: `Data export: ${recordCount} ${dataType} records`,
      metadata: { dataType, recordCount },
    });
  }

  private getLogLevel(severity: string): "log" | "warn" | "error" {
    switch (severity) {
      case "critical":
      case "high":
        return "error";
      case "medium":
        return "warn";
      default:
        return "log";
    }
  }
}
