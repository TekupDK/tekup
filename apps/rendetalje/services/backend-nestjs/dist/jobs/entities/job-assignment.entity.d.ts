import { BaseEntity } from '../../common/entities/base.entity';
export declare class JobAssignment extends BaseEntity {
    job_id: string;
    team_member_id: string;
    role: string;
    assigned_at: string;
}
