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
export declare enum AuditAction {
    LOGIN = "auth.login",
    LOGOUT = "auth.logout",
    LOGIN_FAILED = "auth.login_failed",
    PASSWORD_RESET = "auth.password_reset",
    PASSWORD_CHANGE = "auth.password_change",
    USER_CREATE = "user.create",
    USER_UPDATE = "user.update",
    USER_DELETE = "user.delete",
    USER_ROLE_CHANGE = "user.role_change",
    CUSTOMER_CREATE = "customer.create",
    CUSTOMER_UPDATE = "customer.update",
    CUSTOMER_DELETE = "customer.delete",
    CUSTOMER_VIEW = "customer.view",
    JOB_CREATE = "job.create",
    JOB_UPDATE = "job.update",
    JOB_DELETE = "job.delete",
    JOB_STATUS_CHANGE = "job.status_change",
    JOB_ASSIGN = "job.assign",
    PAYMENT_PROCESS = "payment.process",
    INVOICE_CREATE = "invoice.create",
    INVOICE_SEND = "invoice.send",
    DATA_EXPORT = "data.export",
    DATA_IMPORT = "data.import",
    BULK_OPERATION = "data.bulk_operation",
    PERMISSION_DENIED = "security.permission_denied",
    SUSPICIOUS_ACTIVITY = "security.suspicious_activity",
    DATA_BREACH_ATTEMPT = "security.data_breach_attempt",
    SYSTEM_CONFIG_CHANGE = "system.config_change",
    BACKUP_CREATE = "system.backup_create",
    BACKUP_RESTORE = "system.backup_restore"
}
export declare class AuditLoggerService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    log(entry: Partial<AuditLogEntry> & {
        action: string;
        resource: string;
    }): Promise<void>;
    logAuthentication(userId: string, organizationId: string, action: AuditAction, ipAddress?: string, userAgent?: string, sessionId?: string): Promise<void>;
    logAuthenticationFailure(email: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logDataAccess(userId: string, organizationId: string, resource: string, resourceId: string, action: string, details?: Record<string, any>): Promise<void>;
    logSecurityEvent(action: AuditAction, details: Record<string, any>, userId?: string, organizationId?: string, ipAddress?: string): Promise<void>;
    logPermissionDenied(userId: string, organizationId: string, resource: string, action: string, ipAddress?: string): Promise<void>;
    logBulkOperation(userId: string, organizationId: string, operation: string, affectedCount: number, details?: Record<string, any>): Promise<void>;
    getUserAuditLogs(userId: string, organizationId: string, limit?: number, offset?: number): Promise<AuditLogEntry[]>;
    getResourceAuditLogs(resource: string, resourceId: string, organizationId: string, limit?: number): Promise<AuditLogEntry[]>;
    getSecurityEvents(organizationId: string, startDate?: string, endDate?: string, limit?: number): Promise<AuditLogEntry[]>;
    private logToDatabase;
    private logToConsole;
}
