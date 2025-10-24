import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { RealtimeGateway } from "./realtime.gateway";

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

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async createNotification(notification: Notification): Promise<Notification> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("notifications")
        .insert({
          ...notification,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      // Send real-time notification
      this.realtimeGateway.broadcastNotification(notification.user_id, data);

      this.logger.log(
        `Notification created for user ${notification.user_id}: ${notification.type}`
      );
      return data;
    } catch (error) {
      this.logger.error("Failed to create notification", error);
      throw error;
    }
  }

  async createBulkNotifications(
    notifications: Notification[]
  ): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("notifications")
        .insert(notifications.map((n) => ({ ...n, is_read: false })))
        .select();

      if (error) {
        throw new Error(
          `Failed to create bulk notifications: ${error.message}`
        );
      }

      // Send real-time notifications
      data.forEach((notification) => {
        this.realtimeGateway.broadcastNotification(
          notification.user_id,
          notification
        );
      });

      this.logger.log(`Created ${data.length} bulk notifications`);
      return data;
    } catch (error) {
      this.logger.error("Failed to create bulk notifications", error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    organizationId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = this.supabaseService.client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get notifications: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error("Failed to get user notifications", error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(
          `Failed to mark notification as read: ${error.message}`
        );
      }
    } catch (error) {
      this.logger.error("Failed to mark notification as read", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .eq("is_read", false);

      if (error) {
        throw new Error(
          `Failed to mark all notifications as read: ${error.message}`
        );
      }
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read", error);
      throw error;
    }
  }

  async getUnreadCount(
    userId: string,
    organizationId: string
  ): Promise<number> {
    try {
      const { count, error } = await this.supabaseService.client
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .eq("is_read", false);

      if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      this.logger.error("Failed to get unread count", error);
      throw error;
    }
  }

  // Specific notification types
  async notifyJobAssigned(
    jobId: string,
    teamMemberIds: string[],
    organizationId: string
  ): Promise<void> {
    const notifications = teamMemberIds.map((userId) => ({
      organization_id: organizationId,
      user_id: userId,
      type: "job_assigned",
      title: "Nyt job tildelt",
      message: "Du har fået tildelt et nyt rengøringsjob",
      data: { jobId },
    }));

    await this.createBulkNotifications(notifications);
  }

  async notifyJobStatusChange(
    jobId: string,
    status: string,
    organizationId: string,
    customerId?: string
  ): Promise<void> {
    const notifications: Notification[] = [];

    // Notify customer if provided
    if (customerId) {
      notifications.push({
        organization_id: organizationId,
        user_id: customerId,
        type: "job_status_update",
        title: "Job status opdateret",
        message: `Dit rengøringsjob er nu: ${this.getStatusText(status)}`,
        data: { jobId, status },
      });
    }

    // Notify organization owners and admins
    const { data: users } = await this.supabaseService.client
      .from("users")
      .select("id")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "admin"]);

    if (users) {
      users.forEach((user) => {
        notifications.push({
          organization_id: organizationId,
          user_id: user.id,
          type: "job_status_update",
          title: "Job status ændret",
          message: `Job status ændret til: ${this.getStatusText(status)}`,
          data: { jobId, status },
        });
      });
    }

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  async notifyPaymentReceived(
    invoiceId: string,
    amount: number,
    organizationId: string
  ): Promise<void> {
    // Notify owners and admins about payment
    const { data: users } = await this.supabaseService.client
      .from("users")
      .select("id")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "admin"]);

    if (users) {
      const notifications = users.map((user) => ({
        organization_id: organizationId,
        user_id: user.id,
        type: "payment_received",
        title: "Betaling modtaget",
        message: `Betaling på ${amount} DKK er modtaget`,
        data: { invoiceId, amount },
      }));

      await this.createBulkNotifications(notifications);
    }
  }

  async notifyCustomerMessage(
    customerId: string,
    jobId: string,
    organizationId: string
  ): Promise<void> {
    // Notify assigned team members and admins
    const { data: assignments } = await this.supabaseService.client
      .from("job_assignments")
      .select(
        `
        team_members!inner(user_id)
      `
      )
      .eq("job_id", jobId);

    const notifications: Notification[] = [];

    // Add team members
    if (assignments) {
      assignments.forEach((assignment) => {
        notifications.push({
          organization_id: organizationId,
          user_id: assignment.team_members.user_id,
          type: "customer_message",
          title: "Ny besked fra kunde",
          message: "Du har modtaget en ny besked fra en kunde",
          data: { customerId, jobId },
        });
      });
    }

    // Add admins and owners
    const { data: users } = await this.supabaseService.client
      .from("users")
      .select("id")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "admin"]);

    if (users) {
      users.forEach((user) => {
        notifications.push({
          organization_id: organizationId,
          user_id: user.id,
          type: "customer_message",
          title: "Ny kundebesked",
          message: "En kunde har sendt en ny besked",
          data: { customerId, jobId },
        });
      });
    }

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  async notifyQualityIssue(
    jobId: string,
    issueDescription: string,
    organizationId: string
  ): Promise<void> {
    // Notify owners and admins about quality issues
    const { data: users } = await this.supabaseService.client
      .from("users")
      .select("id")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "admin"]);

    if (users) {
      const notifications = users.map((user) => ({
        organization_id: organizationId,
        user_id: user.id,
        type: "quality_issue",
        title: "Kvalitetsproblem opdaget",
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
    customerId?: string
  ): Promise<void> {
    const notifications: Notification[] = [];

    // Notify customer
    if (customerId) {
      notifications.push({
        organization_id: organizationId,
        user_id: customerId,
        type: "schedule_change",
        title: "Tidsplan ændret",
        message: `Dit rengøringsjob er flyttet til ${new Date(newDate).toLocaleDateString("da-DK")}`,
        data: { jobId, oldDate, newDate },
      });
    }

    // Notify assigned team members
    const { data: assignments } = await this.supabaseService.client
      .from("job_assignments")
      .select(
        `
        team_members!inner(user_id)
      `
      )
      .eq("job_id", jobId);

    if (assignments) {
      assignments.forEach((assignment) => {
        notifications.push({
          organization_id: organizationId,
          user_id: assignment.team_members.user_id,
          type: "schedule_change",
          title: "Tidsplan ændret",
          message: `Job flyttet til ${new Date(newDate).toLocaleDateString("da-DK")}`,
          data: { jobId, oldDate, newDate },
        });
      });
    }

    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  // Push notification integration (would integrate with Firebase, etc.)
  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    // This would integrate with Firebase Cloud Messaging or similar service
    this.logger.debug(`Push notification would be sent to ${userId}: ${title}`);

    // Implementation would include:
    // - Get user's device tokens from database
    // - Send push notification via FCM/APNS
    // - Handle delivery receipts and failures
  }

  // Email notification integration
  async sendEmailNotification(
    userId: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    // This would integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.debug(
      `Email notification would be sent to ${userId}: ${subject}`
    );

    // Implementation would include:
    // - Get user's email from database
    // - Send email via service
    // - Handle bounces and delivery status
  }

  // SMS notification integration
  async sendSMSNotification(userId: string, message: string): Promise<void> {
    // This would integrate with SMS service (Twilio, etc.)
    this.logger.debug(
      `SMS notification would be sent to ${userId}: ${message}`
    );

    // Implementation would include:
    // - Get user's phone number from database
    // - Send SMS via service
    // - Handle delivery status
  }

  private getStatusText(status: string): string {
    const statusTexts = {
      scheduled: "planlagt",
      confirmed: "bekræftet",
      in_progress: "i gang",
      completed: "færdig",
      cancelled: "aflyst",
      rescheduled: "omplanlagt",
    };
    return statusTexts[status] || status;
  }
}
