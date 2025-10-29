import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  MemoriesService,
  CreateMemoryDto,
  UpdateMemoryDto,
  MemoryFilters,
} from './memories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('memories')
@Controller('memories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new memory' })
  @ApiResponse({ status: 201, description: 'Memory created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMemoryDto,
  ) {
    return this.memoriesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all memories for current user' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'minPriority', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Memories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('minPriority') minPriority?: string,
  ) {
    const filters: MemoryFilters = {
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      minPriority: minPriority ? parseInt(minPriority, 10) : undefined,
    };

    return this.memoriesService.findAll(userId, filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active memories for AI context' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of memories to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Active memories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveForContext(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 25;
    return this.memoriesService.getActiveForContext(userId, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get memory statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser('userId') userId: string) {
    return this.memoriesService.getStats(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search memories' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async search(
    @CurrentUser('userId') userId: string,
    @Query('q') query: string,
  ) {
    return this.memoriesService.search(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific memory' })
  @ApiResponse({ status: 200, description: 'Memory retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.memoriesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a memory' })
  @ApiResponse({ status: 200, description: 'Memory updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemoryDto,
  ) {
    return this.memoriesService.update(userId, id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive (deactivate) a memory' })
  @ApiResponse({ status: 200, description: 'Memory archived successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async archive(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.memoriesService.archive(userId, id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore (activate) a memory' })
  @ApiResponse({ status: 200, description: 'Memory restored successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async restore(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.memoriesService.restore(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a memory' })
  @ApiResponse({ status: 200, description: 'Memory deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Memory not found' })
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.memoriesService.delete(userId, id);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import memories' })
  @ApiResponse({ status: 201, description: 'Memories imported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkImport(
    @CurrentUser('userId') userId: string,
    @Body() memories: CreateMemoryDto[],
  ) {
    return this.memoriesService.bulkImport(userId, memories);
  }

  @Post('cleanup-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up expired memories (admin/cron)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupExpired() {
    return this.memoriesService.cleanupExpired();
  }
}
