/**
 * Time Tracking Service (Sprint 2)
 * 
 * Manages timer operations for bookings including:
 * - Start/stop timer
 * - Break management
 * - Actual time calculations
 * - Efficiency scoring
 */

import { logger } from "../logger";
import { prisma } from "./databaseService";

export interface StartTimerResult {
    success: boolean;
    bookingId: string;
    actualStartTime: Date;
    message?: string;
}

export interface StopTimerResult {
    success: boolean;
    bookingId: string;
    actualEndTime: Date;
    actualDuration: number; // minutes
    timeVariance: number; // minutes (positive = overtime, negative = under time)
    efficiencyScore: number; // 0-2 (1.0 = perfect)
    message?: string;
}

export interface StartBreakResult {
    success: boolean;
    breakId: string;
    startTime: Date;
    message?: string;
}

export interface EndBreakResult {
    success: boolean;
    breakId: string;
    endTime: Date;
    duration: number; // minutes
    message?: string;
}

/**
 * Start timer for a booking
 */
export async function startTimer(bookingId: string): Promise<StartTimerResult> {
    try {
        logger.info({ bookingId }, "⏱️ Starting timer for booking");

        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        // Check if timer already running
        if (booking.timerStatus === "running") {
            throw new Error("Timer is already running");
        }

        // Start timer
        const now = new Date();
        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                actualStartTime: now,
                timerStatus: "running",
                status: "confirmed", // Auto-confirm when timer starts
            },
        });

        logger.info(
            { bookingId, actualStartTime: now },
            "✅ Timer started successfully"
        );

        return {
            success: true,
            bookingId,
            actualStartTime: now,
            message: "Timer started successfully",
        };
    } catch (error) {
        logger.error({ bookingId, error }, "❌ Failed to start timer");
        throw error;
    }
}

/**
 * Stop timer for a booking
 */
export async function stopTimer(
    bookingId: string,
    timeNotes?: string
): Promise<StopTimerResult> {
    try {
        logger.info({ bookingId }, "⏹️ Stopping timer for booking");

        // Get booking with breaks
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { breaks: true },
        });

        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        if (booking.timerStatus !== "running" && booking.timerStatus !== "paused") {
            throw new Error("Timer is not running");
        }

        if (!booking.actualStartTime) {
            throw new Error("Timer was never started");
        }

        // Calculate actual duration
        const now = new Date();
        const totalMs = now.getTime() - booking.actualStartTime.getTime();
        let totalMinutes = Math.round(totalMs / 60000);

        // Subtract break time
        const breakMinutes = booking.breaks
            .filter(b => b.endTime)
            .reduce((sum, b) => sum + (b.duration || 0), 0);

        const actualDuration = totalMinutes - breakMinutes;

        // Calculate efficiency metrics
        const estimatedDuration = booking.estimatedDuration || 120;
        const timeVariance = actualDuration - estimatedDuration;
        const efficiencyScore = estimatedDuration / actualDuration;

        // Update booking
        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                actualEndTime: now,
                actualDuration,
                timeVariance,
                efficiencyScore,
                timerStatus: "completed",
                status: "completed", // Mark as completed
                timeNotes,
            },
        });

        logger.info(
            {
                bookingId,
                actualDuration,
                estimatedDuration,
                timeVariance,
                efficiencyScore,
            },
            "✅ Timer stopped successfully"
        );

        return {
            success: true,
            bookingId,
            actualEndTime: now,
            actualDuration,
            timeVariance,
            efficiencyScore,
            message: `Job completed in ${actualDuration} minutes`,
        };
    } catch (error) {
        logger.error({ bookingId, error }, "❌ Failed to stop timer");
        throw error;
    }
}

/**
 * Start a break during a booking
 */
export async function startBreak(
    bookingId: string,
    reason?: string,
    notes?: string
): Promise<StartBreakResult> {
    try {
        logger.info({ bookingId, reason }, "☕ Starting break");

        // Verify booking exists and timer is running
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        if (booking.timerStatus !== "running") {
            throw new Error("Timer must be running to start a break");
        }

        // Create break
        const now = new Date();
        const breakRecord = await prisma.break.create({
            data: {
                bookingId,
                startTime: now,
                reason: reason || "other",
                notes,
            },
        });

        // Update booking status to paused
        await prisma.booking.update({
            where: { id: bookingId },
            data: { timerStatus: "paused" },
        });

        logger.info(
            { bookingId, breakId: breakRecord.id, reason },
            "✅ Break started"
        );

        return {
            success: true,
            breakId: breakRecord.id,
            startTime: now,
            message: `Break started: ${reason || "break"}`,
        };
    } catch (error) {
        logger.error({ bookingId, error }, "❌ Failed to start break");
        throw error;
    }
}

/**
 * End a break and resume timer
 */
export async function endBreak(breakId: string): Promise<EndBreakResult> {
    try {
        logger.info({ breakId }, "▶️ Ending break");

        // Get break
        const breakRecord = await prisma.break.findUnique({
            where: { id: breakId },
            include: { booking: true },
        });

        if (!breakRecord) {
            throw new Error(`Break ${breakId} not found`);
        }

        if (breakRecord.endTime) {
            throw new Error("Break already ended");
        }

        // Calculate duration
        const now = new Date();
        const durationMs = now.getTime() - breakRecord.startTime.getTime();
        const duration = Math.round(durationMs / 60000);

        // Update break
        const updated = await prisma.break.update({
            where: { id: breakId },
            data: {
                endTime: now,
                duration,
            },
        });

        // Resume booking timer
        await prisma.booking.update({
            where: { id: breakRecord.bookingId },
            data: { timerStatus: "running" },
        });

        logger.info(
            { breakId, duration },
            "✅ Break ended, timer resumed"
        );

        return {
            success: true,
            breakId,
            endTime: now,
            duration,
            message: `Break ended after ${duration} minutes`,
        };
    } catch (error) {
        logger.error({ breakId, error }, "❌ Failed to end break");
        throw error;
    }
}

/**
 * Get timer status for a booking
 */
export async function getTimerStatus(bookingId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            breaks: {
                orderBy: { startTime: "desc" },
            },
        },
    });

    if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
    }

    // Calculate current elapsed time if running
    let elapsedMinutes = 0;
    if (booking.actualStartTime && booking.timerStatus === "running") {
        const now = new Date();
        const totalMs = now.getTime() - booking.actualStartTime.getTime();
        elapsedMinutes = Math.round(totalMs / 60000);

        // Subtract completed breaks
        const breakMinutes = booking.breaks
            .filter(b => b.endTime)
            .reduce((sum, b) => sum + (b.duration || 0), 0);

        elapsedMinutes -= breakMinutes;
    }

    // Find active break
    const activeBreak = booking.breaks.find(b => !b.endTime);

    return {
        bookingId: booking.id,
        timerStatus: booking.timerStatus,
        estimatedDuration: booking.estimatedDuration,
        actualStartTime: booking.actualStartTime,
        actualEndTime: booking.actualEndTime,
        actualDuration: booking.actualDuration,
        elapsedMinutes,
        timeVariance: booking.timeVariance,
        efficiencyScore: booking.efficiencyScore,
        breaks: booking.breaks,
        activeBreak,
        isRunning: booking.timerStatus === "running",
        isPaused: booking.timerStatus === "paused",
        isCompleted: booking.timerStatus === "completed",
    };
}

/**
 * Get time analytics for efficiency reporting
 */
export async function getTimeAnalytics(options: {
    customerId?: string;
    serviceType?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const { customerId, serviceType, startDate, endDate } = options;

    const where: any = {
        timerStatus: "completed",
        actualDuration: { not: null },
    };

    if (customerId) where.customerId = customerId;
    if (serviceType) where.serviceType = serviceType;
    if (startDate || endDate) {
        where.actualStartTime = {};
        if (startDate) where.actualStartTime.gte = startDate;
        if (endDate) where.actualStartTime.lte = endDate;
    }

    const bookings = await prisma.booking.findMany({
        where,
        include: {
            customer: true,
            breaks: true,
        },
        orderBy: { actualStartTime: "desc" },
    });

    // Calculate aggregate metrics
    const totalBookings = bookings.length;
    const avgEfficiency = totalBookings > 0
        ? bookings.reduce((sum, b) => sum + (b.efficiencyScore || 1), 0) / totalBookings
        : 0;

    const totalOvertime = bookings
        .filter(b => (b.timeVariance || 0) > 0)
        .reduce((sum, b) => sum + (b.timeVariance || 0), 0);

    const totalUndertime = Math.abs(
        bookings
            .filter(b => (b.timeVariance || 0) < 0)
            .reduce((sum, b) => sum + (b.timeVariance || 0), 0)
    );

    // Group by service type
    const byServiceType: Record<string, any> = {};
    bookings.forEach(b => {
        const type = b.serviceType || "unknown";
        if (!byServiceType[type]) {
            byServiceType[type] = {
                count: 0,
                avgEfficiency: 0,
                avgTimeVariance: 0,
                bookings: [],
            };
        }
        byServiceType[type].count++;
        byServiceType[type].bookings.push(b);
    });

    // Calculate averages per service type
    Object.keys(byServiceType).forEach(type => {
        const data = byServiceType[type];
        data.avgEfficiency = data.bookings.reduce(
            (sum: number, b: any) => sum + (b.efficiencyScore || 1), 0
        ) / data.count;
        data.avgTimeVariance = data.bookings.reduce(
            (sum: number, b: any) => sum + (b.timeVariance || 0), 0
        ) / data.count;
    });

    return {
        summary: {
            totalBookings,
            avgEfficiency,
            totalOvertime,
            totalUndertime,
        },
        byServiceType,
        recentBookings: bookings.slice(0, 10),
    };
}
