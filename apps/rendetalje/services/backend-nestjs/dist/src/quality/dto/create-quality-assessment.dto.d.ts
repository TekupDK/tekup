declare class CompletedItemDto {
    id: string;
    completed: boolean;
    photo_urls: string[];
    notes?: string;
    points_earned?: number;
    completion_time?: string;
}
export declare class CreateQualityAssessmentDto {
    job_id: string;
    checklist_id: string;
    completed_items: CompletedItemDto[];
    overall_score: number;
    notes?: string;
}
export {};
