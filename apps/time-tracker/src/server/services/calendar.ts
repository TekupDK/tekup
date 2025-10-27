import { google } from 'googleapis';
import { supabaseAdmin } from '../lib/supabase';
import { parseCalendarEventDescription } from '../../shared/utils';
import type { CalendarEvent, Job } from '../../shared/types';

export class CalendarService {
  private calendar: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async getCalendarEvents(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async syncJobsFromCalendar(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ synced: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;
    let updated = 0;

    try {
      const events = await this.getCalendarEvents(calendarId, startDate, endDate);

      for (const event of events) {
        try {
          const parsedData = this.parseEventToJob(event);

          if (parsedData) {
            const jobData = {
              calendar_event_id: event.id,
              date: event.start.dateTime?.split('T')[0] || event.start.date || new Date().toISOString().split('T')[0],
              customer_name: parsedData.customer,
              team: parsedData.team,
              hours_worked: parsedData.hours,
              revenue: parsedData.price,
              cost: parsedData.team === 'FB' ? parsedData.hours * 90 : 0, // FB cost calculation
              job_type: parsedData.type,
              status: 'completed', // Assume completed if in calendar
              notes: parsedData.notes,
            };

            // Check if job already exists
            const { data: existingJob } = await supabaseAdmin
              .from('jobs')
              .select('id')
              .eq('calendar_event_id', event.id)
              .single();

            if (existingJob) {
              // Update existing job
              const { error } = await supabaseAdmin
                .from('jobs')
                .update(jobData)
                .eq('calendar_event_id', event.id);

              if (error) throw error;
              updated++;
            } else {
              // Create new job
              const { error } = await supabaseAdmin
                .from('jobs')
                .insert(jobData);

              if (error) throw error;
              synced++;
            }
          }
        } catch (error) {
          errors.push(`Error processing event ${event.id}: ${error}`);
        }
      }

      return { synced, updated, errors };
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      throw new Error('Failed to sync calendar events');
    }
  }

  private parseEventToJob(event: CalendarEvent): {
    customer: string;
    team: string;
    hours: number;
    price: number;
    type: string;
    notes?: string;
  } | null {
    const description = event.description || '';
    const summary = event.summary || '';

    // Extract customer name from title (remove emojis and job type indicators)
    const customerMatch = summary.match(/🏠|✅|FAST|FLYT|HOVED|POST-RENO|RENGØRING/gi);
    const customer = customerMatch
      ? summary.replace(customerMatch[0], '').trim()
      : summary.trim();

    // Parse description for structured data
    const parsed = parseCalendarEventDescription(description);

    // Determine team
    let team = 'Jonas+Rawan'; // Default
    if (description.includes('FB') || description.includes('Team 2') || description.includes('underleverandør')) {
      team = 'FB';
    } else if (description.includes('Jonas') && description.includes('Rawan')) {
      team = 'Jonas+Rawan';
    } else if (description.includes('Jonas') || description.includes('Rawan')) {
      team = 'Mixed';
    }

    // Determine job type
    let jobType = 'Fast'; // Default
    if (description.includes('FLYT')) {
      jobType = 'Flyt';
    } else if (description.includes('HOVED')) {
      jobType = 'Hoved';
    } else if (description.includes('POST-RENO') || description.includes('Post-reno')) {
      jobType = 'Post-reno';
    }

    // Validate required fields
    if (!customer || !parsed.hours || !parsed.price) {
      return null; // Skip events that don't have required data
    }

    return {
      customer,
      team,
      hours: parsed.hours,
      price: parsed.price,
      type: jobType,
      notes: parsed.notes,
    };
  }

  async getJobFromEvent(eventId: string, calendarId: string): Promise<Job | null> {
    try {
      const event = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      const parsedData = this.parseEventToJob(event.data);

      if (!parsedData) return null;

      return {
        id: '', // Will be generated by database
        calendarEventId: eventId,
        date: event.data.start.dateTime?.split('T')[0] || event.data.start.date || new Date().toISOString().split('T')[0],
        customerName: parsedData.customer,
        team: parsedData.team as any,
        hoursWorked: parsedData.hours,
        revenue: parsedData.price,
        cost: parsedData.team === 'FB' ? parsedData.hours * 90 : 0,
        profit: parsedData.price - (parsedData.team === 'FB' ? parsedData.hours * 90 : 0),
        jobType: parsedData.type as any,
        status: 'completed',
        notes: parsedData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }
}

// Helper function to get calendar service instance
export function getCalendarService(): CalendarService {
  return new CalendarService();
}