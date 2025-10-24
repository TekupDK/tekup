"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggerService = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "auth.login";
    AuditAction["LOGOUT"] = "auth.logout";
    AuditAction["LOGIN_FAILED"] = "auth.login_failed";
    AuditAction["PASSWORD_RESET"] = "auth.password_reset";
    AuditAction["PASSWORD_CHANGE"] = "auth.password_change";
    AuditAction["USER_CREATE"] = "user.create";
    AuditAction["USER_UPDATE"] = "user.update";
    AuditAction["USER_DELETE"] = "user.delete";
    AuditAction["USER_ROLE_CHANGE"] = "user.role_change";
    AuditAction["CUSTOMER_CREATE"] = "customer.create";
    AuditAction["CUSTOMER_UPDATE"] = "customer.update";
    AuditAction["CUSTOMER_DELETE"] = "customer.delete";
    AuditAction["CUSTOMER_VIEW"] = "customer.view";
    AuditAction["JOB_CREATE"] = "job.create";
    AuditAction["JOB_UPDATE"] = "job.update";
    AuditAction["JOB_DELETE"] = "job.delete";
    AuditAction["JOB_STATUS_CHANGE"] = "job.status_change";
    AuditAction["JOB_ASSIGN"] = "job.assign";
    AuditAction["PAYMENT_PROCESS"] = "payment.process";
    AuditAction["INVOICE_CREATE"] = "invoice.create";
    AuditAction["INVOICE_SEND"] = "invoice.send";
    AuditAction["DATA_EXPORT"] = "data.export";
    AuditAction["DATA_IMPORT"] = "data.import";
    AuditAction["BULK_OPERATION"] = "data.bulk_operation";
    AuditAction["PERMISSION_DENIED"] = "security.permission_denied";
    AuditAction["SUSPICIOUS_ACTIVITY"] = "security.suspicious_activity";
    AuditAction["DATA_BREACH_ATTEMPT"] = "security.data_breach_attempt";
    AuditAction["SYSTEM_CONFIG_CHANGE"] = "system.config_change";
    AuditAction["BACKUP_CREATE"] = "system.backup_create";
    AuditAction["BACKUP_RESTORE"] = "system.backup_restore";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLoggerService = AuditLoggerService_1 = class AuditLoggerService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(AuditLoggerService_1.name);
    }
    async log(entry) {
        try {
            const auditEntry = {
                ...entry,
                timestamp: new Date().toISOString(),
                success: entry.success ?? true,
            };
            await this.logToDatabase(auditEntry);
            this.logToConsole(auditEntry);
        }
        catch (error) {
            this.logger.error('Failed to write audit log', error);
        }
    }
    async logAuthentication(userId, organizationId, action, ipAddress, userAgent, sessionId) {
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
    async logAuthenticationFailure(email, reason, ipAddress, userAgent) {
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
    async logDataAccess(userId, organizationId, resource, resourceId, action, details) {
        await this.log({
            userId,
            organizationId,
            action,
            resource,
            resourceId,
            details,
        });
    }
    async logSecurityEvent(action, details, userId, organizationId, ipAddress) {
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
    async logPermissionDenied(userId, organizationId, resource, action, ipAddress) {
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
    async logBulkOperation(userId, organizationId, operation, affectedCount, details) {
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
    async getUserAuditLogs(userId, organizationId, limit = 100, offset = 0) {
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
        }
        catch (error) {
            this.logger.error('Failed to retrieve user audit logs', error);
            return [];
        }
    }
    async getResourceAuditLogs(resource, resourceId, organizationId, limit = 50) {
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
        }
        catch (error) {
            this.logger.error('Failed to retrieve resource audit logs', error);
            return [];
        }
    }
    async getSecurityEvents(organizationId, startDate, endDate, limit = 100) {
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
        }
        catch (error) {
            this.logger.error('Failed to retrieve security events', error);
            return [];
        }
    }
    async logToDatabase(entry) {
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
    logToConsole(entry) {
        const logLevel = entry.success ? 'log' : 'warn';
        const message = `AUDIT: ${entry.action} on ${entry.resource}${entry.resourceId ? `/${entry.resourceId}` : ''} by user ${entry.userId || 'anonymous'}`;
        this.logger[logLevel](message, {
            ...entry,
            details: entry.details ? Object.keys(entry.details) : undefined,
        });
    }
};
exports.AuditLoggerService = AuditLoggerService;
exports.AuditLoggerService = AuditLoggerService = AuditLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditLoggerService);
//# sourceMappingURL=audit-logger.service.js.map