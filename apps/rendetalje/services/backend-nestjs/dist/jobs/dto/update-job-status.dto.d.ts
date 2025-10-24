import { JobStatus, Profitability } from '../entities/job.entity';
export declare class UpdateJobStatusDto {
    status: JobStatus;
    actual_duration?: number;
    quality_score?: number;
    customer_signature?: string;
    profitability?: Profitability;
}
