export declare class CreateLeadDto {
    sessionId?: string;
    customerId?: string;
    source?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    squareMeters?: number;
    rooms?: number;
    taskType?: string;
    preferredDates?: string[];
    idempotencyKey?: string;
}
