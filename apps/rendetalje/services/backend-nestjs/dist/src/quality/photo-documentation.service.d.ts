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
export declare class PhotoDocumentationService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    uploadPhoto(file: Buffer, filename: string, metadata: PhotoMetadata, organizationId: string): Promise<string>;
    uploadMultiplePhotos(files: {
        buffer: Buffer;
        filename: string;
    }[], metadata: PhotoMetadata, organizationId: string): Promise<string[]>;
    deletePhoto(photoUrl: string, organizationId: string): Promise<void>;
    getJobPhotos(jobId: string, organizationId: string, type?: string): Promise<{
        url: string;
        metadata: any;
    }[]>;
    organizePhotosByDate(organizationId: string, dateFrom: string, dateTo: string): Promise<Record<string, {
        url: string;
        metadata: any;
    }[]>>;
    comparePhotos(beforePhotoUrl: string, afterPhotoUrl: string): Promise<PhotoComparison>;
    generatePhotoReport(jobId: string, organizationId: string): Promise<{
        totalPhotos: number;
        photosByType: Record<string, number>;
        beforeAfterPairs: PhotoComparison[];
        issues: string[];
    }>;
    optimizePhoto(photoBuffer: Buffer): Promise<Buffer>;
    compressPhoto(photoBuffer: Buffer, quality?: number): Promise<Buffer>;
    private getContentType;
    private extractPathFromUrl;
    private extractTypeFromUrl;
}
