import { Router, Request, Response } from "express";
import {
  findAvailableSlots,
  isSpecificSlotAvailable,
  getNextAvailableSlot,
  formatSlotsForQuote,
  TimeSlot as _TimeSlot,
} from "../services/slotFinderService";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/calendar/find-slots
 * Find available time slots with business rules
 * 
 * Body: {
 *   durationMinutes: number,
 *   numberOfSlots?: number (default: 5),
 *   startDate?: string (ISO format),
 *   maxDaysToSearch?: number (default: 14),
 *   includeWeekends?: boolean (default: true),
 *   bufferMinutes?: number (default: 60)
 * }
 */
router.post("/find-slots", (req: Request, res: Response) => {
  void (async () => {
    try {
      const {
        durationMinutes,
        numberOfSlots,
        startDate,
        maxDaysToSearch,
        includeWeekends,
        bufferMinutes,
      } = req.body as {
        durationMinutes: number;
        numberOfSlots?: number;
        startDate?: string;
        maxDaysToSearch?: number;
        includeWeekends?: boolean;
        bufferMinutes?: number;
      };

      if (!durationMinutes || typeof durationMinutes !== "number") {
        return res.status(400).json({
          success: false,
          error: "durationMinutes is required and must be a number",
        });
      }

      const slots = await findAvailableSlots({
        durationMinutes,
        numberOfSlots,
        startDate: startDate ? new Date(startDate) : undefined,
        maxDaysToSearch,
        includeWeekends,
        bufferMinutes,
      });

      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      logger.error({ err: error }, "Error finding available slots");
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  })();
});

/**
 * POST /api/calendar/check-slot
 * Check if a specific time slot is available
 * 
 * Body: {
 *   start: string (ISO format),
 *   end: string (ISO format),
 *   bufferMinutes?: number (default: 60)
 * }
 */
router.post("/check-slot", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { start, end, bufferMinutes } = req.body as {
        start: string;
        end: string;
        bufferMinutes?: number;
      };

      if (!start || !end) {
        return res.status(400).json({
          success: false,
          error: "start and end times are required (ISO format)",
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use ISO format (e.g., 2025-10-15T10:00:00Z)",
        });
      }

      const available = await isSpecificSlotAvailable(
        "primary",
        startDate,
        endDate,
        bufferMinutes
      );

      res.json({
        success: true,
        available,
        slot: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error checking slot availability");
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  })();
});

/**
 * POST /api/calendar/next-slot
 * Get the next available time slot
 * 
 * Body: {
 *   durationMinutes: number,
 *   startDate?: string (ISO format, default: now)
 * }
 */
router.post("/next-slot", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { durationMinutes, startDate } = req.body as {
        durationMinutes: number;
        startDate?: string;
      };

      if (!durationMinutes || typeof durationMinutes !== "number") {
        return res.status(400).json({
          success: false,
          error: "durationMinutes is required and must be a number",
        });
      }

      const fromDate = startDate ? new Date(startDate) : new Date();

      if (startDate && isNaN(fromDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid startDate format. Use ISO format (e.g., 2025-10-15T10:00:00Z)",
        });
      }

      const nextSlot = await getNextAvailableSlot(
        "primary",
        durationMinutes,
        fromDate
      );

      if (!nextSlot) {
        return res.status(404).json({
          success: false,
          error: "No available slots found in the next 30 days",
        });
      }

      res.json({
        success: true,
        slot: {
          start: nextSlot.start.toISOString(),
          end: nextSlot.end.toISOString(),
          durationMinutes,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error finding next available slot");
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  })();
});

/**
 * POST /api/calendar/slots-for-quote
 * Generate formatted time slots for inclusion in a customer quote
 * 
 * Body: {
 *   durationMinutes: number,
 *   numberOfSlots?: number (default: 5),
 *   customerPreferredDate?: string (ISO format)
 * }
 * 
 * Returns formatted Danish text ready for email
 */
router.post("/slots-for-quote", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { durationMinutes, numberOfSlots, customerPreferredDate } = req.body as {
        durationMinutes: number;
        numberOfSlots?: number;
        customerPreferredDate?: string;
      };

      if (!durationMinutes || typeof durationMinutes !== "number") {
        return res.status(400).json({
          success: false,
          error: "durationMinutes is required and must be a number",
        });
      }

      const slots = await findAvailableSlots({
        durationMinutes,
        numberOfSlots: numberOfSlots || 5,
        startDate: customerPreferredDate ? new Date(customerPreferredDate) : undefined,
      });

      const formattedText = formatSlotsForQuote(slots);

      res.json({
        success: true,
        formattedText,
        slots: slots.map((slot) => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
        })),
      });
    } catch (error) {
      logger.error({ err: error }, "Error generating slots for quote");
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  })();
});

/**
 * GET /api/calendar/business-hours
 * Get configured business hours
 */
router.get("/business-hours", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      weekday: {
        start: "08:00",
        end: "17:00",
      },
      saturday: {
        start: "08:00",
        end: "15:00",
      },
      sunday: {
        closed: true,
        note: "No bookings on Sundays (except moving emergencies)",
      },
      preferredStartTimes: [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
      ],
      defaultBufferMinutes: 60,
      notes: [
        "Minimum 1 hour buffer between bookings for transport",
        "Preferred times are marked with ⭐ in quotes",
        "Route optimization considers travel time between locations",
      ],
    },
  });
});

export default router;








