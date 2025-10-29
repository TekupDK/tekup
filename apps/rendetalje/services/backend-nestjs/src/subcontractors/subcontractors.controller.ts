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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubcontractorsService } from './subcontractors.service';
import {
  CreateSubcontractorDto,
  UpdateSubcontractorDto,
  AssignTaskDto,
  UpdateTaskAssignmentDto,
  CreateReviewDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subcontractors')
@Controller('subcontractors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubcontractorsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new subcontractor profile' })
  @ApiResponse({ status: 201, description: 'Subcontractor created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateSubcontractorDto) {
    return this.subcontractorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subcontractors with optional filters' })
  @ApiResponse({ status: 200, description: 'Subcontractors list retrieved' })
  findAll(
    @Query('status') status?: string,
    @Query('minRating') minRating?: number,
    @Query('search') search?: string
  ) {
    return this.subcontractorsService.findAll({ status, minRating, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subcontractor by ID with full details' })
  @ApiResponse({ status: 200, description: 'Subcontractor found' })
  @ApiResponse({ status: 404, description: 'Subcontractor not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcontractorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subcontractor profile' })
  @ApiResponse({ status: 200, description: 'Subcontractor updated' })
  @ApiResponse({ status: 404, description: 'Subcontractor not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateSubcontractorDto
  ) {
    return this.subcontractorsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate subcontractor (soft delete)' })
  @ApiResponse({ status: 204, description: 'Subcontractor deactivated' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcontractorsService.remove(id);
  }

  @Post('assign-task')
  @ApiOperation({ summary: 'Assign a task/job to a subcontractor' })
  @ApiResponse({ status: 201, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Job or subcontractor not found' })
  assignTask(@Body() dto: AssignTaskDto) {
    return this.subcontractorsService.assignTask(dto);
  }

  @Get('assignments/all')
  @ApiOperation({ summary: 'Get all task assignments with filters' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved' })
  getAssignments(
    @Query('subcontractorId') subcontractorId?: string,
    @Query('status') status?: string
  ) {
    return this.subcontractorsService.getAssignments({ subcontractorId, status });
  }

  @Patch('assignments/:id')
  @ApiOperation({ summary: 'Update task assignment status' })
  @ApiResponse({ status: 200, description: 'Assignment updated' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskAssignmentDto
  ) {
    return this.subcontractorsService.updateAssignment(id, dto);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for a subcontractor' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 404, description: 'Subcontractor not found' })
  createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto
  ) {
    return this.subcontractorsService.createReview(id, dto);
  }
}
