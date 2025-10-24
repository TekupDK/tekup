import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerFiltersDto 
} from './dto';
import { Customer } from './entities/customer.entity';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Customers')
@Controller('api/v1/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: Customer })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with filters and pagination' })
  @ApiPaginatedResponse(Customer)
  async findAll(@Query() filters: CustomerFiltersDto): Promise<PaginatedResponseDto<Customer>> {
    return this.customersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer found', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
