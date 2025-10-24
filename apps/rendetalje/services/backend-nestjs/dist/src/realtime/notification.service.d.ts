import { SupabaseService } from '../supabase/supabase.service';
import { RealtimeGateway } from './realtime.gateway';
export interface Notification {
    id?: string;
    organization_id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    is_read?: boolean;
    created_at?: string;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
    types: Record<string, boolean>;
}
export declare class NotificationService {
    private readonly supabaseService;
    private readonly realtimeGateway;
    private readonly logger;
    constructor(supabaseService: SupabaseService, realtimeGateway: RealtimeGateway);
    createNotification(notification: Notification): Promise<Notification>;
    createBulkNotifications(notifications: Notification[]): Promise<Notification[]>;
    getUserNotifications(userId: string, organizationId: string, limit?: number, unreadOnly?: boolean): Promise<Notification[]>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string, organizationId: string): Promise<void>;
    getUnreadCount(userId: string, organizationId: string): Promise<number>;
    notifyJobAssigned(jobId: string, teamMemberIds: string[], organizationId: string): Promise<void>;
    notifyJobStatusChange(jobId: string, status: string, organizationId: string, customerId?: string): Promise<void>;
    notifyPaymentReceived(invoiceId: string, amount: number, organizationId: string): Promise<void>;
    notifyCustomerMessage(customerId: string, jobId: string, organizationId: string): Promise<void>;
    notifyQualityIssue(jobId: string, issueDescription: string, organizationId: string): Promise<void>;
    notifyScheduleChange(jobId: string, oldDate: string, newDate: string, organizationId: string, customerId?: string): Promise<void>;
    sendPushNotification(userId: string, title: string, message: string, data?: Record<string, any>): Promise<void>;
    sendEmailNotification(userId: string, subject: string, htmlContent: string): Promise<void>;
    sendSMSNotification(userId: string, message: string): Promise<void>;
    private getStatusText;
}
