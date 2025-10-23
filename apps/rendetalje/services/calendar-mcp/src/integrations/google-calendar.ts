/**
 * RenOS Calendar Intelligence MCP - Google Calendar Integration
 * 2-way sync with "RenOS Automatisk Booking" calendar
 */

import { google, calendar_v3 } from 'googleapis';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import { CalendarEvent, ConflictCheckResult } from '../types.js';

let calendar: calendar_v3.Calendar | null = null;

/**
 * Initialize Google Calendar client
 */
export function initCalendar(): calendar_v3.Calendar | null {
  if (calendar) return calendar;

  const inlineCreds = process.env.GOOGLE_CALENDAR_CREDENTIALS;
  const hasInlineCreds = !!inlineCreds;

  if (!config.google.isConfigured && !hasInlineCreds) {
    logger.warn('Google Calendar not configured - running in dry-run mode');
    return null;
  }

  try {
    // Use service account authentication (like RendetaljeOS)
    let credentials: { client_email?: string; private_key?: string; project_id?: string } = {};
    if (hasInlineCreds) {
      try {
        const parsed = JSON.parse(inlineCreds as string);
        credentials = {
          client_email: parsed.client_email,
          private_key: String(parsed.private_key || '').replace(/\r/g, '').replace(/\\n/g, '\n'),
          project_id: parsed.project_id,
        };
      } catch (e) {
        logger.error('Invalid GOOGLE_CALENDAR_CREDENTIALS JSON, falling back to config', e);
      }
    }
    if (!credentials.client_email) {
      credentials = {
        client_email: config.google.clientId,
        private_key: (config.google.clientSecret || '')
          .replace(/\\n/g, '\n')
          .replace(/\r/g, ''),
        project_id: config.google.refreshToken,
      };
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendar = google.calendar({ version: 'v3', auth });

    logger.info('Google Calendar client initialized (service account)', {
      calendarId: config.google.calendarId,
      serviceAccount: config.google.clientId,
    });

    return calendar;
  } catch (error) {
    logger.error('Failed to initialize Google Calendar client', error);
    return null;
  }
}

/**
 * Get Google Calendar client instance
 */
export function getCalendar(): calendar_v3.Calendar {
  if (!calendar) {
    calendar = initCalendar();
  }
  if (!calendar) {
    throw new Error('Google Calendar not configured');
  }
  return calendar;
}

/**
 * Check for booking conflicts
 */
export async function checkConflicts(
  startTime: string,
  endTime: string,
  excludeEventId?: string
): Promise<ConflictCheckResult> {
  const cal = getCalendar();

  const { data } = await cal.events.list({
    calendarId: config.google.calendarId,
    timeMin: startTime,
    timeMax: endTime,
    singleEvents: true,
    orderBy: 'startTime',
  });

  let events = data.items || [];

  // Exclude specific event if provided
  if (excludeEventId) {
    events = events.filter(e => e.id !== excludeEventId);
  }

  const conflicts = events
    .filter(e => e.start?.dateTime && e.end?.dateTime)
    .map(e => ({
      id: e.id!,
      summary: e.summary || 'Uden titel',
      description: e.description,
      location: e.location,
      start: {
        dateTime: e.start!.dateTime!,
        timeZone: e.start!.timeZone || 'Europe/Copenhagen',
      },
      end: {
        dateTime: e.end!.dateTime!,
        timeZone: e.end!.timeZone || 'Europe/Copenhagen',
      },
      htmlLink: e.htmlLink,
      created: e.created!,
      updated: e.updated!,
    } as CalendarEvent));

  logger.debug('Checked for conflicts', {
    startTime,
    endTime,
    conflictCount: conflicts.length,
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts as CalendarEvent[],
  };
}

/**
 * Create calendar event
 */
export async function createEvent(params: {
  summary: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
}): Promise<CalendarEvent> {
  const cal = getCalendar();

  const event: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: {
      dateTime: params.startTime,
      timeZone: 'Europe/Copenhagen',
    },
    end: {
      dateTime: params.endTime,
      timeZone: 'Europe/Copenhagen',
    },
    attendees: params.attendees?.map(email => ({ email })),
  };

  const { data } = await cal.events.insert({
    calendarId: config.google.calendarId,
    requestBody: event,
  });

  logger.info('Calendar event created', {
    eventId: data.id,
    summary: data.summary,
    start: data.start?.dateTime,
  });

  return {
    id: data.id!,
    summary: data.summary!,
    description: data.description || undefined,
    location: data.location || undefined,
    start: {
      dateTime: data.start!.dateTime!,
      timeZone: data.start!.timeZone || 'Europe/Copenhagen',
    },
    end: {
      dateTime: data.end!.dateTime!,
      timeZone: data.end!.timeZone || 'Europe/Copenhagen',
    },
    htmlLink: data.htmlLink || undefined,
    created: data.created!,
    updated: data.updated!,
  };
}

/**
 * Delete calendar event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const cal = getCalendar();

  await cal.events.delete({
    calendarId: config.google.calendarId,
    eventId,
  });

  logger.info('Calendar event deleted', { eventId });
}

/**
 * List upcoming events
 */
export async function listUpcomingEvents(
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const cal = getCalendar();

  const { data } = await cal.events.list({
    calendarId: config.google.calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (data.items || []).map(e => ({
    id: e.id!,
    summary: e.summary || 'Uden titel',
    description: e.description || undefined,
    location: e.location || undefined,
    start: {
      dateTime: e.start!.dateTime!,
      timeZone: e.start!.timeZone || 'Europe/Copenhagen',
    },
    end: {
      dateTime: e.end!.dateTime!,
      timeZone: e.end!.timeZone || 'Europe/Copenhagen',
    },
    htmlLink: e.htmlLink || undefined,
    created: e.created!,
    updated: e.updated!,
  }));
}

export default {
  initCalendar,
  getCalendar,
  checkConflicts,
  createEvent,
  deleteEvent,
  listUpcomingEvents,
};

