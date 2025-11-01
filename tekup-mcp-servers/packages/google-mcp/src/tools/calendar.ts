/**
 * Google Calendar Tools
 * MCP tools for interacting with Google Calendar API
 */

import { calendar_v3 } from 'googleapis';
import { getCalendarClient } from '../utils/google-auth.js';
import { getGoogleMcpConfig } from '../config.js';
import { log, logError } from '../utils/logger.js';
import {
  CalendarEvent,
  ConflictCheckResult,
  CreateEventParams,
  GoogleApiError,
} from '../types.js';

/**
 * List upcoming calendar events
 */
export async function listCalendarEvents(args: {
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  query?: string;
}): Promise<CalendarEvent[]> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: config.google.calendarId,
      timeMin: args.timeMin || new Date().toISOString(),
      maxResults: args.maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime',
    };
    
    if (args.timeMax) {
      params.timeMax = args.timeMax;
    }
    
    if (args.query) {
      params.q = args.query;
    }
    
    log.info('Listing calendar events', params);
    
    const { data } = await calendar.events.list(params);
    
    const events = (data.items || []).map(mapGoogleEventToCalendarEvent);
    
    log.info('Calendar events retrieved', { count: events.length });
    
    return events;
  } catch (error) {
    logError('Failed to list calendar events', error);
    throw error;
  }
}

/**
 * Get a specific calendar event by ID
 */
export async function getCalendarEvent(args: {
  eventId: string;
}): Promise<CalendarEvent> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    log.info('Getting calendar event', { eventId: args.eventId });
    
    const { data } = await calendar.events.get({
      calendarId: config.google.calendarId,
      eventId: args.eventId,
    });
    
    return mapGoogleEventToCalendarEvent(data);
  } catch (error) {
    logError('Failed to get calendar event', error);
    throw error;
  }
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  args: CreateEventParams
): Promise<CalendarEvent> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    const event: calendar_v3.Schema$Event = {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: {
        dateTime: args.startTime,
        timeZone: args.timeZone || 'Europe/Copenhagen',
      },
      end: {
        dateTime: args.endTime,
        timeZone: args.timeZone || 'Europe/Copenhagen',
      },
    };
    
    if (args.attendees && args.attendees.length > 0) {
      event.attendees = args.attendees.map(email => ({ email }));
    }
    
    log.info('Creating calendar event', {
      summary: args.summary,
      start: args.startTime,
    });
    
    const { data } = await calendar.events.insert({
      calendarId: config.google.calendarId,
      requestBody: event,
    });
    
    log.info('Calendar event created', { eventId: data.id });
    
    return mapGoogleEventToCalendarEvent(data);
  } catch (error) {
    logError('Failed to create calendar event', error);
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(args: {
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string[];
  timeZone?: string;
}): Promise<CalendarEvent> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    // First, get the existing event
    const { data: existingEvent } = await calendar.events.get({
      calendarId: config.google.calendarId,
      eventId: args.eventId,
    });
    
    // Prepare update
    const event: calendar_v3.Schema$Event = {
      ...existingEvent,
      summary: args.summary ?? existingEvent.summary,
      description: args.description ?? existingEvent.description,
      location: args.location ?? existingEvent.location,
    };
    
    if (args.startTime) {
      event.start = {
        dateTime: args.startTime,
        timeZone: args.timeZone || 'Europe/Copenhagen',
      };
    }
    
    if (args.endTime) {
      event.end = {
        dateTime: args.endTime,
        timeZone: args.timeZone || 'Europe/Copenhagen',
      };
    }
    
    if (args.attendees) {
      event.attendees = args.attendees.map(email => ({ email }));
    }
    
    log.info('Updating calendar event', { eventId: args.eventId });
    
    const { data } = await calendar.events.update({
      calendarId: config.google.calendarId,
      eventId: args.eventId,
      requestBody: event,
    });
    
    log.info('Calendar event updated', { eventId: data.id });
    
    return mapGoogleEventToCalendarEvent(data);
  } catch (error) {
    logError('Failed to update calendar event', error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(args: {
  eventId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    log.info('Deleting calendar event', { eventId: args.eventId });
    
    await calendar.events.delete({
      calendarId: config.google.calendarId,
      eventId: args.eventId,
    });
    
    log.info('Calendar event deleted', { eventId: args.eventId });
    
    return {
      success: true,
      message: `Event ${args.eventId} deleted successfully`,
    };
  } catch (error) {
    logError('Failed to delete calendar event', error);
    throw error;
  }
}

/**
 * Check for calendar conflicts in a time range
 */
export async function checkCalendarConflicts(args: {
  startTime: string;
  endTime: string;
  excludeEventId?: string;
}): Promise<ConflictCheckResult> {
  try {
    const config = getGoogleMcpConfig();
    const calendar = getCalendarClient();
    
    log.info('Checking calendar conflicts', {
      startTime: args.startTime,
      endTime: args.endTime,
    });
    
    const { data } = await calendar.events.list({
      calendarId: config.google.calendarId,
      timeMin: args.startTime,
      timeMax: args.endTime,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    let events = (data.items || [])
      .filter(e => e.start?.dateTime && e.end?.dateTime);
    
    // Exclude specific event if provided
    if (args.excludeEventId) {
      events = events.filter(e => e.id !== args.excludeEventId);
    }
    
    const conflicts = events.map(mapGoogleEventToCalendarEvent);
    
    log.info('Conflict check completed', {
      conflictCount: conflicts.length,
    });
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  } catch (error) {
    logError('Failed to check calendar conflicts', error);
    throw error;
  }
}

/**
 * Helper function to map Google Calendar event to our CalendarEvent type
 */
function mapGoogleEventToCalendarEvent(
  event: calendar_v3.Schema$Event
): CalendarEvent {
  return {
    id: event.id!,
    summary: event.summary || 'Untitled Event',
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start?.dateTime || event.start?.date!,
      timeZone: event.start?.timeZone || 'Europe/Copenhagen',
    },
    end: {
      dateTime: event.end?.dateTime || event.end?.date!,
      timeZone: event.end?.timeZone || 'Europe/Copenhagen',
    },
    attendees: event.attendees?.map(a => ({
      email: a.email!,
      displayName: a.displayName,
      responseStatus: a.responseStatus,
    })),
    htmlLink: event.htmlLink,
    created: event.created,
    updated: event.updated,
    status: event.status,
    organizer: event.organizer ? {
      email: event.organizer.email!,
      displayName: event.organizer.displayName,
    } : undefined,
  };
}
