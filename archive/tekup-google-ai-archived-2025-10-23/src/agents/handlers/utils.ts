export interface StartLike {
    dateTime?: string;
    date?: string;
}

export function resolveDateTime(start?: StartLike | null): Date | null {
    if (!start) {
        return null;
    }

    if (start.dateTime) {
        const date = new Date(start.dateTime);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    if (start.date) {
        const date = new Date(`${start.date}T09:00:00`);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

export function firstValidDate(candidates?: string[]): Date | null {
    if (!candidates) {
        return null;
    }

    for (const value of candidates) {
        if (!value) {
            continue;
        }
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return null;
}

export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

export function startOfNextBusinessDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
}

export function formatDateRange(startIso: string, endIso: string, locale = "da-DK"): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const formatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function buildAttendeesFromLead(lead?: { email?: string | null; name?: string | null }):
    | Array<{ email: string; displayName?: string }>
    | undefined {
    if (!lead?.email) {
        return undefined;
    }

    const entry: { email: string; displayName?: string } = {
        email: lead.email,
    };

    if (lead.name && lead.name.trim().length > 0) {
        entry.displayName = lead.name;
    }

    return [entry];
}
