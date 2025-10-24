import { LocationCoordinates } from '../entities/time-entry.entity';
export declare class CreateTimeEntryDto {
    job_id: string;
    team_member_id: string;
    start_time: string;
    end_time?: string;
    break_duration: number;
    notes?: string;
    location?: LocationCoordinates;
}
