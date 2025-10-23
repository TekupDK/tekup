import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  sessionId?: string;
}

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_RESET = 'auth.password_reset',
  PASSWORD_CHANGE = 'auth.password_change',
  
  // User Management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_ROLE_CHANGE = 'user.role_change',
  
  // Customer Management
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',
  CUSTOMER_VIEW = 'customer.view',
  
  // Job Management
  JOB_CREATE = 'job.create',
  JOB_UPDATE = 'job.update',
  JOB_DELETE = 'job.delete',
  JOB_STATUS_CHANGE = 'job.status_change',
  JOB_ASSIGN = 'job.assign',
  
  // Financial
  PAYMENT_PROCESS = 'payment.process',
  INVOICE_CREATE = 'invoice.create',
  INVOICE_SEND = 'invoice.send',
  
  // Data Access
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  BULK_OPERATION = 'data.bulk_operation',
  
  // Security
  PERMISSION_DENIED = 'security.permission_denied',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  DATA_BREACH_ATTEMPT = 'security.data_breach_attempt',
  
  // System
  SYSTEM_CONFIG_CHANGE = 'system.config_change',
  BACKUP_CREATE = 'system.backup_create',
  BACKUP_RESTORE = 'system.backup_restore',
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Log an audit event
   */
  async log(entry: Partial<AuditLogEntry> & { action: string; resource: string }): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        success: entry.success ?? true,
      };

      // Log to database
      await this.logToDatabase(auditEntry);

      // Log to application logs for immediate visibility
      this.logToConsole(auditEntry);

    } catch (error) {
      this.logger.error('Failed to write audit log', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log successful authentication
   */
  async logAuthentication(
    userId: string,
    organizationId: string,
    action: AuditAction,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: 'authentication',
      ipAddress,
      userAgent,
      sessionId,
      success: true,
    });
  }

  /**
   * Log failed authentication attempt
   */
  async logAuthenticationFailure(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.LOGIN_FAILED,
      resource: 'authentication',
      details: { email, reason },
      ipAddress,
      userAgent,
      success: false,
      errorMessage: reason,
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    organizationId: string,
    resource: string,
    resourceId: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource,
      resourceId,
      details,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: AuditAction,
    details: Record<string, any>,
    userId?: string,
    organizationId?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: 'security',
      details,
      ipAddress,
      success: false,
    });
  }

  /**
   * Log permission denied event
   */
  async logPermissionDenied(
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: AuditAction.PERMISSION_DENIED,
      resource,
      details: { attemptedAction: action },
      ipAddress,
      success: false,
    });
  }

  /**
   * Log bulk operations
   */
  async logBulkOperation(
    userId: string,
    organizationId: string,
    operation: string,
    affectedCount: number,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: AuditAction.BULK_OPERATION,
      resource: 'bulk_operation',
      details: {
        operation,
        affectedCount,
        ...details,
      },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Failed to retrieve user audit logs', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('audit_logs')
        .select('*')
        .eq('resource', resource)
        .eq('resource_id', resourceId)
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Failed to retrieve resource audit logs', error);
      return [];
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabaseService.client
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('resource', 'security')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Failed to retrieve security events', error);
      return [];
    }
  }

  /**
   * Store audit log in database
   */
  private async logToDatabase(entry: AuditLogEntry): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        organization_id: entry.organizationId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        details: entry.details,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        success: entry.success,
        error_message: entry.errorMessage,
        timestamp: entry.timestamp,
        session_id: entry.sessionId,
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Log to console for immediate visibility
   */
  private logToConsole(entry: AuditLogEntry): void {
    const logLevel = entry.success ? 'log' : 'warn';
    const message = `AUDIT: ${entry.action} on ${entry.resource}${entry.resourceId ? `/${entry.resourceId}` : ''} by user ${entry.userId || 'anonymous'}`;
    
    this.logger[logLevel](message, {
      ...entry,
      // Don't log sensitive details to console
      details: entry.details ? Object.keys(entry.details) : undefined,
    });
  }
}