import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 403, description: 'Domain or CVR number already exists' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code or phone number' })
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all tenants (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get('my-tenant')
  @ApiOperation({ summary: 'Get current user tenant information' })
  @ApiResponse({ status: 200, description: 'Tenant information retrieved successfully' })
  async getMyTenant(@Request() req) {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Get('my-tenant/statistics')
  @ApiOperation({ summary: 'Get current tenant statistics' })
  @ApiResponse({ status: 200, description: 'Tenant statistics retrieved successfully' })
  async getMyTenantStatistics(@Request() req) {
    return this.tenantsService.getStatistics(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Domain or CVR number already exists' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code or phone number' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() req,
  ) {
    // Check if user can update this tenant
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.tenantId !== id) {
      throw new ForbiddenException('You can only update your own tenant');
    }

    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  @Get('domain/:domain')
  @ApiOperation({ summary: 'Get tenant by domain' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findByDomain(@Param('domain') domain: string) {
    return this.tenantsService.findByDomain(domain);
  }
}
