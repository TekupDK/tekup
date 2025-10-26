import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { TekUpAuthGuard, CurrentUser, TenantContext } from '@tekup/sso'; // TODO: Fix @tekup/sso package
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CRMCVRIntegrationService } from '../danish/cvr-integration.service';
import { GDPRComplianceService } from '../danish/gdpr-compliance.service';
import { DanishBillingIntegrationService } from '../danish/billing-integration.service';
import { JwtAuthGuard } from '@tekup/auth';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
// @UseGuards(TekUpAuthGuard) // TODO: Fix @tekup/sso package
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly cvrIntegration: CRMCVRIntegrationService,
    private readonly gdprService: GDPRComplianceService,
    private readonly billingService: DanishBillingIntegrationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create company with optional CVR validation' })
  @ApiResponse({ status: 201, description: 'Company created successfully.' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    // @CurrentUser() user: TenantContext, // TODO: Fix @tekup/sso package
  ) {
    // Validate Danish company if CVR provided
    if (createCompanyDto.cvr) {
      const validation = await this.cvrIntegration.validateDanishCompany(createCompanyDto);
      if (!validation.isValid) {
        throw new Error(`CVR validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies for tenant' })
  findAll(/* @CurrentUser() user: TenantContext */ @Query('tenantId') tenantId: string) {
    return this.companiesService.findAll(tenantId /* user.tenantId */);
  }

  @Get('cvr-search')
  @ApiOperation({ summary: 'Search Danish companies by name for CVR suggestions' })
  async searchCVR(@Query('name') name: string) {
    return this.cvrIntegration.suggestCVRMatches(name);
  }

  @Get('gdpr-report')
  @ApiOperation({ summary: 'Generate GDPR compliance report' })
  async getGDPRReport(/* @CurrentUser() user: TenantContext */ @Query('tenantId') tenantId: string) {
    return this.gdprService.generateComplianceReport(tenantId /* user.tenantId */);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  findOne(@Param('id') id: string, /* @CurrentUser() user: TenantContext */ @Query('tenantId') tenantId: string) {
    return this.companiesService.findOne(id, tenantId /* user.tenantId */);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    // @CurrentUser() user: TenantContext, // TODO: Fix @tekup/sso package
    @Query('tenantId') tenantId: string,
  ) {
    return this.companiesService.update(id, tenantId /* user.tenantId */, updateCompanyDto);
  }

  @Post(':id/enrich-cvr')
  @ApiOperation({ summary: 'Enrich company data with CVR information' })
  async enrichWithCVR(
    @Param('id') id: string,
    @Body('cvr') cvr: string,
    // @CurrentUser() user: TenantContext, // TODO: Fix @tekup/sso package
  ) {
    await this.cvrIntegration.enrichCompanyWithCVR(id, cvr);
    return { message: 'Company enriched with CVR data successfully' };
  }

  @Post(':id/create-invoice')
  @ApiOperation({ summary: 'Create Danish invoice via Billy integration' })
  async createInvoice(
    @Param('id') id: string,
    @Body('dealId') dealId: string,
  ) {
    return this.billingService.createBillyInvoice(dealId);
  }

  @Post('bulk-cvr-refresh')
  @ApiOperation({ summary: 'Bulk refresh CVR data for all Danish companies' })
  async bulkRefreshCVR(/* @CurrentUser() user: TenantContext */ @Query('tenantId') tenantId: string) {
    return this.cvrIntegration.bulkRefreshCVRData(tenantId /* user.tenantId */);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  remove(@Param('id') id: string, /* @CurrentUser() user: TenantContext */ @Query('tenantId') tenantId: string) {
    return this.companiesService.remove(id, tenantId /* user.tenantId */);
  }
}