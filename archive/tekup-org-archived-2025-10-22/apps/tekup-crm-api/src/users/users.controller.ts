import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'User already exists in tenant' })
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(req.user.tenantId, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users for tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll(req.user.tenantId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.usersService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.tenantId, id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.usersService.remove(req.user.tenantId, id);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findByRole(@Request() req, @Param('role') role: UserRole) {
    return this.usersService.findByRole(req.user.tenantId, role);
  }

  @Get('stats/active-count')
  @ApiOperation({ summary: 'Get active users count' })
  @ApiResponse({ status: 200, description: 'Active users count retrieved' })
  async getActiveUsersCount(@Request() req) {
    const count = await this.usersService.getActiveUsersCount(req.user.tenantId);
    return { activeUsersCount: count };
  }
}
