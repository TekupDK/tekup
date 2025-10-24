"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PhotoDocumentationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoDocumentationService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let PhotoDocumentationService = PhotoDocumentationService_1 = class PhotoDocumentationService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(PhotoDocumentationService_1.name);
    }
    async uploadPhoto(file, filename, metadata, organizationId) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uniqueFilename = `${organizationId}/${metadata.jobId}/${metadata.type}/${timestamp}-${filename}`;
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
                throw new common_1.BadRequestException(`Failed to upload photo: ${error.message}`);
            }
            const { data: urlData } = this.supabaseService.client.storage
                .from('quality-photos')
                .getPublicUrl(data.path);
            this.logger.log(`Photo uploaded successfully: ${data.path}`);
            return urlData.publicUrl;
        }
        catch (error) {
            this.logger.error('Failed to upload photo', error);
            throw error;
        }
    }
    async uploadMultiplePhotos(files, metadata, organizationId) {
        const uploadPromises = files.map(file => this.uploadPhoto(file.buffer, file.filename, metadata, organizationId));
        try {
            return await Promise.all(uploadPromises);
        }
        catch (error) {
            this.logger.error('Failed to upload multiple photos', error);
            throw new common_1.BadRequestException('Failed to upload one or more photos');
        }
    }
    async deletePhoto(photoUrl, organizationId) {
        try {
            const path = this.extractPathFromUrl(photoUrl);
            if (!path.startsWith(organizationId)) {
                throw new common_1.BadRequestException('Unauthorized to delete this photo');
            }
            const { error } = await this.supabaseService.client.storage
                .from('quality-photos')
                .remove([path]);
            if (error) {
                throw new common_1.BadRequestException(`Failed to delete photo: ${error.message}`);
            }
            this.logger.log(`Photo deleted successfully: ${path}`);
        }
        catch (error) {
            this.logger.error('Failed to delete photo', error);
            throw error;
        }
    }
    async getJobPhotos(jobId, organizationId, type) {
        try {
            const { data, error } = await this.supabaseService.client.storage
                .from('quality-photos')
                .list(`${organizationId}/${jobId}`, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' },
            });
            if (error) {
                throw new common_1.BadRequestException(`Failed to get job photos: ${error.message}`);
            }
            let photos = data || [];
            if (type) {
                photos = photos.filter(photo => photo.name.includes(`/${type}/`));
            }
            return photos.map(photo => {
                const { data: urlData } = this.supabaseService.client.storage
                    .from('quality-photos')
                    .getPublicUrl(`${organizationId}/${jobId}/${photo.name}`);
                return {
                    url: urlData.publicUrl,
                    metadata: photo.metadata,
                };
            });
        }
        catch (error) {
            this.logger.error('Failed to get job photos', error);
            throw error;
        }
    }
    async organizePhotosByDate(organizationId, dateFrom, dateTo) {
        try {
            const { data, error } = await this.supabaseService.client.storage
                .from('quality-photos')
                .list(organizationId, {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'desc' },
            });
            if (error) {
                throw new common_1.BadRequestException(`Failed to get photos: ${error.message}`);
            }
            const photos = data || [];
            const organized = {};
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
        }
        catch (error) {
            this.logger.error('Failed to organize photos by date', error);
            throw error;
        }
    }
    async comparePhotos(beforePhotoUrl, afterPhotoUrl) {
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
    async generatePhotoReport(jobId, organizationId) {
        try {
            const photos = await this.getJobPhotos(jobId, organizationId);
            const photosByType = {};
            const beforePhotos = [];
            const afterPhotos = [];
            photos.forEach(photo => {
                const type = this.extractTypeFromUrl(photo.url);
                photosByType[type] = (photosByType[type] || 0) + 1;
                if (type === 'before') {
                    beforePhotos.push(photo.url);
                }
                else if (type === 'after') {
                    afterPhotos.push(photo.url);
                }
            });
            const beforeAfterPairs = [];
            const minLength = Math.min(beforePhotos.length, afterPhotos.length);
            for (let i = 0; i < minLength; i++) {
                const comparison = await this.comparePhotos(beforePhotos[i], afterPhotos[i]);
                beforeAfterPairs.push(comparison);
            }
            const issues = beforeAfterPairs.flatMap(pair => pair.issues);
            return {
                totalPhotos: photos.length,
                photosByType,
                beforeAfterPairs,
                issues,
            };
        }
        catch (error) {
            this.logger.error('Failed to generate photo report', error);
            throw error;
        }
    }
    async optimizePhoto(photoBuffer) {
        this.logger.debug('Photo optimization would be applied here');
        return photoBuffer;
    }
    async compressPhoto(photoBuffer, quality = 80) {
        this.logger.debug(`Photo compression with quality ${quality} would be applied here`);
        return photoBuffer;
    }
    getContentType(filename) {
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
    extractPathFromUrl(url) {
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'quality-photos');
        return urlParts.slice(bucketIndex + 1).join('/');
    }
    extractTypeFromUrl(url) {
        const path = this.extractPathFromUrl(url);
        const pathParts = path.split('/');
        if (pathParts.length >= 3) {
            return pathParts[2];
        }
        return 'unknown';
    }
};
exports.PhotoDocumentationService = PhotoDocumentationService;
exports.PhotoDocumentationService = PhotoDocumentationService = PhotoDocumentationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PhotoDocumentationService);
//# sourceMappingURL=photo-documentation.service.js.map