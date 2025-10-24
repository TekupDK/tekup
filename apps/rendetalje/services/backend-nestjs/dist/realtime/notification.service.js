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
const prisma_service_1 = require("../database/prisma.service");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async createNotification(notification) {
        try {
            const created = await this.prisma.renosNotification.create({
                data: {
                    organizationId: notification.organizationId,
                    userId: notification.userId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data || {},
                    isRead: false,
                },
            });
            this.logger.log(`Notification created for user ${notification.userId}: ${notification.type}`);
            return {
                id: created.id,
                organizationId: created.organizationId,
                userId: created.userId,
                type: created.type,
                title: created.title,
                message: created.message,
                data: created.data,
                isRead: created.isRead,
                readAt: created.readAt || undefined,
                createdAt: created.createdAt,
            };
        }
        catch (error) {
            this.logger.error('Failed to create notification', error);
            throw error;
        }
    }
    async createBulkNotifications(notifications) {
        try {
            const created = await this.prisma.renosNotification.createMany({
                data: notifications.map(n => ({
                    organizationId: n.organizationId,
                    userId: n.userId,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    data: n.data || {},
                    isRead: false,
                })),
            });
            this.logger.log(`Created ${created.count} bulk notifications`);
            const result = await this.prisma.renosNotification.findMany({
                where: {
                    userId: { in: notifications.map(n => n.userId) },
                    type: { in: notifications.map(n => n.type) },
                },
                orderBy: { createdAt: 'desc' },
                take: created.count,
            });
            return result.map(n => ({
                id: n.id,
                organizationId: n.organizationId,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                data: n.data,
                isRead: n.isRead,
                readAt: n.readAt || undefined,
                createdAt: n.createdAt,
            }));
        }
        catch (error) {
            this.logger.error('Failed to create bulk notifications', error);
            throw error;
        }
    }
    async getUserNotifications(userId, organizationId, limit = 50, unreadOnly = false) {
        try {
            const where = {
                userId,
                organizationId,
            };
            if (unreadOnly) {
                where.isRead = false;
            }
            const notifications = await this.prisma.renosNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            return notifications.map(n => ({
                id: n.id,
                organizationId: n.organizationId,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                data: n.data,
                isRead: n.isRead,
                readAt: n.readAt || undefined,
                createdAt: n.createdAt,
            }));
        }
        catch (error) {
            this.logger.error('Failed to get user notifications', error);
            throw error;
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            const notification = await this.prisma.renosNotification.findFirst({
                where: { id: notificationId, userId },
            });
            if (!notification) {
                throw new common_1.NotFoundException(`Notification ${notificationId} not found`);
            }
            await this.prisma.renosNotification.update({
                where: { id: notificationId },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to mark notification as read', error);
            throw error;
        }
    }
    async markAllAsRead(userId, organizationId) {
        try {
            await this.prisma.renosNotification.updateMany({
                where: {
                    userId,
                    organizationId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to mark all notifications as read', error);
            throw error;
        }
    }
    async getUnreadCount(userId, organizationId) {
        try {
            const count = await this.prisma.renosNotification.count({
                where: {
                    userId,
                    organizationId,
                    isRead: false,
                },
            });
            return count;
        }
        catch (error) {
            this.logger.error('Failed to get unread count', error);
            throw error;
        }
    }
    async notifyJobAssigned(jobId, teamMemberIds, organizationId) {
        const notifications = teamMemberIds.map(userId => ({
            organizationId,
            userId,
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
                organizationId,
                userId: customerId,
                type: 'job_status_update',
                title: 'Job status opdateret',
                message: `Dit rengøringsjob er nu: ${this.getStatusText(status)}`,
                data: { jobId, status },
            });
        }
        const users = await this.prisma.renosUser.findMany({
            where: {
                role: { in: ['owner', 'admin'] },
            },
            select: { id: true },
        });
        users.forEach(user => {
            notifications.push({
                organizationId,
                userId: user.id,
                type: 'job_status_update',
                title: 'Job status ændret',
                message: `Job status ændret til: ${this.getStatusText(status)}`,
                data: { jobId, status },
            });
        });
        if (notifications.length > 0) {
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyPaymentReceived(invoiceId, amount, organizationId) {
        const users = await this.prisma.renosUser.findMany({
            where: {
                role: { in: ['owner', 'admin'] },
            },
            select: { id: true },
        });
        if (users.length > 0) {
            const notifications = users.map(user => ({
                organizationId,
                userId: user.id,
                type: 'payment_received',
                title: 'Betaling modtaget',
                message: `Betaling på ${amount} DKK er modtaget`,
                data: { invoiceId, amount },
            }));
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyCustomerMessage(customerId, jobId, organizationId) {
        const notifications = [];
        const users = await this.prisma.renosUser.findMany({
            where: {
                role: { in: ['owner', 'admin'] },
            },
            select: { id: true },
        });
        users.forEach(user => {
            notifications.push({
                organizationId,
                userId: user.id,
                type: 'customer_message',
                title: 'Ny kundebesked',
                message: 'En kunde har sendt en ny besked',
                data: { customerId, jobId },
            });
        });
        if (notifications.length > 0) {
            await this.createBulkNotifications(notifications);
        }
    }
    async notifyQualityIssue(jobId, issueDescription, organizationId) {
        const users = await this.prisma.renosUser.findMany({
            where: {
                role: { in: ['owner', 'admin'] },
            },
            select: { id: true },
        });
        if (users.length > 0) {
            const notifications = users.map(user => ({
                organizationId,
                userId: user.id,
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
                organizationId,
                userId: customerId,
                type: 'schedule_change',
                title: 'Tidsplan ændret',
                message: `Dit rengøringsjob er flyttet til ${new Date(newDate).toLocaleDateString('da-DK')}`,
                data: { jobId, oldDate, newDate },
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map