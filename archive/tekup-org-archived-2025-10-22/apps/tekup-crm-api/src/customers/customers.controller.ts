import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerSegment } from '@prisma/client';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code or phone number' })
  @ApiResponse({ status: 403, description: 'Customer with email or CVR already exists' })
  async create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(req.user.tenantId, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers for tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'segment', required: false, enum: CustomerSegment, description: 'Filter by customer segment' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('segment') segment?: CustomerSegment,
  ) {
    return this.customersService.findAll(req.user.tenantId, page, limit, segment);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.search(req.user.tenantId, query, page, limit);
  }

  @Get('segment/:segment')
  @ApiOperation({ summary: 'Get customers by segment' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findBySegment(@Request() req, @Param('segment') segment: CustomerSegment) {
    return this.customersService.findBySegment(req.user.tenantId, segment);
  }

  @Get('stats/active-count')
  @ApiOperation({ summary: 'Get active customers count' })
  @ApiResponse({ status: 200, description: 'Active customers count retrieved' })
  async getActiveCustomersCount(@Request() req) {
    const count = await this.customersService.getActiveCustomersCount(req.user.tenantId);
    return { activeCustomersCount: count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.customersService.findOne(req.user.tenantId, id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Customer statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getStatistics(@Request() req, @Param('id') id: string) {
    return this.customersService.getStatistics(req.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Invalid Danish postal code or phone number' })
  @ApiResponse({ status: 403, description: 'Customer with email or CVR already exists' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user.tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer (soft delete)' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.customersService.remove(req.user.tenantId, id);
  }
}
