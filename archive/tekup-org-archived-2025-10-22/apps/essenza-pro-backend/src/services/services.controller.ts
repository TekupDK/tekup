import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { ServicesService, CreateServiceDto, UpdateServiceDto } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new beauty service' })
  async createService(
    @Body() data: CreateServiceDto,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.createService(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all beauty services' })
  async getServices(
    @Query('salonId') salonId?: string,
    @Query('category') category?: string,
    @CurrentTenant() tenant?: any
  ) {
    if (category) {
      return this.servicesService.getServicesByCategory(category, salonId);
    }
    return this.servicesService.getServices(salonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID with staff assignments' })
  async getServiceById(
    @Param('id') id: string,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.getServiceById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update beauty service' })
  async updateService(
    @Param('id') id: string,
    @Body() data: UpdateServiceDto,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.updateService(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete beauty service' })
  async deleteService(
    @Param('id') id: string,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.deleteService(id);
  }

  @Post(':serviceId/staff/:staffId')
  @ApiOperation({ summary: 'Assign staff member to service' })
  async assignStaffToService(
    @Param('serviceId') serviceId: string,
    @Param('staffId') staffId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.assignStaffToService(serviceId, staffId);
  }

  @Delete(':serviceId/staff/:staffId')
  @ApiOperation({ summary: 'Remove staff member from service' })
  async removeStaffFromService(
    @Param('serviceId') serviceId: string,
    @Param('staffId') staffId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.servicesService.removeStaffFromService(serviceId, staffId);
  }
}
