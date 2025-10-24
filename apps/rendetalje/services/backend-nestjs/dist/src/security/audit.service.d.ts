import { SupabaseService } from '../supabase/supabase.service';
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
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}
export declare class AuditService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    logAction(entry: AuditLogEntry): Promise<void>;
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    getAuditLogs(organizationId: string, filters?: {
        userId?: string;
        action?: string;
        entityType?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
    }): Promise<AuditLogEntry[]>;
    getSecurityEvents(organizationId: string, filters?: {
        severity?: string;
        eventType?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
    }): Promise<AuditLogEntry[]>;
    generateAuditReport(organizationId: string, dateFrom: string, dateTo: string): Promise<{
        summary: {
            totalActions: number;
            uniqueUsers: number;
            topActions: Array<{
                action: string;
                count: number;
            }>;
            securityEvents: number;
        };
        details: {
            userActivity: Array<{
                userId: string;
                actionCount: number;
            }>;
            entityChanges: Array<{
                entityType: string;
                changeCount: number;
            }>;
            securityEventsByType: Array<{
                eventType: string;
                count: number;
                severity: string;
            }>;
        };
    }>;
    logUserLogin(organizationId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logUserLogout(organizationId: string, userId: string, ipAddress?: string): Promise<void>;
    logFailedLogin(organizationId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logDataAccess(organizationId: string, userId: string, entityType: string, entityId: string, action: 'read' | 'create' | 'update' | 'delete', oldValues?: Record<string, any>, newValues?: Record<string, any>): Promise<void>;
    logPermissionChange(organizationId: string, adminUserId: string, targetUserId: string, oldRole: string, newRole: string): Promise<void>;
    logSuspiciousActivity(organizationId: string, userId: string, activityType: string, description: string, metadata?: Record<string, any>, ipAddress?: string): Promise<void>;
    logDataExport(organizationId: string, userId: string, dataType: string, recordCount: number): Promise<void>;
    private getLogLevel;
}
