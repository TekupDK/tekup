import { WeeklyAvailability } from '../entities/team-member.entity';
export declare class CreateTeamMemberDto {
    userId: string;
    employeeId?: string;
    skills: string[];
    hourlyRate?: number;
    availability: WeeklyAvailability;
    hireDate?: string;
}
