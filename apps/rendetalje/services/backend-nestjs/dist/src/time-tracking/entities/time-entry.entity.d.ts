import { BaseEntity } from '../../common/entities/base.entity';
export declare class TimeEntry extends BaseEntity {
    job_id?: string;
    team_member_id: string;
    start_time: string;
    end_time?: string;
    break_duration: number;
    notes?: string;
}
