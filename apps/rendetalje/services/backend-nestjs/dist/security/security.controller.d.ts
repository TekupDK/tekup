import { AuditService } from './audit.service';
export declare class SecurityController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(user: any, userId?: string, action?: string, entityType?: string, startDate?: string, endDate?: string, limit?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    getSecurityEvents(user: any, userId?: string, eventType?: string, severity?: string, resolved?: string, startDate?: string, endDate?: string, limit?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    getUnresolvedEvents(user: any): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    resolveSecurityEvent(eventId: string, user: any): Promise<void>;
    logSecurityEvent(user: any, eventData: {
        eventType: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        metadata?: Record<string, any>;
        userId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getSecurityStatistics(user: any, days?: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
