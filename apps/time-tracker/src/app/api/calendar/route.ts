import { NextRequest } from 'next/server';
import * as calendarApi from '@/server/api/calendar';

// GET /api/calendar/events
export async function GET(request: NextRequest) {
  return calendarApi.GET(request);
}

// POST /api/calendar/sync
export async function POST(request: NextRequest) {
  return calendarApi.POST(request);
}