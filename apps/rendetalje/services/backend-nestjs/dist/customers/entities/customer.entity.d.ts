export declare class Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    status: string;
    tags: string[];
    totalLeads: number;
    totalBookings: number;
    totalRevenue: number;
    lastContactAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
