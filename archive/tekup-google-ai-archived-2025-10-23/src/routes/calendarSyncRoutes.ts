import { Router, Request, Response } from "express";
import { syncCalendar, getCalendarSyncStatus } from "../services/calendarSyncService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/calendar-sync/sync
 * Perform calendar synchronization
 */
router.post("/sync", (req: Request, res: Response) => {
    void (async () => {
        try {
            const {
                calendarId = "primary",
                syncDirection = "bidirectional",
                forceSync = false,
                maxEvents = 1000
            } = req.body;

            logger.info(
                { calendarId, syncDirection, forceSync, maxEvents },
                "Starting calendar synchronization via API"
            );

            const result = await syncCalendar({
                calendarId,
                syncDirection,
                forceSync,
                maxEvents
            });

            res.json({
                success: result.success,
                data: result,
                message: result.success 
                    ? "Calendar synchronization completed successfully"
                    : "Calendar synchronization failed"
            });

        } catch (error) {
            logger.error({ error }, "Calendar sync API failed");
            res.status(500).json({
                success: false,
                error: "Calendar synchronization failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * GET /api/calendar-sync/status
 * Get calendar synchronization status
 */
router.get("/status", (req: Request, res: Response) => {
    void (async () => {
        try {
            const status = await getCalendarSyncStatus();

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            logger.error({ error }, "Failed to get calendar sync status");
            res.status(500).json({
                success: false,
                error: "Failed to get sync status",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * POST /api/calendar-sync/sync-google-to-db
 * Sync from Google Calendar to database only
 */
router.post("/sync-google-to-db", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { calendarId = "primary", maxEvents = 1000 } = req.body;

            const result = await syncCalendar({
                calendarId,
                syncDirection: "google_to_db",
                maxEvents
            });

            res.json({
                success: result.success,
                data: result,
                message: "Google Calendar to database sync completed"
            });

        } catch (error) {
            logger.error({ error }, "Google to DB sync failed");
            res.status(500).json({
                success: false,
                error: "Google to database sync failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

/**
 * POST /api/calendar-sync/sync-db-to-google
 * Sync from database to Google Calendar only
 */
router.post("/sync-db-to-google", (req: Request, res: Response) => {
    void (async () => {
        try {
            const { calendarId = "primary", maxEvents = 1000 } = req.body;

            const result = await syncCalendar({
                calendarId,
                syncDirection: "db_to_google",
                maxEvents
            });

            res.json({
                success: result.success,
                data: result,
                message: "Database to Google Calendar sync completed"
            });

        } catch (error) {
            logger.error({ error }, "DB to Google sync failed");
            res.status(500).json({
                success: false,
                error: "Database to Google Calendar sync failed",
                message: error instanceof Error ? error.message : String(error)
            });
        }
    })();
});

export default router;
