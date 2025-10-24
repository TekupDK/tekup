import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuditService, SecurityEvent } from './audit.service';

@ApiTags('Security')
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs for the organization
   * Owner/Admin only
   */
  @Get('audit-logs')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @CurrentUser() user: any,
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);

    const logs = await this.auditService.getAuditLogs(user.organizationId, filters);

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * Get security events for the organization
   * Owner/Admin only
   */
  @Get('security-events')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security events' })
  @ApiResponse({ status: 200, description: 'Security events retrieved successfully' })
  async getSecurityEvents(
    @CurrentUser() user: any,
    @Query('user_id') userId?: string,
    @Query('event_type') eventType?: string,
    @Query('severity') severity?: string,
    @Query('resolved') resolved?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (eventType) filters.eventType = eventType;
    if (severity) filters.severity = severity;
    if (resolved !== undefined) filters.resolved = resolved === 'true';
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);

    const events = await this.auditService.getSecurityEvents(user.organizationId, filters);

    return {
      success: true,
      data: events,
      count: events.length,
    };
  }

  /**
   * Get unresolved security events
   * Owner/Admin only
   */
  @Get('security-events/unresolved')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get unresolved security events' })
  @ApiResponse({ status: 200, description: 'Unresolved security events retrieved successfully' })
  async getUnresolvedEvents(@CurrentUser() user: any) {
    const events = await this.auditService.getSecurityEvents(user.organizationId, {
      resolved: false,
    });

    return {
      success: true,
      data: events,
      count: events.length,
    };
  }

  /**
   * Resolve a security event
   * Owner/Admin only
   */
  @Patch('security-events/:id/resolve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resolve a security event' })
  @ApiResponse({ status: 204, description: 'Security event resolved successfully' })
  async resolveSecurityEvent(
    @Param('id') eventId: string,
    @CurrentUser() user: any,
  ) {
    await this.auditService.resolveSecurityEvent(eventId, user.id);
  }

  /**
   * Log a security event (for testing or manual logging)
   * Owner/Admin only
   */
  @Post('security-events')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log a security event' })
  @ApiResponse({ status: 201, description: 'Security event logged successfully' })
  async logSecurityEvent(
    @CurrentUser() user: any,
    @Body() eventData: {
      eventType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      metadata?: Record<string, any>;
      userId?: string;
    },
  ) {
    const event: SecurityEvent = {
      organizationId: user.organizationId,
      userId: eventData.userId || user.id,
      eventType: eventData.eventType,
      severity: eventData.severity,
      description: eventData.description,
      metadata: eventData.metadata,
    };

    await this.auditService.logSecurityEvent(event);

    return {
      success: true,
      message: 'Security event logged successfully',
    };
  }

  /**
   * Get security statistics
   * Owner/Admin only
   */
  @Get('statistics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security statistics' })
  @ApiResponse({ status: 200, description: 'Security statistics retrieved successfully' })
  async getSecurityStatistics(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const period = days ? parseInt(days) : 30;
    const stats = await this.auditService.getSecurityStatistics(user.organizationId, period);

    return {
      success: true,
      data: stats,
    };
  }
}
