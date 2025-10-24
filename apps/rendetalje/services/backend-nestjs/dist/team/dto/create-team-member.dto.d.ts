import { WeeklyAvailability } from '../entities/team-member.entity';
export declare class CreateTeamMemberDto {
    user_id: string;
    employee_id?: string;
    skills: string[];
    hourly_rate?: number;
    availability: WeeklyAvailability;
    hire_date?: string;
}
