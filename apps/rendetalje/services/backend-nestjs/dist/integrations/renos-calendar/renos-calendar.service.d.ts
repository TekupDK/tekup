import { ConfigService } from '@nestjs/config';
import { IntegrationService } from '../integration.service';
export interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    type: 'job' | 'meeting' | 'break' | 'training' | 'maintenance';
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    metadata?: Record<string, any>;
}
export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
    conflictReason?: string;
}
export interface AvailabilityQuery {
    startDate: string;
    endDate: string;
    duration: number;
    teamMemberIds?: string[];
    serviceType?: string;
    location?: {
        lat: number;
        lng: number;
    };
}
export interface ConflictDetection {
    hasConflict: boolean;
    conflicts: {
        type: 'scheduling' | 'travel' | 'overtime' | 'availability';
        message: string;
        severity: 'low' | 'medium' | 'high';
        suggestion?: string;
    }[];
}
export interface CustomerMemory {
    customerId: string;
    preferences: {
        preferredTimes: string[];
        avoidTimes: string[];
        specialInstructions: string[];
        communicationPreferences: string[];
    };
    history: {
        lastJobDate?: string;
        totalJobs: number;
        averageRating: number;
        commonIssues: string[];
        preferredTeamMembers: string[];
    };
    patterns: {
        bookingFrequency: string;
        seasonalPreferences: Record<string, any>;
        timePatterns: Record<string, number>;
    };
}
export interface OvertimeAlert {
    teamMemberId: string;
    currentHours: number;
    projectedHours: number;
    threshold: number;
    severity: 'warning' | 'critical';
    recommendation: string;
}
export declare class RenosCalendarService {
    private readonly integrationService;
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(integrationService: IntegrationService, configService: ConfigService);
    createEvent(eventData: CalendarEvent): Promise<CalendarEvent>;
    updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent>;
    deleteEvent(eventId: string): Promise<void>;
    getEvents(startDate: string, endDate: string, teamMemberId?: string): Promise<CalendarEvent[]>;
    checkAvailability(query: AvailabilityQuery): Promise<TimeSlot[]>;
    detectConflicts(eventData: CalendarEvent): Promise<ConflictDetection>;
    resolveConflicts(eventData: CalendarEvent, preferences?: any): Promise<CalendarEvent[]>;
    trackOvertime(teamMemberId: string, weekStartDate: string): Promise<OvertimeAlert | null>;
    getOvertimeAlerts(organizationId: string): Promise<OvertimeAlert[]>;
    setOvertimeThreshold(teamMemberId: string, weeklyHours: number): Promise<void>;
    getCustomerMemory(customerId: string): Promise<CustomerMemory>;
    updateCustomerMemory(customerId: string, memoryData: Partial<CustomerMemory>): Promise<CustomerMemory>;
    analyzeCustomerPatterns(customerId: string): Promise<any>;
    syncWithGoogleCalendar(teamMemberId: string, googleCalendarId: string): Promise<void>;
    syncWithOutlook(teamMemberId: string, outlookCalendarId: string): Promise<void>;
    suggestOptimalSchedule(jobs: any[], teamMembers: any[], constraints?: any): Promise<any>;
    calculateTravelTime(fromLocation: {
        lat: number;
        lng: number;
    }, toLocation: {
        lat: number;
        lng: number;
    }, travelMode?: 'driving' | 'walking' | 'transit'): Promise<{
        duration: number;
        distance: number;
    }>;
    scheduleJob(jobData: any, teamMemberIds: string[]): Promise<CalendarEvent>;
    rescheduleJob(jobId: string, newDateTime: string, duration: number): Promise<CalendarEvent>;
    getTeamSchedule(teamMemberId: string, date: string): Promise<CalendarEvent[]>;
    private calculateEndTime;
    private formatAddress;
    healthCheck(): Promise<boolean>;
}
