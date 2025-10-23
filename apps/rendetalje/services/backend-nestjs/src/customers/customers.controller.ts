import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CreateMessageDto, 
  CreateReviewDto, 
  CustomerFiltersDto 
} from './dto';
import { Customer } from './entities/customer.entity';
import { CustomerMessage } from './entities/customer-message.entity';
import { CustomerReview } from './entities/customer-review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: Customer })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createCustomerDto: CreateCustomerDto, @Request() req): Promise<Customer> {
    return this.customersService.create(createCustomerDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all customers with filters and pagination' })
  @ApiPaginatedResponse(Customer)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() filters: CustomerFiltersDto,
    @Request() req,
  ): Promise<PaginatedResponseDto<Customer>> {
    return this.customersService.findAllWithFilters(req.user.organizationId, filters);
  }

  @Get('analytics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get customer analytics and insights' })
  @ApiResponse({ status: 200, description: 'Customer analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAnalytics(@Query('timeRange') timeRange: string = '30d', @Request() req) {
    return this.customersService.getCustomerAnalytics(req.user.organizationId, timeRange);
  }

  @Get('satisfaction-metrics')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get customer satisfaction metrics' })
  @ApiResponse({ status: 200, description: 'Satisfaction metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSatisfactionMetrics(@Request() req) {
    return this.customersService.getCustomerSatisfactionMetrics(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Customer> {
    return this.customersService.findById(id, req.user.organizationId);
  }

  @Get(':id/history')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer service history' })
  @ApiResponse({ status: 200, description: 'Customer history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@Param('id') id: string, @Request() req) {
    return this.customersService.getCustomerHistory(id, req.user.organizationId);
  }

  @Get(':id/messages')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer messages' })
  @ApiResponse({ status: 200, description: 'Customer messages retrieved successfully', type: [CustomerMessage] })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMessages(
    @Param('id') id: string,
    @Query('job_id') jobId: string,
    @Request() req,
  ): Promise<CustomerMessage[]> {
    return this.customersService.getCustomerMessages(id, req.user.organizationId, jobId);
  }

  @Post('messages')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Send message to customer' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: CustomerMessage })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req,
  ): Promise<CustomerMessage> {
    return this.customersService.createMessage(
      createMessageDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Patch('messages/:messageId/read')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 204, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async markMessageAsRead(@Param('messageId') messageId: string, @Request() req): Promise<void> {
    return this.customersService.markMessageAsRead(messageId, req.user.organizationId);
  }

  @Get(':id/reviews')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer reviews' })
  @ApiResponse({ status: 200, description: 'Customer reviews retrieved successfully', type: [CustomerReview] })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReviews(@Param('id') id: string, @Request() req): Promise<CustomerReview[]> {
    return this.customersService.getCustomerReviews(id, req.user.organizationId);
  }

  @Post(':id/reviews')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create customer review' })
  @ApiResponse({ status: 201, description: 'Review created successfully', type: CustomerReview })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createReview(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ): Promise<CustomerReview> {
    return this.customersService.createReview(createReviewDto, id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: Customer })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto, req.user.organizationId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate customer' })
  @ApiResponse({ status: 200, description: 'Customer deactivated successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deactivate(@Param('id') id: string, @Request() req): Promise<Customer> {
    return this.customersService.deactivateCustomer(id, req.user.organizationId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate customer' })
  @ApiResponse({ status: 200, description: 'Customer activated successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async activate(@Param('id') id: string, @Request() req): Promise<Customer> {
    return this.customersService.activateCustomer(id, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.customersService.delete(id, req.user.organizationId);
  }
}