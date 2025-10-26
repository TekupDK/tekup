import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomerLocationsService } from './customer-locations.service';
import { CreateCustomerLocationDto } from './dto/create-customer-location.dto';
import { UpdateCustomerLocationDto } from './dto/update-customer-location.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CleaningType, VisitFrequency } from '@prisma/client';

@ApiTags('Customer Locations')
@Controller('customers/:customerId/locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerLocationsController {
  constructor(private readonly locationsService: CustomerLocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body() createLocationDto: CreateCustomerLocationDto,
  ) {
    return this.locationsService.create(req.user.tenantId, customerId, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations for customer' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findAll(@Request() req, @Param('customerId') customerId: string) {
    return this.locationsService.findAll(req.user.tenantId, customerId);
  }

  @Get('cleaning-type/:cleaningType')
  @ApiOperation({ summary: 'Get locations by cleaning type' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByCleaningType(
    @Request() req,
    @Param('customerId') customerId: string,
    @Param('cleaningType') cleaningType: CleaningType,
  ) {
    return this.locationsService.findByCleaningType(req.user.tenantId, customerId, cleaningType);
  }

  @Get('visit-frequency/:visitFrequency')
  @ApiOperation({ summary: 'Get locations by visit frequency' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByVisitFrequency(
    @Request() req,
    @Param('customerId') customerId: string,
    @Param('visitFrequency') visitFrequency: VisitFrequency,
  ) {
    return this.locationsService.findByVisitFrequency(req.user.tenantId, customerId, visitFrequency);
  }

  @Get('stats/active-count')
  @ApiOperation({ summary: 'Get active locations count for customer' })
  @ApiResponse({ status: 200, description: 'Active locations count retrieved' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getActiveLocationsCount(@Request() req, @Param('customerId') customerId: string) {
    const count = await this.locationsService.getActiveLocationsCount(req.user.tenantId, customerId);
    return { activeLocationsCount: count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(
    @Request() req,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    return this.locationsService.findOne(req.user.tenantId, customerId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code' })
  async update(
    @Request() req,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateCustomerLocationDto,
  ) {
    return this.locationsService.update(req.user.tenantId, customerId, id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location (soft delete)' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(
    @Request() req,
    @Param('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    return this.locationsService.remove(req.user.tenantId, customerId, id);
  }
}
