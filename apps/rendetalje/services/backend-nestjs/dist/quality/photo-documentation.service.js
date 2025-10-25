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
const prisma_service_1 = require("../database/prisma.service");
let PhotoDocumentationService = PhotoDocumentationService_1 = class PhotoDocumentationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PhotoDocumentationService_1.name);
    }
    async uploadMultiplePhotos(files, metadata) {
        this.logger.log(`Uploading ${files.length} photos for job: ${metadata.jobId}`);
        const photoRecords = await Promise.all(files.map(async (file, index) => {
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
        }));
        this.logger.log(`Uploaded ${photoRecords.length} photos successfully`);
        return photoRecords;
    }
    async getJobPhotos(jobId, type) {
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
    async deletePhoto(photoUrl) {
        this.logger.log(`Deleting photo: ${photoUrl}`);
        const photo = await this.prisma.renosPhotoDocumentation.findFirst({
            where: { photoUrl },
        });
        if (!photo) {
            throw new common_1.NotFoundException('Photo not found');
        }
        await this.prisma.renosPhotoDocumentation.delete({
            where: { id: photo.id },
        });
        this.logger.log('Photo deleted successfully');
    }
    async comparePhotos(beforePhotoUrl, afterPhotoUrl) {
        const [beforePhoto, afterPhoto] = await Promise.all([
            this.prisma.renosPhotoDocumentation.findFirst({
                where: { photoUrl: beforePhotoUrl },
            }),
            this.prisma.renosPhotoDocumentation.findFirst({
                where: { photoUrl: afterPhotoUrl },
            }),
        ]);
        if (!beforePhoto || !afterPhoto) {
            throw new common_1.NotFoundException('One or both photos not found');
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
    async generatePhotoReport(jobId) {
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
    async organizePhotosByDate(dateFrom, dateTo) {
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
};
exports.PhotoDocumentationService = PhotoDocumentationService;
exports.PhotoDocumentationService = PhotoDocumentationService = PhotoDocumentationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PhotoDocumentationService);
//# sourceMappingURL=photo-documentation.service.js.map