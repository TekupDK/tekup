import { describe, expect, it, vi, beforeEach } from "vitest";

const {
    searchThreadsMock,
    sendOfferEmailMock,
    createCalendarEventMock,
    suggestRescheduleSlotMock,
    isTimeSlotAvailableMock,
    findNextAvailableSlotMock,
    findLeadsNeedingFollowUpMock,
    sendAllFollowUpsMock,
} = vi.hoisted(() => ({
    searchThreadsMock: vi.fn(),
    sendOfferEmailMock: vi.fn(),
    createCalendarEventMock: vi.fn(),
    suggestRescheduleSlotMock: vi.fn(),
    isTimeSlotAvailableMock: vi.fn(),
    findNextAvailableSlotMock: vi.fn(),
    findLeadsNeedingFollowUpMock: vi.fn(),
    sendAllFollowUpsMock: vi.fn(),
}));

vi.mock("../src/services/gmailService", () => ({
    searchThreads: searchThreadsMock,
    sendOfferEmail: sendOfferEmailMock,
}));

vi.mock("../src/services/calendarService", () => ({
    createCalendarEvent: createCalendarEventMock,
    suggestRescheduleSlot: suggestRescheduleSlotMock,
    isTimeSlotAvailable: isTimeSlotAvailableMock,
    findNextAvailableSlot: findNextAvailableSlotMock,
}));

vi.mock("../src/services/memoryStore", () => ({
    upsertMemory: vi.fn(),
    listMemories: vi.fn().mockReturnValue([]),
}));

vi.mock("../src/services/bookingConfirmation", () => ({
    sendBookingConfirmation: vi.fn().mockResolvedValue({
        subject: "Bekræftelse af din booking",
        body: "Din booking er bekræftet",
        sent: false,
    }),
    sendRescheduleNotification: vi.fn().mockResolvedValue({
        subject: "Ændring af din booking",
        body: "Din booking er ændret",
        sent: false,
    }),
    sendCancellationConfirmation: vi.fn().mockResolvedValue({
        subject: "Aflysning af din booking",
        body: "Din booking er aflyst",
        sent: false,
    }),
}));

vi.mock("../src/services/followUpService", () => ({
    findLeadsNeedingFollowUp: findLeadsNeedingFollowUpMock,
    sendAllFollowUps: sendAllFollowUpsMock,
}));

import { PlanExecutor } from "../src/agents/planExecutor";
import type { ExecutionResult, PlannedTask } from "../src/types";

describe("PlanExecutor", () => {
    let executor: PlanExecutor;

    beforeEach(() => {
        vi.clearAllMocks();
        searchThreadsMock.mockReset();
        sendOfferEmailMock.mockReset();
        createCalendarEventMock.mockReset();
        suggestRescheduleSlotMock.mockReset();
        isTimeSlotAvailableMock.mockReset();
        findNextAvailableSlotMock.mockReset();
        findLeadsNeedingFollowUpMock.mockReset();
        sendAllFollowUpsMock.mockReset();

        searchThreadsMock.mockResolvedValue([{ id: "thread-123" }]);
        sendOfferEmailMock.mockResolvedValue({
            id: "msg-1",
            to: "kunde@example.com",
            subject: "",
            bodyPreview: "",
            dryRun: true,
        });

        // Default: time slots are available
        isTimeSlotAvailableMock.mockResolvedValue({
            available: true,
            conflicts: [],
        });

        executor = new PlanExecutor();
    });

    it("connects follow-up email to existing thread", async () => {
        const task: PlannedTask = {
            id: "task-1",
            type: "email.compose",
            provider: "gmail",
            priority: "high",
            blocking: false,
            payload: {
                lead: { email: "kunde@example.com", name: "Kunde" },
                pricing: { total: 1000 },
            },
        };

        const result: ExecutionResult = await executor.execute([task]);

        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].detail).toContain("tråd");

        expect(searchThreadsMock).toHaveBeenCalledWith({
            query: expect.stringContaining("kunde@example.com"),
            maxResults: 1,
        });
        expect(sendOfferEmailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "kunde@example.com",
                threadId: "thread-123",
            })
        );
    });

    it("foreslår nyt tidspunkt ved kalender-ombooking", async () => {
        const start = new Date("2025-10-01T09:00:00Z");
        const end = new Date("2025-10-01T10:00:00Z");

        suggestRescheduleSlotMock.mockResolvedValue({
            start: start.toISOString(),
            end: end.toISOString(),
            dryRun: true,
            busySlots: [],
        });

        const task: PlannedTask = {
            id: "task-2",
            type: "calendar.reschedule",
            provider: "calendar",
            priority: "normal",
            blocking: false,
            payload: {
                preferredDates: ["2025-10-01T09:00:00Z"],
                durationMinutes: 45,
            },
        };

        const result: ExecutionResult = await executor.execute([task]);

        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].detail).toContain("Ny tid foreslået");
        expect(suggestRescheduleSlotMock).toHaveBeenCalledWith(
            "primary",
            expect.any(String),
            expect.any(String),
            45
        );
    });

    it("opretter kalenderbooking med angivet tidspunkt", async () => {
        const startIso = "2025-10-02T09:30:00.000Z";
        const endIso = new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString();

        createCalendarEventMock.mockResolvedValueOnce({
            id: "event-123",
            start: startIso,
            end: endIso,
            dryRun: true,
        });

        const task: PlannedTask = {
            id: "task-3",
            type: "calendar.book",
            provider: "calendar",
            priority: "high",
            blocking: false,
            payload: {
                lead: {
                    name: "Kunde",
                    email: "kunde@example.com",
                    address: "Overgade 1",
                },
                start: { dateTime: startIso },
                durationMinutes: 90,
            },
        };

        const result: ExecutionResult = await executor.execute([task]);

        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].status).toBe("queued");
        expect(result.actions[0].detail).toBe("Kalenderbooking klar til gennemgang");
        expect(createCalendarEventMock).toHaveBeenCalledWith(
            expect.objectContaining({
                summary: "Rendetalje.dk rengøringsbesøg",
                start: { dateTime: startIso },
                end: { dateTime: endIso },
                attendees: [expect.objectContaining({ email: "kunde@example.com" })],
                location: "Overgade 1",
            })
        );
    });

    it("kører email.followup i dry-run og returnerer queued", async () => {
        findLeadsNeedingFollowUpMock.mockResolvedValue([
            {
                leadId: "lead-1",
                emailThreadId: "thread-1",
                customerEmail: "kunde@example.com",
                customerName: "Kunde",
                daysSinceLastEmail: 6,
                followUpAttempts: 0,
                lastEmailDate: new Date(),
                nextAttemptNumber: 1,
                shouldFollowUp: true,
                reason: "6 dage siden sidste email",
            },
        ]);
        sendAllFollowUpsMock.mockResolvedValue([
            {
                leadId: "lead-1",
                customerEmail: "kunde@example.com",
                attemptNumber: 1,
                sent: false,
                error: "Dry run - not sent",
            },
        ]);

        const task: PlannedTask = {
            id: "task-follow",
            type: "email.followup",
            provider: "gmail",
            priority: "normal",
            blocking: false,
            payload: { dryRun: true },
        };

        const result: ExecutionResult = await executor.execute([task]);

        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].status).toBe("queued");
        expect(result.actions[0].detail).toContain("Opfølgning klar");
        expect(findLeadsNeedingFollowUpMock).toHaveBeenCalled();
        expect(sendAllFollowUpsMock).toHaveBeenCalledWith(true);
    });
});
