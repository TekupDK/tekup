import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';
import { TekupBillyService } from './tekup-billy/tekup-billy.service';
import { TekupVaultService } from './tekup-vault/tekup-vault.service';
import { RenosCalendarService } from './renos-calendar/renos-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly tekupBillyService: TekupBillyService,
    private readonly tekupVaultService: TekupVaultService,
    private readonly renosCalendarService: RenosCalendarService,
  ) {}

  // Health and Status
  @Get('health')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get integration health status' })
  @ApiResponse({ status: 200, description: 'Integration health status retrieved successfully' })
  async getHealthStatus() {
    const health = this.integrationService.getAllServicesHealth();
    
    // Add individual service health checks
    const serviceChecks = await Promise.allSettled([
      this.tekupBillyService.healthCheck(),
      this.tekupVaultService.healthCheck(),
      this.renosCalendarService.healthCheck(),
    ]);

    return {
      overall: health,
      services: {
        'tekup-billy': {
          ...health['tekup-billy'],
          connectivity: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : false,
        },
        'tekup-vault': {
          ...health['tekup-vault'],
          connectivity: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : false,
        },
        'renos-calendar': {
          ...health['renos-calendar'],
          connectivity: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : false,
        },
      },
    };
  }

  // Billy.dk Integration Endpoints
  @Get('billy/customers/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Search customers in Billy.dk' })
  async searchBillyCustomers(@Query('q') query: string) {
    return this.tekupBillyService.searchCustomers(query);
  }

  @Get('billy/products')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get products from Billy.dk' })
  async getBillyProducts() {
    return this.tekupBillyService.getProducts();
  }

  @Post('billy/invoices')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create invoice in Billy.dk' })
  async createBillyInvoice(@Body() invoiceData: any) {
    return this.tekupBillyService.createInvoice(invoiceData);
  }

  @Get('billy/invoices/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get invoice from Billy.dk' })
  async getBillyInvoice(@Param('id') id: string) {
    return this.tekupBillyService.getInvoice(id);
  }

  @Post('billy/invoices/:id/send')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send invoice via Billy.dk' })
  async sendBillyInvoice(@Param('id') id: string, @Body('email') email?: string) {
    return this.tekupBillyService.sendInvoice(id, email);
  }

  @Get('billy/reports/financial')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get financial report from Billy.dk' })
  async getBillyFinancialReport(
    @Query('from') dateFrom: string,
    @Query('to') dateTo: string,
  ) {
    return this.tekupBillyService.getFinancialReport(dateFrom, dateTo);
  }

  @Post('billy/webhooks')
  @ApiOperation({ summary: 'Handle Billy.dk webhooks' })
  async handleBillyWebhook(@Body() webhookData: any) {
    return this.tekupBillyService.handleWebhook(webhookData);
  }

  // TekupVault Integration Endpoints
  @Post('vault/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Search knowledge base' })
  async searchVault(@Body() searchQuery: any) {
    return this.tekupVaultService.search(searchQuery);
  }

  @Get('vault/faqs')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get FAQs from knowledge base' })
  async getVaultFAQs(@Query('category') category?: string) {
    return this.tekupVaultService.getFAQs(category);
  }

  @Get('vault/procedures')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get procedures from knowledge base' })
  async getVaultProcedures(@Query('category') category?: string) {
    return this.tekupVaultService.getProcedures(category);
  }

  @Post('vault/documents')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create document in knowledge base' })
  async createVaultDocument(@Body() documentData: any) {
    return this.tekupVaultService.createDocument(documentData);
  }

  @Get('vault/training-materials')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get training materials' })
  async getTrainingMaterials() {
    return this.tekupVaultService.getTrainingMaterials();
  }

  @Get('vault/analytics/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get search analytics' })
  async getVaultSearchAnalytics(
    @Query('from') dateFrom: string,
    @Query('to') dateTo: string,
  ) {
    return this.tekupVaultService.getSearchAnalytics(dateFrom, dateTo);
  }

  // renos-calendar-mcp Integration Endpoints
  @Post('calendar/availability/check')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Check availability' })
  async checkCalendarAvailability(@Body() query: any) {
    return this.renosCalendarService.checkAvailability(query);
  }

  @Post('calendar/conflicts/detect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Detect scheduling conflicts' })
  async detectCalendarConflicts(@Body() eventData: any) {
    return this.renosCalendarService.detectConflicts(eventData);
  }

  @Get('calendar/events')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get calendar events' })
  async getCalendarEvents(
    @Query('start') startDate: string,
    @Query('end') endDate: string,
    @Query('teamMemberId') teamMemberId?: string,
  ) {
    return this.renosCalendarService.getEvents(startDate, endDate, teamMemberId);
  }

  @Get('calendar/overtime/alerts')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get overtime alerts' })
  async getOvertimeAlerts(@Request() req) {
    return this.renosCalendarService.getOvertimeAlerts(req.user.organizationId);
  }

  @Get('calendar/customers/:id/memory')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get customer memory' })
  async getCustomerMemory(@Param('id') customerId: string) {
    return this.renosCalendarService.getCustomerMemory(customerId);
  }

  @Post('calendar/schedule/optimize')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get optimal schedule suggestions' })
  async getOptimalSchedule(@Body() scheduleData: any) {
    return this.renosCalendarService.suggestOptimalSchedule(
      scheduleData.jobs,
      scheduleData.teamMembers,
      scheduleData.constraints,
    );
  }

  @Post('calendar/travel/calculate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Calculate travel time' })
  async calculateTravelTime(@Body() travelData: any) {
    return this.renosCalendarService.calculateTravelTime(
      travelData.from,
      travelData.to,
      travelData.mode,
    );
  }

  // Utility endpoints for job integration
  @Post('billy/jobs/:jobId/invoice')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create invoice from job' })
  async createInvoiceFromJob(
    @Param('jobId') jobId: string,
    @Body() jobData: any,
  ) {
    return this.tekupBillyService.createInvoiceFromJob(jobData.job, jobData.customer);
  }

  @Post('calendar/jobs/:jobId/schedule')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule job in calendar' })
  async scheduleJob(
    @Param('jobId') jobId: string,
    @Body() scheduleData: any,
  ) {
    return this.renosCalendarService.scheduleJob(scheduleData.job, scheduleData.teamMemberIds);
  }

  @Post('vault/support/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Search customer support knowledge base' })
  async searchCustomerSupport(@Body('query') query: string) {
    return this.tekupVaultService.searchCustomerSupport(query);
  }

  @Post('vault/procedures/cleaning/search')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Search cleaning procedures' })
  async searchCleaningProcedures(@Body('query') query: string) {
    return this.tekupVaultService.searchCleaningProcedures(query);
  }
}