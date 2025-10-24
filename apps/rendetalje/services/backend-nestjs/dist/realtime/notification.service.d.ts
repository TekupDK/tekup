import { PrismaService } from '../database/prisma.service';
export interface Notification {
    id?: string;
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead?: boolean;
    readAt?: Date;
    createdAt?: Date;
}
export declare class NotificationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
