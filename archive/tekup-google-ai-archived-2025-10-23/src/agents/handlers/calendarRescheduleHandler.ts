import { z } from "zod";
import { suggestRescheduleSlot } from "../../services/calendarService";
import type { TaskHandler, ExecutionAction } from "./types";
import { addMinutes, firstValidDate, formatDateRange, startOfNextBusinessDay } from "./utils";

const ReschedulePayloadSchema = z
    .object({
        preferredDates: z.array(z.coerce.string()).optional(),
        durationMinutes: z.coerce.number().int().positive().default(60),
        calendarId: z.string().optional(),
    })
    .default({ durationMinutes: 60 });

export const handleCalendarReschedule: TaskHandler = async (task) => {
    const payload = ReschedulePayloadSchema.parse(task.payload ?? {});

    const preferredStart = firstValidDate(payload.preferredDates);
    const windowStart = preferredStart ?? startOfNextBusinessDay();
    const windowEnd = addMinutes(windowStart, 7 * 24 * 60);

    const suggestion = await suggestRescheduleSlot(
        payload.calendarId ?? "primary",
        windowStart.toISOString(),
        windowEnd.toISOString(),
        payload.durationMinutes
    );

    if (!suggestion) {
        return buildQueuedAction(task, "Ingen ledige tider fundet i det ønskede interval");
    }

    const detail = `Ny tid foreslået: ${formatDateRange(suggestion.start, suggestion.end)}`;

    return buildAction(task, suggestion.dryRun, detail);
};

function buildQueuedAction(task: Parameters<TaskHandler>[0], detail: string): ExecutionAction {
    return {
        taskId: task.id,
        provider: task.provider,
        status: "queued",
        detail,
    } satisfies ExecutionAction;
}

function buildAction(task: Parameters<TaskHandler>[0], dryRun: boolean, detail: string): ExecutionAction {
    return {
        taskId: task.id,
        provider: task.provider,
        status: dryRun ? "queued" : "success",
        detail,
    } satisfies ExecutionAction;
}
