import { NotificationService } from './notification.service';
import { RealtimeGateway } from './realtime.gateway';
import { UserRole } from '../common/enums/user-role.enum';
export declare class RealtimeController {
    private readonly notificationService;
    private readonly realtimeGateway;
    constructor(notificationService: NotificationService, realtimeGateway: RealtimeGateway);
    getNotifications(req: any, limit?: number, unreadOnly?: boolean): Promise<import("./notification.service").Notification[]>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(notificationId: string, req: any): Promise<void>;
    markAllAsRead(req: any): Promise<void>;
    createNotification(notificationData: {
        user_id: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, any>;
    }, req: any): Promise<import("./notification.service").Notification>;
    broadcastNotification(broadcastData: {
        target: 'organization' | 'role';
        role?: UserRole;
        type: string;
        title: string;
        message: string;
        data?: Record<string, any>;
    }, req: any): Promise<import("./notification.service").Notification[] | {
        message: string;
    }>;
    getRealtimeStatus(req: any): Promise<{
        isConnected: boolean;
        connectedUsers: number;
        userOnline: boolean;
    }>;
    getConnectedUsers(req: any): Promise<{
        connectedUsers: any[];
        totalConnected?: undefined;
    } | {
        connectedUsers: any;
        totalConnected: number;
    }>;
    broadcastJobUpdate(data: {
        jobId: string;
        status: string;
        message?: string;
    }, req: any): Promise<{
        message: string;
    }>;
    broadcastToOrganization(data: {
        event: string;
        message: any;
    }, req: any): Promise<{
        message: string;
    }>;
    broadcastToRole(data: {
        role: UserRole;
        event: string;
        message: any;
    }, req: any): Promise<{
        message: string;
    }>;
}
