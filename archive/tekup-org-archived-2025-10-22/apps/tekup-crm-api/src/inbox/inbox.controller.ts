import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get('activities')
  getContactActivities(@Query('email') email: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.inboxService.getContactActivitiesByEmail(email, 'tenant-id');
  }

  @Get('deals')
  getDealContext(@Query('email') email: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.inboxService.getDealContextByEmail(email, 'tenant-id');
  }

  @Post('link-activity')
  linkActivityToEmail(@Body() body: { activityId: string; email: string }) {
    const { activityId, email } = body;
    // In a real implementation, we would get tenantId from the authenticated user
    return this.inboxService.linkActivityToEmail(activityId, email, 'tenant-id');
  }
}