import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(notification: Notification): Promise<Notification> {
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
        data: created.data as Record<string, any>,
        isRead: created.isRead,
        readAt: created.readAt || undefined,
        createdAt: created.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  async createBulkNotifications(notifications: Notification[]): Promise<Notification[]> {
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
      
      // Fetch created notifications to return with IDs
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
        data: n.data as Record<string, any>,
        isRead: n.isRead,
        readAt: n.readAt || undefined,
        createdAt: n.createdAt,
      }));
    } catch (error) {
      this.logger.error('Failed to create bulk notifications', error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    organizationId: string,
    limit: number = 50,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    try {
      const where: any = {
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
        data: n.data as Record<string, any>,
        isRead: n.isRead,
        readAt: n.readAt || undefined,
        createdAt: n.createdAt,
      }));
    } catch (error) {
      this.logger.error('Failed to get user notifications', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.prisma.renosNotification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      await this.prisma.renosNotification.update({
        where: { id: notificationId },
        data: { 
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    try {
      const count = await this.prisma.renosNotification.count({
        where: {
          userId,
          organizationId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get unread count', error);
      throw error;
    }
  }

  // Specific notification types
  async notifyJobAssigned(
    jobId: string,
    teamMemberIds: string[],
    organizationId: string,
  ): Promise<void> {
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

  async notifyJobStatusChange(
    jobId: string,
    status: string,
    organizationId: string,
    customerId?: string,
  ): Promise<void> {
    const notifications: Notification[] = [];

    // Notify customer if provided
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

    // Notify organization owners and admins
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

  async notifyPaymentReceived(
    invoiceId: string,
    amount: number,
    organizationId: string,
  ): Promise<void> {
    // Notify owners and admins about payment
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

  async notifyCustomerMessage(
    customerId: string,
    jobId: string,
    organizationId: string,
  ): Promise<void> {
    const notifications: Notification[] = [];

    // TODO: Add teamMember relation to Booking or find alternative way to get assigned team members
    // For now, only notify admins and owners

    // Add admins and owners
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

  async notifyQualityIssue(
    jobId: string,
    issueDescription: string,
    organizationId: string,
  ): Promise<void> {
    // Notify owners and admins about quality issues
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

  async notifyScheduleChange(
    jobId: string,
    oldDate: string,
    newDate: string,
    organizationId: string,
    customerId?: string,
  ): Promise<void> {
    const notifications: Notification[] = [];

    // Notify customer
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

    // TODO: Add teamMember relation to Booking or find alternative way to get assigned team members
    // For now, skip team member notifications

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Push notification integration (placeholder for future implementation)
  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    this.logger.debug(`Push notification would be sent to ${userId}: ${title}`);
    // Future: Integrate with Firebase Cloud Messaging or similar
  }

  // Email notification integration (placeholder for future implementation)
  async sendEmailNotification(
    userId: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    this.logger.debug(`Email notification would be sent to ${userId}: ${subject}`);
    // Future: Integrate with SendGrid, AWS SES, etc.
  }

  // SMS notification integration (placeholder for future implementation)
  async sendSMSNotification(userId: string, message: string): Promise<void> {
    this.logger.debug(`SMS notification would be sent to ${userId}: ${message}`);
    // Future: Integrate with Twilio, etc.
  }

  private getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      scheduled: 'planlagt',
      confirmed: 'bekræftet',
      in_progress: 'i gang',
      completed: 'færdig',
      cancelled: 'aflyst',
      rescheduled: 'omplanlagt',
    };
    return statusTexts[status] || status;
  }
}
