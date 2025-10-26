// ====================================
// RenOS TypeScript Type Definitions
// Domain: www.renos.dk
// ====================================

// Customer Types
export interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerInput {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

// Lead Types
export interface Lead {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    customerId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface ConvertLeadInput {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    bookingDate?: string;
    bookingDuration?: number;
    bookingService?: string;
}

// Booking Types
export interface Booking {
    id: number;
    customerId: number;
    customerName?: string;
    startTime: string;
    endTime: string;
    duration: number;
    service: string | null;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
}

export interface CreateBookingInput {
    customerId: number;
    startTime: string;
    duration: number;
    service?: string;
    notes?: string;
}

export interface UpdateBookingInput {
    startTime?: string;
    duration?: number;
    service?: string;
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
}

// Email Response Types
export interface EmailResponse {
    id: number;
    threadId: string;
    originalMessage: string;
    generatedResponse: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    status: 'pending' | 'approved' | 'rejected' | 'sent';
    recipientEmail: string;
    createdAt: string;
    approvedAt: string | null;
}

// Dashboard Statistics Types
export interface DashboardStats {
    totalCustomers: number;
    totalLeads: number;
    totalBookings: number;
    revenueThisMonth: number;
    bookingsToday: number;
    activeAgreements: number;
    newLeadsThisWeek: number;
    pendingEmailResponses: number;
    averageBookingDuration: number;
    nextAvailableSlot: string | null;
}

// Calendar Availability Types
export interface AvailabilitySlot {
    date: string;
    startTime: string;
    endTime: string;
    available: boolean;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface ApiError {
    message: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
}

// UI State Types
export type NavSection =
    | 'dashboard'
    | 'customers'
    | 'leads'
    | 'calendar'
    | 'bookings'
    | 'agreements'
    | 'email'
    | 'invoices'
    | 'settings';

export type CalendarView = 'month' | 'week' | 'day';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
