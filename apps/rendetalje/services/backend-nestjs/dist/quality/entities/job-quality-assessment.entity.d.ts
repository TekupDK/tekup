export interface CompletedChecklistItem {
    id: string;
    completed: boolean;
    photo_urls: string[];
    notes?: string;
    points_earned?: number;
    completion_time?: string;
}
export declare class JobQualityAssessment {
    id: string;
    job_id: string;
    checklist_id: string;
    assessed_by: string;
    completed_items: CompletedChecklistItem[];
    overall_score: number;
    percentage_score: number;
    total_points_earned: number;
    max_possible_points: number;
    notes?: string;
    status: 'in_progress' | 'completed' | 'reviewed';
    created_at: Date;
    updated_at: Date;
}
