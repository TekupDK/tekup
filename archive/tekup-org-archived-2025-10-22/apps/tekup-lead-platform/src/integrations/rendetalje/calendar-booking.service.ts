import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-tekup-lead-platform-src-i');

export interface BookingRequest {
  leadId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: {
    street?: string;
    postal_code?: string;
    city?: string;
  };
  serviceType: string;
  estimatedHours: number;
  scheduledDateTime: Date;
  notes?: string;
  preferredTimeSlots?: ('morning'|'afternoon'|'evening')[];
  urgency?: 'immediate'|'within_week'|'flexible';
  idempotencyKey?: string;
}

export interface CalendarEvent {
  id: string;
  htmlLink: string;
  startTime: Date;
  endTime: Date;
  icsContent?: string;
}

export interface TimeSlotSuggestion {
  startTime: Date;
  endTime: Date;
  score: number;  // 0-100 based on customer preferences, urgency, etc
  reason: string;
}

@Injectable()
export class CalendarBookingService {
  private calendar: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    } catch (error) {
      logger.error('Failed to initialize Google Calendar auth:', error);
    }
  }

  /**
   * Create booking in Google Calendar with idempotency
   */
  async createBooking(request: BookingRequest): Promise<CalendarEvent> {
    // Check for existing booking with same idempotency key
    if (request.idempotencyKey) {
      const existing = await this.findBookingByIdempotencyKey(request.idempotencyKey);
      if (existing) {
        logger.info(`Booking already exists for idempotency key: ${request.idempotencyKey}`);
        return existing;
      }
    }
    try {
      const startTime = new Date(request.scheduledDateTime);
      const endTime = new Date(startTime.getTime() + (request.estimatedHours * 60 * 60 * 1000));

      const event = {
        summary: `${request.customerName} – ${request.serviceType}`,
        description: this.createEventDescription(request),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Copenhagen',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Copenhagen',
        },
        location: this.formatAddress(request.address),
        attendees: request.customerEmail ? [
          { email: request.customerEmail }
        ] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
        extendedProperties: {
          private: {
            leadId: request.leadId,
            idempotencyKey: request.idempotencyKey || '',
          }
        },
      };

      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: 'all',
      });

      const icsContent = this.generateICS(response.data);
      
      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        startTime,
        endTime,
        icsContent,
      };
    } catch (error) {
      logger.error('Failed to create calendar booking:', error);
      throw new Error(`Calendar booking failed: ${error.message}`);
    }
  }

  /**
   * Update existing booking
   */
  async updateBooking(eventId: string, updates: Partial<BookingRequest>): Promise<CalendarEvent> {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      
      // Get existing event
      const existingEvent = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      const event = existingEvent.data;
      
      // Update fields
      if (updates.customerName) {
        event.summary = `${updates.customerName} – ${updates.serviceType || 'rengøring'}`;
      }
      
      if (updates.scheduledDateTime) {
        const startTime = new Date(updates.scheduledDateTime);
        const endTime = new Date(startTime.getTime() + ((updates.estimatedHours || 2) * 60 * 60 * 1000));
        
        event.start = {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Copenhagen',
        };
        event.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Copenhagen',
        };
      }

      if (updates.address) {
        event.location = this.formatAddress(updates.address);
      }

      if (updates.notes) {
        event.description = this.createEventDescription(updates as BookingRequest);
      }

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
        sendUpdates: 'all',
      });

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        startTime: new Date(response.data.start.dateTime),
        endTime: new Date(response.data.end.dateTime),
      };
    } catch (error) {
      logger.error('Failed to update calendar booking:', error);
      throw new Error(`Calendar update failed: ${error.message}`);
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(eventId: string, reason?: string): Promise<boolean> {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });

      return true;
    } catch (error) {
      logger.error('Failed to cancel calendar booking:', error);
      return false;
    }
  }

  /**
   * Get available time slots for booking
   */
  async getAvailableSlots(date: Date, durationHours: number = 2): Promise<Date[]> {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      
      // Get start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(8, 0, 0, 0); // Start at 8 AM
      
      const endOfDay = new Date(date);
      endOfDay.setHours(18, 0, 0, 0); // End at 6 PM

      // Get existing events for the day
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const existingEvents = response.data.items || [];
      const availableSlots: Date[] = [];

      // Check each hour slot
      for (let hour = 8; hour <= 16; hour++) { // 8 AM to 4 PM (allowing for 2-hour jobs)
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + durationHours);

        // Check if slot conflicts with existing events
        const hasConflict = existingEvents.some((event: any) => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          
          return (slotStart < eventEnd && slotEnd > eventStart);
        });

        if (!hasConflict) {
          availableSlots.push(slotStart);
        }
      }

      return availableSlots;
    } catch (error) {
      logger.error('Failed to get available slots:', error);
      return [];
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(days: number = 7) {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to get upcoming bookings:', error);
      return [];
    }
  }

  private createEventDescription(request: BookingRequest): string {
    const lines = [
      `Lead ID: ${request.leadId}`,
      `Service: ${request.serviceType}`,
      `Estimated duration: ${request.estimatedHours} hours`,
    ];

    if (request.customerPhone) {
      lines.push(`Phone: ${request.customerPhone}`);
    }

    if (request.address) {
      lines.push(`Address: ${this.formatAddress(request.address)}`);
    }

    if (request.notes) {
      lines.push('', 'Notes:', request.notes);
    }

    return lines.join('\n');
  }

  private formatAddress(address?: { street?: string; postal_code?: string; city?: string }): string {
    if (!address) return '';
    
    const parts = [
      address.street,
      address.postal_code && address.city ? `${address.postal_code} ${address.city}` : address.city
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Find booking by idempotency key for duplicate prevention
   */
  private async findBookingByIdempotencyKey(idempotencyKey: string): Promise<CalendarEvent | null> {
    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
      
      // Search for events with matching idempotency key in extended properties
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        singleEvents: true,
      });

      const events = response.data.items || [];
      const existingEvent = events.find((event: any) => 
        event.extendedProperties?.private?.idempotencyKey === idempotencyKey
      );

      if (existingEvent) {
        return {
          id: existingEvent.id,
          htmlLink: existingEvent.htmlLink,
          startTime: new Date(existingEvent.start.dateTime || existingEvent.start.date),
          endTime: new Date(existingEvent.end.dateTime || existingEvent.end.date),
          icsContent: this.generateICS(existingEvent),
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to find booking by idempotency key:', error);
      return null;
    }
  }

  /**
   * Generate ICS content for email attachments
   */
  private generateICS(event: any): string {
    const startTime = new Date(event.start.dateTime || event.start.date);
    const endTime = new Date(event.end.dateTime || event.end.date);
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ format)
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TekUp//Rendetalje Booking//DA',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${event.id}@rendetalje.dk`,
      `DTSTART:${formatICSDate(startTime)}`,
      `DTEND:${formatICSDate(endTime)}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `SUMMARY:${event.summary || 'Rengøring'}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Påmindelse: Rengøring om 1 time',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    return icsLines.join('\r\n');
  }

  /**
   * Suggest optimal time slots based on customer preferences and availability
   */
  async suggestTimeSlots(
    request: {
      preferredTimeSlots?: ('morning'|'afternoon'|'evening')[];
      urgency?: 'immediate'|'within_week'|'flexible';
      estimatedHours?: number;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<TimeSlotSuggestion[]> {
    const suggestions: TimeSlotSuggestion[] = [];
    const duration = request.estimatedHours || 2;
    
    // Determine date range based on urgency
    const now = new Date();
    let searchDays = 30; // Default flexible
    if (request.urgency === 'immediate') searchDays = 2;
    else if (request.urgency === 'within_week') searchDays = 7;

    const startDate = request.dateRange?.start || new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = request.dateRange?.end || new Date(startDate.getTime() + searchDays * 24 * 60 * 60 * 1000);

    // Check each day in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends for regular cleaning
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const availableSlots = await this.getAvailableSlots(d, duration);
      
      for (const slot of availableSlots) {
        const hour = slot.getHours();
        let score = 50; // Base score
        let reason = 'Available slot';

        // Score based on time preferences
        if (request.preferredTimeSlots?.includes('morning') && hour >= 8 && hour < 12) {
          score += 20;
          reason = 'Matches morning preference';
        } else if (request.preferredTimeSlots?.includes('afternoon') && hour >= 12 && hour < 17) {
          score += 20;
          reason = 'Matches afternoon preference';
        } else if (request.preferredTimeSlots?.includes('evening') && hour >= 17) {
          score += 15;
          reason = 'Matches evening preference';
        }

        // Urgency bonus for sooner slots
        const daysFromNow = Math.floor((slot.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (request.urgency === 'immediate' && daysFromNow <= 1) {
          score += 25;
          reason = 'Immediate availability';
        } else if (request.urgency === 'within_week' && daysFromNow <= 3) {
          score += 15;
          reason = 'Quick availability';
        }

        // Optimal working hours bonus (9-15)
        if (hour >= 9 && hour <= 15) {
          score += 10;
        }

        suggestions.push({
          startTime: slot,
          endTime: new Date(slot.getTime() + duration * 60 * 60 * 1000),
          score: Math.min(score, 100),
          reason,
        });
      }
    }

    // Sort by score descending and return top suggestions
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}
