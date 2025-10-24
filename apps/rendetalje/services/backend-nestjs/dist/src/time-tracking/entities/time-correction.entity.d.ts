import { BaseEntity } from '../../common/entities/base.entity';
export declare class TimeCorrection extends BaseEntity {
    original_entry_id: string;
    original_start_time: string;
    original_end_time?: string;
    original_break_duration: number;
    corrected_start_time: string;
    corrected_end_time?: string;
    corrected_break_duration: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_by: string;
    approved_by?: string;
    approved_at?: string;
    rejected_by?: string;
    rejected_at?: string;
    rejection_reason?: string;
}
