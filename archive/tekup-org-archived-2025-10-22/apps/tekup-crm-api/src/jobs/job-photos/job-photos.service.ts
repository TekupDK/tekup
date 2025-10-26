import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobPhotoDto } from './dto/create-job-photo.dto';
import { PhotoType } from '@prisma/client';

@Injectable()
export class JobPhotosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add photo to job
   */
  async create(tenantId: string, jobId: string, createPhotoDto: CreateJobPhotoDto) {
    const { url, caption, type, uploadedBy } = createPhotoDto;

    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobPhoto.create({
      data: {
        jobId,
        url,
        caption,
        type: type || 'GENERAL',
        uploadedBy,
      },
    });
  }

  /**
   * Get all photos for job
   */
  async getJobPhotos(tenantId: string, jobId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Get photos by type
   */
  async getPhotosByType(tenantId: string, jobId: string, type: PhotoType) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobPhoto.findMany({
      where: { jobId, type },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Update photo
   */
  async update(tenantId: string, jobId: string, photoId: string, updateData: { caption?: string; type?: PhotoType }) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify photo exists and belongs to job
    const photo = await this.prisma.jobPhoto.findFirst({
      where: { id: photoId, jobId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.jobPhoto.update({
      where: { id: photoId },
      data: updateData,
    });
  }

  /**
   * Delete photo
   */
  async remove(tenantId: string, jobId: string, photoId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify photo exists and belongs to job
    const photo = await this.prisma.jobPhoto.findFirst({
      where: { id: photoId, jobId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.jobPhoto.delete({
      where: { id: photoId },
    });
  }

  /**
   * Get photo statistics for job
   */
  async getPhotoStatistics(tenantId: string, jobId: string) {
    // Verify job exists and belongs to tenant
    const job = await this.prisma.cleaningJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const [
      totalPhotos,
      beforePhotos,
      duringPhotos,
      afterPhotos,
      issuePhotos,
      completedPhotos,
    ] = await Promise.all([
      this.prisma.jobPhoto.count({ where: { jobId } }),
      this.prisma.jobPhoto.count({ where: { jobId, type: 'BEFORE' } }),
      this.prisma.jobPhoto.count({ where: { jobId, type: 'DURING' } }),
      this.prisma.jobPhoto.count({ where: { jobId, type: 'AFTER' } }),
      this.prisma.jobPhoto.count({ where: { jobId, type: 'ISSUE' } }),
      this.prisma.jobPhoto.count({ where: { jobId, type: 'COMPLETED' } }),
    ]);

    return {
      totalPhotos,
      byType: {
        before: beforePhotos,
        during: duringPhotos,
        after: afterPhotos,
        issue: issuePhotos,
        completed: completedPhotos,
      },
    };
  }
}
