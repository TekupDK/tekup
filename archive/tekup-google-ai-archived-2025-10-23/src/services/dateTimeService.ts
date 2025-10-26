/**
 * Date & Time Service
 * 
 * KRITISK REGEL fra MEMORY_9, MEMORY_10:
 * "Jeg laver ofte fejl ved at forskyde datoer med én dag"
 * "KRITISK REGEL #1 - OBLIGATORISK TIME CHECK:
 * Før jeg svarer på NOGET der involverer datoer, tider eller 
 * scheduling, SKAL jeg ALTID som det ALLERFØRSTE skridt 
 * tjekke den aktuelle tid og dato først. INGEN UNDTAGELSER."
 * 
 * This service provides VERIFIED current date/time in Copenhagen timezone
 * with mandatory checks before ANY date-related operations.
 */

import { logger } from "../logger";

/**
 * Current date/time in Copenhagen timezone with structured data
 */
export interface CurrentDateTime {
    iso: string;                  // ISO 8601: "2025-10-03T14:32:00+02:00"
    date: string;                 // YYYY-MM-DD: "2025-10-03"
    time: string;                 // HH:MM: "14:32"
    dayOfWeek: string;            // Danish: "Torsdag"
    dayOfWeekEn: string;          // English: "Thursday"
    dayOfMonth: number;           // 3
    month: string;                // Danish: "Oktober"
    monthEn: string;              // English: "October"
    monthNumber: number;          // 10
    year: number;                 // 2025
    week: number;                 // ISO week number: 40
    timezone: string;             // "Europe/Copenhagen"
    timestamp: number;            // Unix timestamp
}

// Cache for 1 minute to avoid excessive calls
let _cachedTime: CurrentDateTime | null = null;
let _cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get current date/time in Copenhagen timezone
 * 
 * This is the MANDATORY first step before ANY date-related operation.
 * Results are cached for 1 minute to improve performance.
 * 
 * @param forceRefresh - Force refresh cache (default: false)
 * @returns Current date/time with full context
 */
export function getCurrentDateTime(forceRefresh: boolean = false): CurrentDateTime {
    const now = Date.now();

    // Return cached value if fresh
    if (!forceRefresh && _cachedTime && (now - _cacheTimestamp) < CACHE_TTL) {
        return _cachedTime;
    }

    // Get current time in Copenhagen timezone
    const copenhagenDate = new Date();

    // Format in Copenhagen timezone
    const formatter = new Intl.DateTimeFormat("da-DK", {
        timeZone: "Europe/Copenhagen",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
    });

    const parts = formatter.formatToParts(copenhagenDate);

    const getPartValue = (type: string): string => {
        const part = parts.find((p) => p.type === type);
        return part?.value || "";
    };

    const year = parseInt(getPartValue("year"), 10);
    const month = parseInt(getPartValue("month"), 10);
    const day = parseInt(getPartValue("day"), 10);
    const hour = parseInt(getPartValue("hour"), 10);
    const minute = parseInt(getPartValue("minute"), 10);
    const second = parseInt(getPartValue("second"), 10);
    const weekday = getPartValue("weekday");

    // Build ISO string (Copenhagen is UTC+1 in winter, UTC+2 in summer)
    const isDST = isDaylightSavingTime(copenhagenDate);
    const offset = isDST ? "+02:00" : "+01:00";
    const iso = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}${offset}`;

    // Get ISO week number
    const week = getISOWeek(copenhagenDate);

    // Get month names
    const monthNamesDa = [
        "Januar", "Februar", "Marts", "April", "Maj", "Juni",
        "Juli", "August", "September", "Oktober", "November", "December"
    ];
    const monthNamesEn = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get day names
    const dayNamesDa = [
        "Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"
    ];
    const dayNamesEn = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    const dayIndex = copenhagenDate.getDay();

    const result: CurrentDateTime = {
        iso,
        date: `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
        time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        dayOfWeek: capitalize(weekday) || dayNamesDa[dayIndex],
        dayOfWeekEn: dayNamesEn[dayIndex],
        dayOfMonth: day,
        month: monthNamesDa[month - 1],
        monthEn: monthNamesEn[month - 1],
        monthNumber: month,
        year,
        week,
        timezone: "Europe/Copenhagen",
        timestamp: copenhagenDate.getTime(),
    };

    // Update cache
    _cachedTime = result;
    _cacheTimestamp = now;

    logger.debug({
        date: result.date,
        time: result.time,
        dayOfWeek: result.dayOfWeek,
        week: result.week
    }, "✅ TIME CHECK: Current date/time verified");

    return result;
}

/**
 * MANDATORY wrapper for ALL date/time operations
 * 
 * This ensures date/time is ALWAYS checked before performing operations.
 * Use this for any operation that involves dates, times, or scheduling.
 * 
 * @param operation - Function to execute with verified current time
 * @param context - Description of what operation is being performed
 * @returns Result of the operation
 */
export async function withTimeCheck<T>(
    operation: (currentTime: CurrentDateTime) => Promise<T>,
    context: string
): Promise<T> {
    const currentTime = getCurrentDateTime();

    logger.info({
        context,
        currentDate: currentTime.date,
        currentTime: currentTime.time,
        dayOfWeek: currentTime.dayOfWeek,
        week: currentTime.week,
    }, "🕐 MANDATORY TIME CHECK");

    return operation(currentTime);
}

/**
 * Add days to a date
 * 
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date | CurrentDateTime, days: number): Date {
    const baseDate = date instanceof Date ? date : new Date(date.iso);
    const result = new Date(baseDate);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Add hours to a date
 * 
 * @param date - Starting date
 * @param hours - Number of hours to add (can be negative)
 * @returns New date
 */
export function addHours(date: Date | CurrentDateTime, hours: number): Date {
    const baseDate = date instanceof Date ? date : new Date(date.iso);
    const result = new Date(baseDate);
    result.setHours(result.getHours() + hours);
    return result;
}

/**
 * Format date in Danish locale
 * 
 * @param date - Date to format
 * @param includeWeekday - Include day of week (default: false)
 * @returns Formatted string: "3. oktober 2025" or "Torsdag d. 3. oktober 2025"
 */
export function formatDateDanish(date: Date | string, includeWeekday: boolean = false): string {
    const d = typeof date === "string" ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Europe/Copenhagen",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    if (includeWeekday) {
        options.weekday = "long";
    }

    const formatted = d.toLocaleDateString("da-DK", options);

    // Add "d." after weekday if included
    if (includeWeekday) {
        return formatted.replace(/(\w+) (\d+)/, "$1 d. $2");
    }

    return formatted;
}

/**
 * Format time in Danish locale
 * 
 * @param date - Date to format
 * @returns Formatted string: "14:32"
 */
export function formatTimeDanish(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;

    return d.toLocaleTimeString("da-DK", {
        timeZone: "Europe/Copenhagen",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Format date and time together
 * 
 * @param date - Date to format
 * @returns Formatted string: "Torsdag d. 3. oktober 2025 kl. 14:32"
 */
export function formatDateTimeDanish(date: Date | string): string {
    return `${formatDateDanish(date, true)} kl. ${formatTimeDanish(date)}`;
}

/**
 * Parse Danish date string to Date object
 * 
 * Handles formats like:
 * - "3. oktober 2025"
 * - "Torsdag d. 3. oktober 2025"
 * - "03-10-2025"
 * - "2025-10-03"
 * 
 * @param dateStr - Date string to parse
 * @returns Date object or null if parsing fails
 */
export function parseDanishDate(dateStr: string): Date | null {
    try {
        // Try ISO format first
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(dateStr);
        }

        // Try DD-MM-YYYY format
        if (dateStr.match(/^\d{2}-\d{2}-\d{4}/)) {
            const [day, month, year] = dateStr.split("-").map(Number);
            return new Date(year, month - 1, day);
        }

        // Try Danish text format: "3. oktober 2025" or "Torsdag d. 3. oktober 2025"
        const monthNames = [
            "januar", "februar", "marts", "april", "maj", "juni",
            "juli", "august", "september", "oktober", "november", "december"
        ];

        const parts = dateStr.toLowerCase().match(/(\d+)\.\s*(\w+)\s*(\d{4})/);
        if (parts) {
            const [, day, monthName, year] = parts;
            const monthIndex = monthNames.indexOf(monthName);
            if (monthIndex !== -1) {
                return new Date(parseInt(year), monthIndex, parseInt(day));
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get difference in days between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days (positive if date1 > date2)
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === "string" ? new Date(date1) : date1;
    const d2 = typeof date2 === "string" ? new Date(date2) : date2;

    const diffMs = d1.getTime() - d2.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 * 
 * @param date - Date to check
 * @returns true if date is today in Copenhagen timezone
 */
export function isToday(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    const current = getCurrentDateTime();

    return (
        d.getFullYear() === current.year &&
        d.getMonth() + 1 === current.monthNumber &&
        d.getDate() === current.dayOfMonth
    );
}

/**
 * Check if date is in the past
 * 
 * @param date - Date to check
 * @returns true if date is before now
 */
export function isPast(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    const current = getCurrentDateTime();
    return d.getTime() < current.timestamp;
}

/**
 * Check if date is in the future
 * 
 * @param date - Date to check
 * @returns true if date is after now
 */
export function isFuture(date: Date | string): boolean {
    const d = typeof date === "string" ? new Date(date) : date;
    const current = getCurrentDateTime();
    return d.getTime() > current.timestamp;
}

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Check if date is in daylight saving time
 */
function isDaylightSavingTime(date: Date): boolean {
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    const stdOffset = Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());
    return date.getTimezoneOffset() < stdOffset;
}

/**
 * Get ISO week number
 * 
 * ISO 8601 week numbering:
 * - Week 1 is the first week with 4+ days in the new year
 * - Weeks start on Monday
 */
function getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}
