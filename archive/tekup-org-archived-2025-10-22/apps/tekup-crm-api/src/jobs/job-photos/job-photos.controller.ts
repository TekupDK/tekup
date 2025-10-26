import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobPhotosService } from './job-photos.service';
import { CreateJobPhotoDto } from './dto/create-job-photo.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PhotoType } from '@prisma/client';

@ApiTags('Job Photos')
@Controller('jobs/:jobId/photos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobPhotosController {
  constructor(private readonly jobPhotosService: JobPhotosService) {}

  @Post()
  @ApiOperation({ summary: 'Add photo to job' })
  @ApiResponse({ status: 201, description: 'Photo added successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async create(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() createPhotoDto: CreateJobPhotoDto,
  ) {
    return this.jobPhotosService.create(req.user.tenantId, jobId, createPhotoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all photos for job' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobPhotos(@Request() req, @Param('jobId') jobId: string) {
    return this.jobPhotosService.getJobPhotos(req.user.tenantId, jobId);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get photos by type' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getPhotosByType(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('type') type: PhotoType,
  ) {
    return this.jobPhotosService.getPhotosByType(req.user.tenantId, jobId, type);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get photo statistics for job' })
  @ApiResponse({ status: 200, description: 'Photo statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getPhotoStatistics(@Request() req, @Param('jobId') jobId: string) {
    return this.jobPhotosService.getPhotoStatistics(req.user.tenantId, jobId);
  }

  @Patch(':photoId')
  @ApiOperation({ summary: 'Update photo' })
  @ApiResponse({ status: 200, description: 'Photo updated successfully' })
  @ApiResponse({ status: 404, description: 'Job or photo not found' })
  async update(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('photoId') photoId: string,
    @Body() body: { caption?: string; type?: PhotoType },
  ) {
    return this.jobPhotosService.update(req.user.tenantId, jobId, photoId, body);
  }

  @Delete(':photoId')
  @ApiOperation({ summary: 'Delete photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job or photo not found' })
  async remove(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.jobPhotosService.remove(req.user.tenantId, jobId, photoId);
  }
}
