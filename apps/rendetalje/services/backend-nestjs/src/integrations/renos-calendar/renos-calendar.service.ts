import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationService, IntegrationConfig } from '../integration.service';

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
  duration: number; // in minutes
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

@Injectable()
export class RenosCalendarService {
  private readonly logger = new Logger(RenosCalendarService.name);
  private readonly config: IntegrationConfig;

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('integrations.renosCalendar.url'),
      apiKey: this.configService.get<string>('integrations.renosCalendar.apiKey'),
      timeout: 30000,
      retries: 2,
    };

    if (!this.config.baseUrl || !this.config.apiKey) {
      this.logger.warn('renos-calendar-mcp integration not configured properly');
    }
  }

  // Calendar Event Management
  async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    try {
      this.logger.debug('Creating calendar event', { title: eventData.title });
      
      const response = await this.integrationService.post<CalendarEvent>(
        'renos-calendar',
        this.config,
        '/events',
        eventData,
      );

      this.logger.log(`Calendar event created: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create calendar event', error);
      throw new BadRequestException(`Failed to create calendar event: ${error.message}`);
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      this.logger.debug('Updating calendar event', { eventId });
      
      const response = await this.integrationService.put<CalendarEvent>(
        'renos-calendar',
        this.config,
        `/events/${eventId}`,
        eventData,
      );

      this.logger.log(`Calendar event updated: ${eventId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to update calendar event', error);
      throw new BadRequestException(`Failed to update calendar event: ${error.message}`);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.integrationService.delete(
        'renos-calendar',
        this.config,
        `/events/${eventId}`,
      );

      this.logger.log(`Calendar event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to delete calendar event', error);
      throw new BadRequestException(`Failed to delete calendar event: ${error.message}`);
    }
  }

  async getEvents(startDate: string, endDate: string, teamMemberId?: string): Promise<CalendarEvent[]> {
    try {
      let endpoint = `/events?start=${startDate}&end=${endDate}`;
      if (teamMemberId) {
        endpoint += `&teamMemberId=${teamMemberId}`;
      }

      const response = await this.integrationService.get<CalendarEvent[]>(
        'renos-calendar',
        this.config,
        endpoint,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get calendar events', error);
      throw new BadRequestException(`Failed to get calendar events: ${error.message}`);
    }
  }

  // Availability and Conflict Detection
  async checkAvailability(query: AvailabilityQuery): Promise<TimeSlot[]> {
    try {
      this.logger.debug('Checking availability', { 
        startDate: query.startDate, 
        endDate: query.endDate,
        duration: query.duration 
      });
      
      const response = await this.integrationService.post<TimeSlot[]>(
        'renos-calendar',
        this.config,
        '/availability/check',
        query,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to check availability', error);
      throw new BadRequestException(`Failed to check availability: ${error.message}`);
    }
  }

  async detectConflicts(eventData: CalendarEvent): Promise<ConflictDetection> {
    try {
      this.logger.debug('Detecting conflicts for event', { title: eventData.title });
      
      const response = await this.integrationService.post<ConflictDetection>(
        'renos-calendar',
        this.config,
        '/conflicts/detect',
        eventData,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to detect conflicts', error);
      throw new BadRequestException(`Failed to detect conflicts: ${error.message}`);
    }
  }

  async resolveConflicts(eventData: CalendarEvent, preferences: any = {}): Promise<CalendarEvent[]> {
    try {
      this.logger.debug('Resolving conflicts for event', { title: eventData.title });
      
      const response = await this.integrationService.post<CalendarEvent[]>(
        'renos-calendar',
        this.config,
        '/conflicts/resolve',
        { event: eventData, preferences },
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to resolve conflicts', error);
      throw new BadRequestException(`Failed to resolve conflicts: ${error.message}`);
    }
  }

  // Overtime Tracking and Alerts
  async trackOvertime(teamMemberId: string, weekStartDate: string): Promise<OvertimeAlert | null> {
    try {
      const response = await this.integrationService.get<OvertimeAlert | null>(
        'renos-calendar',
        this.config,
        `/overtime/track?teamMemberId=${teamMemberId}&weekStart=${weekStartDate}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to track overtime', error);
      throw new BadRequestException(`Failed to track overtime: ${error.message}`);
    }
  }

  async getOvertimeAlerts(organizationId: string): Promise<OvertimeAlert[]> {
    try {
      const response = await this.integrationService.get<OvertimeAlert[]>(
        'renos-calendar',
        this.config,
        `/overtime/alerts?organizationId=${organizationId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get overtime alerts', error);
      throw new BadRequestException(`Failed to get overtime alerts: ${error.message}`);
    }
  }

  async setOvertimeThreshold(teamMemberId: string, weeklyHours: number): Promise<void> {
    try {
      await this.integrationService.post(
        'renos-calendar',
        this.config,
        '/overtime/threshold',
        { teamMemberId, weeklyHours },
      );

      this.logger.log(`Overtime threshold set for team member: ${teamMemberId}`);
    } catch (error) {
      this.logger.error('Failed to set overtime threshold', error);
      throw new BadRequestException(`Failed to set overtime threshold: ${error.message}`);
    }
  }

  // Customer Memory Bank
  async getCustomerMemory(customerId: string): Promise<CustomerMemory> {
    try {
      const response = await this.integrationService.get<CustomerMemory>(
        'renos-calendar',
        this.config,
        `/customers/${customerId}/memory`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get customer memory', error);
      throw new BadRequestException(`Failed to get customer memory: ${error.message}`);
    }
  }

  async updateCustomerMemory(customerId: string, memoryData: Partial<CustomerMemory>): Promise<CustomerMemory> {
    try {
      this.logger.debug('Updating customer memory', { customerId });
      
      const response = await this.integrationService.put<CustomerMemory>(
        'renos-calendar',
        this.config,
        `/customers/${customerId}/memory`,
        memoryData,
      );

      this.logger.log(`Customer memory updated: ${customerId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to update customer memory', error);
      throw new BadRequestException(`Failed to update customer memory: ${error.message}`);
    }
  }

  async analyzeCustomerPatterns(customerId: string): Promise<any> {
    try {
      const response = await this.integrationService.get(
        'renos-calendar',
        this.config,
        `/customers/${customerId}/patterns`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to analyze customer patterns', error);
      throw new BadRequestException(`Failed to analyze customer patterns: ${error.message}`);
    }
  }

  // Calendar Synchronization
  async syncWithGoogleCalendar(teamMemberId: string, googleCalendarId: string): Promise<void> {
    try {
      await this.integrationService.post(
        'renos-calendar',
        this.config,
        '/sync/google',
        { teamMemberId, googleCalendarId },
      );

      this.logger.log(`Google Calendar sync enabled for team member: ${teamMemberId}`);
    } catch (error) {
      this.logger.error('Failed to sync with Google Calendar', error);
      throw new BadRequestException(`Failed to sync with Google Calendar: ${error.message}`);
    }
  }

  async syncWithOutlook(teamMemberId: string, outlookCalendarId: string): Promise<void> {
    try {
      await this.integrationService.post(
        'renos-calendar',
        this.config,
        '/sync/outlook',
        { teamMemberId, outlookCalendarId },
      );

      this.logger.log(`Outlook Calendar sync enabled for team member: ${teamMemberId}`);
    } catch (error) {
      this.logger.error('Failed to sync with Outlook Calendar', error);
      throw new BadRequestException(`Failed to sync with Outlook Calendar: ${error.message}`);
    }
  }

  // Intelligent Scheduling
  async suggestOptimalSchedule(
    jobs: any[], 
    teamMembers: any[], 
    constraints: any = {}
  ): Promise<any> {
    try {
      this.logger.debug('Requesting optimal schedule suggestion', { 
        jobCount: jobs.length, 
        teamMemberCount: teamMembers.length 
      });
      
      const response = await this.integrationService.post(
        'renos-calendar',
        this.config,
        '/schedule/optimize',
        { jobs, teamMembers, constraints },
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to suggest optimal schedule', error);
      throw new BadRequestException(`Failed to suggest optimal schedule: ${error.message}`);
    }
  }

  async calculateTravelTime(
    fromLocation: { lat: number; lng: number },
    toLocation: { lat: number; lng: number },
    travelMode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<{ duration: number; distance: number }> {
    try {
      const response = await this.integrationService.post<{ duration: number; distance: number }>(
        'renos-calendar',
        this.config,
        '/travel/calculate',
        { from: fromLocation, to: toLocation, mode: travelMode },
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to calculate travel time', error);
      throw new BadRequestException(`Failed to calculate travel time: ${error.message}`);
    }
  }

  // Utility methods for RendetaljeOS integration
  async scheduleJob(jobData: any, teamMemberIds: string[]): Promise<CalendarEvent> {
    // Check for conflicts first
    const eventData: CalendarEvent = {
      title: `${jobData.service_type} - ${jobData.job_number}`,
      description: jobData.special_instructions,
      startTime: jobData.scheduled_date,
      endTime: this.calculateEndTime(jobData.scheduled_date, jobData.estimated_duration),
      location: this.formatAddress(jobData.location),
      attendees: teamMemberIds,
      type: 'job',
      status: 'scheduled',
      metadata: {
        jobId: jobData.id,
        customerId: jobData.customer_id,
        serviceType: jobData.service_type,
      },
    };

    const conflicts = await this.detectConflicts(eventData);
    
    if (conflicts.hasConflict) {
      const highSeverityConflicts = conflicts.conflicts.filter(c => c.severity === 'high');
      if (highSeverityConflicts.length > 0) {
        throw new BadRequestException(`Cannot schedule job due to conflicts: ${highSeverityConflicts.map(c => c.message).join(', ')}`);
      }
    }

    return this.createEvent(eventData);
  }

  async rescheduleJob(jobId: string, newDateTime: string, duration: number): Promise<CalendarEvent> {
    // Find existing event
    const events = await this.getEvents(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    );

    const existingEvent = events.find(e => e.metadata?.jobId === jobId);
    if (!existingEvent) {
      throw new BadRequestException('Job event not found in calendar');
    }

    // Update the event
    return this.updateEvent(existingEvent.id!, {
      startTime: newDateTime,
      endTime: this.calculateEndTime(newDateTime, duration),
    });
  }

  async getTeamSchedule(teamMemberId: string, date: string): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEvents(
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      teamMemberId,
    );
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toISOString();
  }

  private formatAddress(address: any): string {
    return `${address.street}, ${address.city}, ${address.postal_code} ${address.country}`;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.integrationService.get(
        'renos-calendar',
        this.config,
        '/health',
      );
      return true;
    } catch (error) {
      this.logger.error('renos-calendar-mcp health check failed', error);
      return false;
    }
  }
}