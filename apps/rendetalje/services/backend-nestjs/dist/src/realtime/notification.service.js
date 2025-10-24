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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const realtime_gateway_1 = require("./realtime.gateway");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(supabaseService, realtimeGateway) {
        this.supabaseService = supabaseService;
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async createNotification(notification) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('notifications')
                .insert({
                ...notification,
                is_read: false,
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create notification: ${error.message}`);
            }
            this.realtimeGateway.broadcastNotification(notification.user_id, data);
            this.logger.log(`Notification created for user ${notification.user_id}: ${notification.type}`);
            return data;
        }
        catch (error) {
            this.logger.error('Failed to create notification', error);
            throw error;
        }
    }
    async createBulkNotifications(notifications) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('notifications')
                .insert(notifications.map(n => ({ ...n, is_read: false })))
                .select();
            if (error) {
                throw new Error(`Failed to create bulk notifications: ${error.message}`);
            }
            data.forEach(notification => {
                this.realtimeGateway.broadcastNotification(notification.user_id, notification);
            });
            this.logger.log(`Created ${data.length} bulk notifications`);
            return data;
        }
        catch (error) {
            this.logger.error('Failed to create bulk notifications', error);
            throw error;
        }
    }
    async getUserNotifications(userId, organizationId, limit = 50, unreadOnly = false) {
        try {
            let query = this.supabaseService.client
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (unreadOnly) {
                query = query.eq('is_read', false);
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to get notifications: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            this.logger.error('Failed to get user notifications', error);
            throw error;
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            const { error } = await this.supabaseService.client
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
                .eq('user_id', userId);
            if (error) {
                throw new Error(`Failed to mark notification as read: ${error.message}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to mark notification as read', error);
            throw error;
        }
    }
    async markAllAsRead(userId, organizationId) {
        try {
            const { error } = await this.supabaseService.client
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .eq('is_read', false);
            if (error) {
                throw new Error(`Failed to mark all notifications as read: ${error.message}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to mark all notifications as read', error);
            throw error;
        }
    }
    async getUnreadCount(userId, organizationId) {
        try {
            const { count, error } = await this.supabaseService.client
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('organization_id', organizationId)
                .eq('is_read', false);
            if (error) {
                throw new Error(`Failed to get unread count: ${error.message}`);
            }
            return count || 0;
        }
        catch (error) {
            this.logger.error('Failed to get unread count', error);
            throw error;
        }
    }
    async notifyJobAssigned(jobId, teamMemberIds, organizationId) {
        const notifications = teamMemberIds.map(userId => ({
            organization_id: organizationId,
            user_id: userId,
            type: 'job_assigned',
            title: 'Nyt job tildelt',
            message: 'Du har fået tildelt et nyt rengøringsjob',
            data: { jobId },
        }));
        await this.createBulkNotifications(notifications);
    }
    async notifyJobStatusChange(jobId, status, organizationId, customerId) {
        const notifications = [];
        if (customerId) {
            notifications.push({
                organization_id: organizationId,
                user_id: customerId,
                type: 'job_status_update',
                title: 'Job status opdateret',
                message: `Dit rengøringsjob er nu: ${this.getStatusText(status)}`,
                data: { jobId, status },
            });
        }
        const { data: users } = await this.supabaseService.client
            .from('users')
            .select('id')
            .eq('organization_id', organizationId)
            .in('role', ['owner', 'admin']);
        if (users) {
            users.forEach(user => {
                notifications.push({
                    organization_id: organizationId,
                    user_id: user.id,
                    type: 'job_status_update',
                    title: 'Job status ændret',
                    message: `Job status ændret til: ${this.getStatusText(status)}`,
                    data: { jobId, status },
                });
            });
        }
        if (notifications.length > 0) {
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyPaymentReceived(invoiceId, amount, organizationId) {
        const { data: users } = await this.supabaseService.client
            .from('users')
            .select('id')
            .eq('organization_id', organizationId)
            .in('role', ['owner', 'admin']);
        if (users) {
            const notifications = users.map(user => ({
                organization_id: organizationId,
                user_id: user.id,
                type: 'payment_received',
                title: 'Betaling modtaget',
                message: `Betaling på ${amount} DKK er modtaget`,
                data: { invoiceId, amount },
            }));
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyCustomerMessage(customerId, jobId, organizationId) {
        const { data: assignments } = await this.supabaseService.client
            .from('job_assignments')
            .select(`
        team_members!inner(user_id)
      `)
            .eq('job_id', jobId);
        const notifications = [];
        if (assignments) {
            assignments.forEach(assignment => {
                notifications.push({
                    organization_id: organizationId,
                    user_id: assignment.team_members.user_id,
                    type: 'customer_message',
                    title: 'Ny besked fra kunde',
                    message: 'Du har modtaget en ny besked fra en kunde',
                    data: { customerId, jobId },
                });
            });
        }
        const { data: users } = await this.supabaseService.client
            .from('users')
            .select('id')
            .eq('organization_id', organizationId)
            .in('role', ['owner', 'admin']);
        if (users) {
            users.forEach(user => {
                notifications.push({
                    organization_id: organizationId,
                    user_id: user.id,
                    type: 'customer_message',
                    title: 'Ny kundebesked',
                    message: 'En kunde har sendt en ny besked',
                    data: { customerId, jobId },
                });
            });
        }
        if (notifications.length > 0) {
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyQualityIssue(jobId, issueDescription, organizationId) {
        const { data: users } = await this.supabaseService.client
            .from('users')
            .select('id')
            .eq('organization_id', organizationId)
            .in('role', ['owner', 'admin']);
        if (users) {
            const notifications = users.map(user => ({
                organization_id: organizationId,
                user_id: user.id,
                type: 'quality_issue',
                title: 'Kvalitetsproblem opdaget',
                message: `Kvalitetsproblem: ${issueDescription}`,
                data: { jobId, issueDescription },
            }));
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyScheduleChange(jobId, oldDate, newDate, organizationId, customerId) {
        const notifications = [];
        if (customerId) {
            notifications.push({
                organization_id: organizationId,
                user_id: customerId,
                type: 'schedule_change',
                title: 'Tidsplan ændret',
                message: `Dit rengøringsjob er flyttet til ${new Date(newDate).toLocaleDateString('da-DK')}`,
                data: { jobId, oldDate, newDate },
            });
        }
        const { data: assignments } = await this.supabaseService.client
            .from('job_assignments')
            .select(`
        team_members!inner(user_id)
      `)
            .eq('job_id', jobId);
        if (assignments) {
            assignments.forEach(assignment => {
                notifications.push({
                    organization_id: organizationId,
                    user_id: assignment.team_members.user_id,
                    type: 'schedule_change',
                    title: 'Tidsplan ændret',
                    message: `Job flyttet til ${new Date(newDate).toLocaleDateString('da-DK')}`,
                    data: { jobId, oldDate, newDate },
                });
            });
        }
        if (notifications.length > 0) {
            await this.createBulkNotifications(notifications);
        }
    }
    async sendPushNotification(userId, title, message, data) {
        this.logger.debug(`Push notification would be sent to ${userId}: ${title}`);
    }
    async sendEmailNotification(userId, subject, htmlContent) {
        this.logger.debug(`Email notification would be sent to ${userId}: ${subject}`);
    }
    async sendSMSNotification(userId, message) {
        this.logger.debug(`SMS notification would be sent to ${userId}: ${message}`);
    }
    getStatusText(status) {
        const statusTexts = {
            scheduled: 'planlagt',
            confirmed: 'bekræftet',
            in_progress: 'i gang',
            completed: 'færdig',
            cancelled: 'aflyst',
            rescheduled: 'omplanlagt',
        };
        return statusTexts[status] || status;
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        realtime_gateway_1.RealtimeGateway])
], NotificationService);
//# sourceMappingURL=notification.service.js.map