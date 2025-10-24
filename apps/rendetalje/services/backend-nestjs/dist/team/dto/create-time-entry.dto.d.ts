import { LocationCoordinates } from '../entities/time-entry.entity';
export declare class CreateTimeEntryDto {
    teamMemberId: string;
    leadId?: string;
    bookingId?: string;
    startTime: string;
    endTime?: string;
    breakDuration: number;
    notes?: string;
    location?: LocationCoordinates;
}
