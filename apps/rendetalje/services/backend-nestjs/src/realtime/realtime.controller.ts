import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { RealtimeGateway } from "./realtime.gateway";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags("Real-time & Notifications")
@Controller("realtime")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RealtimeController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly supabaseService: SupabaseService
  ) {}

  // Notifications
  @Get("notifications")
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: "Get user notifications" })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  async getNotifications(
    @Request() req,
    @Query("limit") limit: number = 50,
    @Query("unread_only") unreadOnly: boolean = false
  ) {
    return this.notificationService.getUserNotifications(
      req.user.id,
      req.user.organizationId,
      limit,
      unreadOnly
    );
  }

  @Get("notifications/unread-count")
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: "Get unread notifications count" })
  @ApiResponse({
    status: 200,
    description: "Unread count retrieved successfully",
  })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(
      req.user.id,
      req.user.organizationId
    );
    return { count };
  }

  @Patch("notifications/:id/read")
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({ status: 204, description: "Notification marked as read" })
  async markAsRead(@Param("id") notificationId: string, @Request() req) {
    return this.notificationService.markAsRead(notificationId, req.user.id);
  }

  @Patch("notifications/mark-all-read")
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 204, description: "All notifications marked as read" })
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(
      req.user.id,
      req.user.organizationId
    );
  }

  @Post("notifications")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Create custom notification" })
  @ApiResponse({
    status: 201,
    description: "Notification created successfully",
  })
  async createNotification(
    @Body()
    notificationData: {
      user_id: string;
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
    },
    @Request() req
  ) {
    return this.notificationService.createNotification({
      ...notificationData,
      organization_id: req.user.organizationId,
    });
  }

  @Post("notifications/broadcast")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Broadcast notification to role or organization" })
  @ApiResponse({
    status: 201,
    description: "Notification broadcasted successfully",
  })
  async broadcastNotification(
    @Body()
    broadcastData: {
      target: "organization" | "role";
      role?: UserRole;
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
    },
    @Request() req
  ) {
    if (broadcastData.target === "role" && broadcastData.role) {
      // Get all users with the specified role
      const { data: users } = await this.supabaseService.client
        .from("users")
        .select("id")
        .eq("organization_id", req.user.organizationId)
        .eq("role", broadcastData.role);

      if (users) {
        const notifications = users.map((user) => ({
          organization_id: req.user.organizationId,
          user_id: user.id,
          type: broadcastData.type,
          title: broadcastData.title,
          message: broadcastData.message,
          data: broadcastData.data,
        }));

        return this.notificationService.createBulkNotifications(notifications);
      }
    } else {
      // Broadcast to entire organization
      const { data: users } = await this.supabaseService.client
        .from("users")
        .select("id")
        .eq("organization_id", req.user.organizationId);

      if (users) {
        const notifications = users.map((user) => ({
          organization_id: req.user.organizationId,
          user_id: user.id,
          type: broadcastData.type,
          title: broadcastData.title,
          message: broadcastData.message,
          data: broadcastData.data,
        }));

        return this.notificationService.createBulkNotifications(notifications);
      }
    }

    return { message: "No users found to notify" };
  }

  // Real-time Status
  @Get("status")
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: "Get real-time connection status" })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  async getRealtimeStatus(@Request() req) {
    const connectedUsers = this.realtimeGateway.getConnectedUsers(
      req.user.organizationId
    );
    const isUserOnline = this.realtimeGateway.isUserOnline(req.user.id);

    return {
      isConnected: isUserOnline,
      connectedUsers: connectedUsers.length,
      userOnline: isUserOnline,
    };
  }

  @Get("connected-users")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get list of connected users" })
  @ApiResponse({
    status: 200,
    description: "Connected users retrieved successfully",
  })
  async getConnectedUsers(@Request() req) {
    const connectedUserIds = this.realtimeGateway.getConnectedUsers(
      req.user.organizationId
    );

    // Get user details for connected users
    if (connectedUserIds.length === 0) {
      return { connectedUsers: [] };
    }

    const { data: users } = await this.supabaseService.client
      .from("users")
      .select("id, name, email, role, avatar_url")
      .in("id", connectedUserIds);

    return {
      connectedUsers: users || [],
      totalConnected: connectedUserIds.length,
    };
  }

  // Manual broadcasting (for testing/admin purposes)
  @Post("broadcast/job-update")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Manually broadcast job update" })
  async broadcastJobUpdate(
    @Body() data: { jobId: string; status: string; message?: string },
    @Request() req
  ) {
    this.realtimeGateway.broadcastJobUpdate(req.user.organizationId, data);
    return { message: "Job update broadcasted" };
  }

  @Post("broadcast/organization")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Broadcast message to entire organization" })
  async broadcastToOrganization(
    @Body() data: { event: string; message: any },
    @Request() req
  ) {
    this.realtimeGateway.broadcastToOrganization(
      req.user.organizationId,
      data.event,
      data.message
    );
    return { message: "Message broadcasted to organization" };
  }

  @Post("broadcast/role")
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: "Broadcast message to specific role" })
  async broadcastToRole(
    @Body() data: { role: UserRole; event: string; message: any },
    @Request() req
  ) {
    this.realtimeGateway.broadcastToRole(
      req.user.organizationId,
      data.role,
      data.event,
      data.message
    );
    return { message: `Message broadcasted to ${data.role} role` };
  }
}
