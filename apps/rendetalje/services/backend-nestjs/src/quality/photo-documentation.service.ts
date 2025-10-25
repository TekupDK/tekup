import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PhotoDocumentationService {
  private readonly logger = new Logger(PhotoDocumentationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async uploadMultiplePhotos(
    files: { buffer: Buffer; filename: string }[],
    metadata: {
      jobId: string;
      checklistItemId?: string;
      type: 'before' | 'after' | 'during' | 'issue' | 'quality';
      description?: string;
      timestamp: string;
      uploadedBy: string;
    },
  ): Promise<any[]> {
    this.logger.log(`Uploading ${files.length} photos for job: ${metadata.jobId}`);

    // In a real implementation, you would upload to S3, Supabase Storage, etc.
    // For now, we'll simulate by creating database records with placeholder URLs
    const photoRecords = await Promise.all(
      files.map(async (file, index) => {
        const photoUrl = `/uploads/photos/${metadata.jobId}/${Date.now()}_${index}_${file.filename}`;
        const thumbnailUrl = `/uploads/thumbnails/${metadata.jobId}/${Date.now()}_${index}_thumb_${file.filename}`;

        return this.prisma.renosPhotoDocumentation.create({
          data: {
            leadId: metadata.jobId,
            checklistItemId: metadata.checklistItemId,
            type: metadata.type,
            photoUrl,
            thumbnailUrl,
            description: metadata.description,
            uploadedBy: metadata.uploadedBy,
            timestamp: new Date(metadata.timestamp),
            metadata: {
              originalFilename: file.filename,
              size: file.buffer.length,
              uploadTime: metadata.timestamp,
            },
          },
        });
      }),
    );

    this.logger.log(`Uploaded ${photoRecords.length} photos successfully`);
    return photoRecords;
  }

  async getJobPhotos(jobId: string, type?: string): Promise<any[]> {
    const photos = await this.prisma.renosPhotoDocumentation.findMany({
      where: {
        leadId: jobId,
        type: type ? type : undefined,
      },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return photos;
  }

  async deletePhoto(photoUrl: string): Promise<void> {
    this.logger.log(`Deleting photo: ${photoUrl}`);

    const photo = await this.prisma.renosPhotoDocumentation.findFirst({
      where: { photoUrl },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // In real implementation: delete from cloud storage first
    await this.prisma.renosPhotoDocumentation.delete({
      where: { id: photo.id },
    });

    this.logger.log('Photo deleted successfully');
  }

  async comparePhotos(beforePhotoUrl: string, afterPhotoUrl: string): Promise<any> {
    const [beforePhoto, afterPhoto] = await Promise.all([
      this.prisma.renosPhotoDocumentation.findFirst({
        where: { photoUrl: beforePhotoUrl },
      }),
      this.prisma.renosPhotoDocumentation.findFirst({
        where: { photoUrl: afterPhotoUrl },
      }),
    ]);

    if (!beforePhoto || !afterPhoto) {
      throw new NotFoundException('One or both photos not found');
    }

    return {
      before: beforePhoto,
      after: afterPhoto,
      comparison: {
        timeDifference: new Date(afterPhoto.timestamp).getTime() - new Date(beforePhoto.timestamp).getTime(),
        sameLead: beforePhoto.leadId === afterPhoto.leadId,
      },
    };
  }

  async generatePhotoReport(jobId: string): Promise<any> {
    const photos = await this.getJobPhotos(jobId);

    const groupedByType = photos.reduce((acc, photo) => {
      if (!acc[photo.type]) {
        acc[photo.type] = [];
      }
      acc[photo.type].push(photo);
      return acc;
    }, {});

    return {
      jobId,
      totalPhotos: photos.length,
      photosByType: groupedByType,
      timeline: photos.map((p) => ({
        timestamp: p.timestamp,
        type: p.type,
        url: p.photoUrl,
        description: p.description,
      })),
    };
  }

  async organizePhotosByDate(dateFrom: string, dateTo: string): Promise<any> {
    const photos = await this.prisma.renosPhotoDocumentation.findMany({
      where: {
        timestamp: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Group by date
    const photosByDate = photos.reduce((acc, photo) => {
      const date = photo.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(photo);
      return acc;
    }, {});

    return {
      dateRange: { from: dateFrom, to: dateTo },
      totalPhotos: photos.length,
      photosByDate,
    };
  }
}
