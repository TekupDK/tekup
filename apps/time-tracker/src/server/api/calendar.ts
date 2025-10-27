import { NextRequest, NextResponse } from 'next/server';
import { getCalendarService } from '../services/calendar';
import type { ApiResponse } from '../../shared/types';

// GET /api/calendar/sync - Sync calendar events to jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendarId, startDate, endDate } = body;

    if (!calendarId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: calendarId, startDate, endDate' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const calendarService = getCalendarService();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await calendarService.syncJobsFromCalendar(calendarId, start, end);

    return NextResponse.json(
      { success: true, data: result } as ApiResponse<typeof result>
    );
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync calendar events' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// GET /api/calendar/events - Get calendar events for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!calendarId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: calendarId, startDate, endDate' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const calendarService = getCalendarService();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const events = await calendarService.getCalendarEvents(calendarId, start, end);

    return NextResponse.json(
      { success: true, data: events } as ApiResponse<typeof events>
    );
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}