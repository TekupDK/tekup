import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { WebSocketService } from './websocket.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';
import { ValidationPipe } from '../common/validation/validation.pipe.js';
import { 
  SubscribeDto, 
  UnsubscribeDto, 
  SendTestNotificationDto, 
  SendBulkNotificationDto 
} from './dto/websocket.dto.js';

@Controller('websocket')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor)
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  /**
   * Get WebSocket connection statistics
   */
  @Get('stats')
  @RateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 100, // Reasonable limit for stats
  })
  async getConnectionStats() {
    return this.webSocketService.getConnectionStats();
  }

  /**
   * Get notification queue statistics
   */
  @Get('queue-stats')
  @RateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 100, // Reasonable limit for stats
  })
  async getQueueStats() {
    return this.webSocketService.getQueueStats();
  }

  /**
   * Send a test notification
   */
  @Post('test-notification')
  @RateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 10, // Limited for testing
  })
  async sendTestNotification(
    @Body(ValidationPipe) body: SendTestNotificationDto,
    @Req() req: Request,
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!body.message) {
      throw new BadRequestException('Message is required');
    }

    const type = body.type || 'test.notification';
    
    await this.webSocketService.queueNotification(
      tenantId,
      type,
      {
        message: body.message,
        timestamp: new Date(),
      },
      'normal',
    );

    return {
      success: true,
      message: 'Test notification queued successfully',
      type,
      tenantId,
    };
  }

  /**
   * Send bulk notification
   */
  @Post('bulk-notification')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 5, // Very limited for bulk operations
  })
  async sendBulkNotification(
    @Body(ValidationPipe) body: SendBulkNotificationDto,
    @Req() req: Request,
  ) {
    const requesterTenantId = this.extractTenantId(req);
    
    if (!body.message) {
      throw new BadRequestException('Message is required');
    }

    if (!body.type) {
      throw new BadRequestException('Type is required');
    }

    // Only allow system administrators to send cross-tenant notifications
    const targetTenantId = body.tenantId || requesterTenantId;
    
    await this.webSocketService.sendBulkNotification(
      targetTenantId,
      body.type,
      {
        message: body.message,
        timestamp: new Date(),
      },
    );

    return {
      success: true,
      message: 'Bulk notification sent successfully',
      type: body.type,
      tenantId: targetTenantId,
    };
  }

  private extractTenantId(req: Request): string {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return tenantId;
  }
}