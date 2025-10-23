import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PhotoMetadata {
  jobId: string;
  checklistItemId?: string;
  type: 'before' | 'after' | 'during' | 'issue' | 'quality';
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  uploadedBy: string;
  description?: string;
}

export interface PhotoComparison {
  beforePhoto: string;
  afterPhoto: string;
  similarity: number;
  improvements: string[];
  issues: string[];
}

@Injectable()
export class PhotoDocumentationService {
  private readonly logger = new Logger(PhotoDocumentationService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadPhoto(
    file: Buffer,
    filename: string,
    metadata: PhotoMetadata,
    organizationId: string,
  ): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFilename = `${organizationId}/${metadata.jobId}/${metadata.type}/${timestamp}-${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseService.client.storage
        .from('quality-photos')
        .upload(uniqueFilename, file, {
          contentType: this.getContentType(filename),
          metadata: {
            jobId: metadata.jobId,
            type: metadata.type,
            uploadedBy: metadata.uploadedBy,
            timestamp: metadata.timestamp,
          },
        });

      if (error) {
        throw new BadRequestException(`Failed to upload photo: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.client.storage
        .from('quality-photos')
        .getPublicUrl(data.path);

      this.logger.log(`Photo uploaded successfully: ${data.path}`);
      return urlData.publicUrl;

    } catch (error) {
      this.logger.error('Failed to upload photo', error);
      throw error;
    }
  }

  async uploadMultiplePhotos(
    files: { buffer: Buffer; filename: string }[],
    metadata: PhotoMetadata,
    organizationId: string,
  ): Promise<string[]> {
    const uploadPromises = files.map(file =>
      this.uploadPhoto(file.buffer, file.filename, metadata, organizationId)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Failed to upload multiple photos', error);
      throw new BadRequestException('Failed to upload one or more photos');
    }
  }

  async deletePhoto(photoUrl: string, organizationId: string): Promise<void> {
    try {
      // Extract path from URL
      const path = this.extractPathFromUrl(photoUrl);
      
      // Verify the photo belongs to the organization
      if (!path.startsWith(organizationId)) {
        throw new BadRequestException('Unauthorized to delete this photo');
      }

      const { error } = await this.supabaseService.client.storage
        .from('quality-photos')
        .remove([path]);

      if (error) {
        throw new BadRequestException(`Failed to delete photo: ${error.message}`);
      }

      this.logger.log(`Photo deleted successfully: ${path}`);
    } catch (error) {
      this.logger.error('Failed to delete photo', error);
      throw error;
    }
  }

  async getJobPhotos(
    jobId: string,
    organizationId: string,
    type?: string,
  ): Promise<{ url: string; metadata: any }[]> {
    try {
      const { data, error } = await this.supabaseService.client.storage
        .from('quality-photos')
        .list(`${organizationId}/${jobId}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw new BadRequestException(`Failed to get job photos: ${error.message}`);
      }

      let photos = data || [];

      // Filter by type if specified
      if (type) {
        photos = photos.filter(photo => photo.name.includes(`/${type}/`));
      }

      // Get public URLs and metadata
      return photos.map(photo => {
        const { data: urlData } = this.supabaseService.client.storage
          .from('quality-photos')
          .getPublicUrl(`${organizationId}/${jobId}/${photo.name}`);

        return {
          url: urlData.publicUrl,
          metadata: photo.metadata,
        };
      });

    } catch (error) {
      this.logger.error('Failed to get job photos', error);
      throw error;
    }
  }

  async organizePhotosByDate(
    organizationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<Record<string, { url: string; metadata: any }[]>> {
    try {
      const { data, error } = await this.supabaseService.client.storage
        .from('quality-photos')
        .list(organizationId, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw new BadRequestException(`Failed to get photos: ${error.message}`);
      }

      const photos = data || [];
      const organized: Record<string, { url: string; metadata: any }[]> = {};

      photos.forEach(photo => {
        const createdAt = new Date(photo.created_at);
        const from = new Date(dateFrom);
        const to = new Date(dateTo);

        if (createdAt >= from && createdAt <= to) {
          const dateKey = createdAt.toISOString().split('T')[0];
          
          if (!organized[dateKey]) {
            organized[dateKey] = [];
          }

          const { data: urlData } = this.supabaseService.client.storage
            .from('quality-photos')
            .getPublicUrl(`${organizationId}/${photo.name}`);

          organized[dateKey].push({
            url: urlData.publicUrl,
            metadata: photo.metadata,
          });
        }
      });

      return organized;

    } catch (error) {
      this.logger.error('Failed to organize photos by date', error);
      throw error;
    }
  }

  async comparePhotos(beforePhotoUrl: string, afterPhotoUrl: string): Promise<PhotoComparison> {
    // This would integrate with an image comparison service
    // For now, return a mock comparison
    return {
      beforePhoto: beforePhotoUrl,
      afterPhoto: afterPhotoUrl,
      similarity: 0.85,
      improvements: [
        'Floors appear cleaner',
        'Surfaces are dust-free',
        'Better organization of items',
      ],
      issues: [
        'Minor streaks on window',
      ],
    };
  }

  async generatePhotoReport(
    jobId: string,
    organizationId: string,
  ): Promise<{
    totalPhotos: number;
    photosByType: Record<string, number>;
    beforeAfterPairs: PhotoComparison[];
    issues: string[];
  }> {
    try {
      const photos = await this.getJobPhotos(jobId, organizationId);
      
      const photosByType: Record<string, number> = {};
      const beforePhotos: string[] = [];
      const afterPhotos: string[] = [];

      photos.forEach(photo => {
        const type = this.extractTypeFromUrl(photo.url);
        photosByType[type] = (photosByType[type] || 0) + 1;

        if (type === 'before') {
          beforePhotos.push(photo.url);
        } else if (type === 'after') {
          afterPhotos.push(photo.url);
        }
      });

      // Create before/after pairs
      const beforeAfterPairs: PhotoComparison[] = [];
      const minLength = Math.min(beforePhotos.length, afterPhotos.length);
      
      for (let i = 0; i < minLength; i++) {
        const comparison = await this.comparePhotos(beforePhotos[i], afterPhotos[i]);
        beforeAfterPairs.push(comparison);
      }

      // Collect issues from comparisons
      const issues = beforeAfterPairs.flatMap(pair => pair.issues);

      return {
        totalPhotos: photos.length,
        photosByType,
        beforeAfterPairs,
        issues,
      };

    } catch (error) {
      this.logger.error('Failed to generate photo report', error);
      throw error;
    }
  }

  async optimizePhoto(photoBuffer: Buffer): Promise<Buffer> {
    // This would integrate with an image optimization service
    // For now, return the original buffer
    // In production, you might use services like:
    // - Sharp for image processing
    // - Cloudinary for optimization
    // - AWS Lambda for serverless image processing
    
    this.logger.debug('Photo optimization would be applied here');
    return photoBuffer;
  }

  async compressPhoto(photoBuffer: Buffer, quality: number = 80): Promise<Buffer> {
    // This would compress the image
    // For now, return the original buffer
    this.logger.debug(`Photo compression with quality ${quality} would be applied here`);
    return photoBuffer;
  }

  private getContentType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }

  private extractPathFromUrl(url: string): string {
    // Extract the file path from the Supabase storage URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'quality-photos');
    return urlParts.slice(bucketIndex + 1).join('/');
  }

  private extractTypeFromUrl(url: string): string {
    // Extract photo type from URL path
    const path = this.extractPathFromUrl(url);
    const pathParts = path.split('/');
    
    // Assuming structure: organizationId/jobId/type/filename
    if (pathParts.length >= 3) {
      return pathParts[2];
    }
    
    return 'unknown';
  }
}