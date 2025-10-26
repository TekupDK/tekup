/**
 * Time Tracking API Routes (Sprint 2)
 */

import { Router, Request, Response } from "express";
import { logger } from "../logger";
import {
    startTimer,
    stopTimer,
    startBreak,
    endBreak,
    getTimerStatus,
    getTimeAnalytics,
} from "../services/timeTrackingService";

const router = Router();

/**
 * POST /api/time-tracking/bookings/:bookingId/start-timer
 * Start timer for a booking
 */
router.post("/bookings/:bookingId/start-timer", async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const result = await startTimer(bookingId);
        
        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error({ error, bookingId: req.params.bookingId }, "Failed to start timer");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/time-tracking/bookings/:bookingId/stop-timer
 * Stop timer for a booking
 */
router.post("/bookings/:bookingId/stop-timer", async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { timeNotes } = req.body;
        
        const result = await stopTimer(bookingId, timeNotes);
        
        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error({ error, bookingId: req.params.bookingId }, "Failed to stop timer");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/time-tracking/bookings/:bookingId/start-break
 * Start a break
 */
router.post("/bookings/:bookingId/start-break", async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { reason, notes } = req.body;
        
        const result = await startBreak(bookingId, reason, notes);
        
        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error({ error, bookingId: req.params.bookingId }, "Failed to start break");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/time-tracking/breaks/:breakId/end
 * End a break
 */
router.post("/breaks/:breakId/end", async (req: Request, res: Response) => {
    try {
        const { breakId } = req.params;
        const result = await endBreak(breakId);
        
        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error({ error, breakId: req.params.breakId }, "Failed to end break");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/time-tracking/bookings/:bookingId/status
 * Get timer status for a booking
 */
router.get("/bookings/:bookingId/status", async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const status = await getTimerStatus(bookingId);
        
        res.json({
            success: true,
            data: status,
        });
    } catch (error: any) {
        logger.error({ error, bookingId: req.params.bookingId }, "Failed to get timer status");
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/time-tracking/analytics
 * Get time analytics and efficiency reports
 */
router.get("/analytics", async (req: Request, res: Response) => {
    try {
        const { customerId, serviceType, startDate, endDate } = req.query;
        
        const analytics = await getTimeAnalytics({
            customerId: customerId as string | undefined,
            serviceType: serviceType as string | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });
        
        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        logger.error({ error }, "Failed to get time analytics");
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
