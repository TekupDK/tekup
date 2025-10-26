import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MobileService } from './mobile.service';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('dashboard')
  getDashboardData() {
    // In a real implementation, we would get tenantId and userId from the authenticated user
    return this.mobileService.getMobileDashboardData('tenant-id', 'user-id');
  }

  @Get('search/contacts')
  searchContacts(@Query('q') query: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.mobileService.searchContacts('tenant-id', query);
  }

  @Get('offline-data')
  getOfflineData(@Query('lastSyncedAt') lastSyncedAt?: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.mobileService.getOfflineData('tenant-id', lastSyncedAt);
  }
}