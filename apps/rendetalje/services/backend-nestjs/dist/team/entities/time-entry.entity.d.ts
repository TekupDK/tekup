export interface LocationCoordinates {
    lat: number;
    lng: number;
}
export declare class TimeEntry {
    id: string;
    teamMemberId: string;
    leadId?: string;
    bookingId?: string;
    startTime: Date;
    endTime?: Date;
    breakDuration: number;
    notes?: string;
    location?: LocationCoordinates;
    createdAt: Date;
    updatedAt: Date;
}
