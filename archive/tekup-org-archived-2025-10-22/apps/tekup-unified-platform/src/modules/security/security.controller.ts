import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('login')
  async login(@Body() loginData: any) {
    return this.securityService.login(loginData);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshData: any) {
    return this.securityService.refreshToken(refreshData);
  }

  @Get('permissions')
  async getPermissions() {
    return this.securityService.getPermissions();
  }

  @Post('audit')
  async logAuditEvent(@Body() auditData: any) {
    return this.securityService.logAuditEvent(auditData);
  }
}
