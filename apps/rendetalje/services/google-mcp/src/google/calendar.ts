import { getCalendar } from "./auth";

const DEFAULT_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com";

export async function createEvent(input: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}) {
  const calendar = getCalendar();
  const { data } = await calendar.events.insert({
    calendarId: DEFAULT_CALENDAR_ID,
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
    },
  });
  return data;
}

export async function checkConflicts(input: { start: string; end: string }) {
  const calendar = getCalendar();
  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.start,
      timeMax: input.end,
      items: [{ id: DEFAULT_CALENDAR_ID }],
    },
  });
  return data;
}

export async function getEvents(input: { start: string; end: string }) {
  const calendar = getCalendar();
  const { data } = await calendar.events.list({
    calendarId: DEFAULT_CALENDAR_ID,
    timeMin: input.start,
    timeMax: input.end,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return data.items || [];
}
