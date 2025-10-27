// Core data types for RenOS Time & Revenue Tracker

export interface Job {
  id: string;
  calendarEventId: string;
  date: string;
  customerName: string;
  team: 'Jonas+Rawan' | 'FB' | 'Mixed';
  hoursWorked: number;
  revenue: number;
  cost: number;
  profit: number;
  jobType: 'Fast' | 'Flyt' | 'Hoved' | 'Post-reno';
  status: 'planned' | 'completed' | 'invoiced' | 'paid';
  invoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FBSettlement {
  id: string;
  month: string;
  totalHours: number;
  hourlyRate: number; // 90 kr/hour
  totalAmount: number;
  paid: boolean;
  paidAt?: string;
  jobs: Job[];
  createdAt: string;
}

export interface MonthlyStats {
  month: string;
  totalHours: number;
  fbHours: number;
  ownHours: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgHourlyRate: number;
  jobs: Job[];
  fbSettlement?: FBSettlement;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface ParsedEvent {
  customer: string;
  team: 'Jonas+Rawan' | 'FB' | 'Mixed';
  hours: number;
  price: number;
  type: string;
  notes?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface DashboardStats {
  totalJobs: number;
  totalHours: number;
  totalRevenue: number;
  totalProfit: number;
  avgHourlyRate: number;
  fbHours: number;
  fbCost: number;
  ownHours: number;
  completionRate: number;
}

export type JobStatus = 'planned' | 'completed' | 'invoiced' | 'paid';
export type JobType = 'Fast' | 'Flyt' | 'Hoved' | 'Post-reno';
export type TeamType = 'Jonas+Rawan' | 'FB' | 'Mixed';