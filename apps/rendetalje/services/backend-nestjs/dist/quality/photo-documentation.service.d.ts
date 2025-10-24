import { PrismaService } from '../database/prisma.service';
export declare class PhotoDocumentationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    uploadMultiplePhotos(files: {
        buffer: Buffer;
        filename: string;
    }[], metadata: {
        jobId: string;
        checklistItemId?: string;
        type: 'before' | 'after' | 'during' | 'issue' | 'quality';
        description?: string;
        timestamp: string;
        uploadedBy: string;
    }): Promise<any[]>;
    getJobPhotos(jobId: string, type?: string): Promise<any[]>;
    deletePhoto(photoUrl: string): Promise<void>;
    comparePhotos(beforePhotoUrl: string, afterPhotoUrl: string): Promise<any>;
    generatePhotoReport(jobId: string): Promise<any>;
    organizePhotosByDate(dateFrom: string, dateTo: string): Promise<any>;
}
