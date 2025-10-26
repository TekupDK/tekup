import { Router, Request, Response } from "express";
import { prisma } from "../services/databaseService";
import { updateCustomerStats } from "../services/customerService";
import * as calendarService from "../services/calendarService";
import { logger } from "../logger";
import { googleConfig } from "../config";

const router = Router();

// GET /api/bookings - List all bookings
router.get("/", (req: Request, res: Response) => {
  void (async () => {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          customer: true,
          lead: true,
        },
        orderBy: { scheduledAt: "desc" },
      });

      res.json(bookings);
    } catch (error) {
      logger.error({ error }, "Failed to fetch bookings");
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  })();
});

// POST /api/bookings - Create new booking
router.post("/", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { customerId, leadId, scheduledAt, estimatedDuration, serviceType, address, notes } = req.body;

      // Validation - require customer/lead with contact info
      if (!scheduledAt) {
        return res.status(400).json({ error: "scheduledAt is required" });
      }

      if (!customerId && !leadId) {
        return res.status(400).json({ 
          error: "Kundeoplysninger mangler. Booking skal være knyttet til en kunde eller lead med navn, telefon og email." 
        });
      }

      // Verify customer/lead has required contact information
      if (customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { name: true, email: true, phone: true }
        });

        if (!customer) {
          return res.status(400).json({ error: "Kunde ikke fundet" });
        }

        if (!customer.name || !customer.email || !customer.phone) {
          return res.status(400).json({ 
            error: "Kundens kontaktoplysninger er ufuldstændige. Navn, email og telefon er påkrævet." 
          });
        }
      }

      if (leadId && !customerId) {
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { name: true, email: true, phone: true }
        });

        if (!lead) {
          return res.status(400).json({ error: "Lead ikke fundet" });
        }

        if (!lead.name || !lead.email || !lead.phone) {
          return res.status(400).json({ 
            error: "Lead kontaktoplysninger er ufuldstændige. Navn, email og telefon er påkrævet for at oprette booking." 
          });
        }
      }

      const startTime = new Date(scheduledAt as string);
      const endTime = new Date(startTime.getTime() + (estimatedDuration || 120) * 60 * 1000);

      // Check availability (if GOOGLE_CALENDAR_ID is configured)
      if (googleConfig.GOOGLE_CALENDAR_ID) {
        const availability = await calendarService.isTimeSlotAvailable(
          googleConfig.GOOGLE_CALENDAR_ID,
          startTime.toISOString(),
          endTime.toISOString()
        );

        if (!availability.available) {
          return res.status(400).json({
            error: "Time slot not available",
            conflicts: availability.conflicts
          });
        }
      }

      // Create calendar event
      let calendarEventId: string | undefined;
      let calendarLink: string | undefined;

      if (googleConfig.GOOGLE_CALENDAR_ID) {
        const event = await calendarService.createCalendarEvent({
          summary: `Rengøring - ${serviceType || 'Generelt'}`,
          description: notes || `Booking for ${serviceType || 'rengøring'}`,
          location: address,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "Europe/Copenhagen",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "Europe/Copenhagen",
          },
          calendarId: googleConfig.GOOGLE_CALENDAR_ID,
        });

        calendarEventId = event.id;
        calendarLink = event.htmlLink;
      }

      // Create booking in database
      const booking = await prisma.booking.create({
        data: {
          customerId,
          leadId,
          scheduledAt: startTime,
          estimatedDuration: estimatedDuration || 120,
          startTime,
          endTime,
          serviceType,
          address,
          status: "scheduled",
          calendarEventId,
          calendarLink,
          notes,
        },
        include: {
          customer: true,
          lead: true,
        },
      });

      // Update customer statistics
      const lead = booking.leadId ? await prisma.lead.findUnique({
        where: { id: booking.leadId },
        select: { customerId: true },
      }) : null;
      const statsCustomerId = booking.customerId || lead?.customerId;
      if (statsCustomerId) {
        await updateCustomerStats(statsCustomerId);
        logger.debug(
          { customerId: statsCustomerId, bookingId: booking.id },
          "Updated customer stats after booking creation via API"
        );
      }

      logger.info(`Booking created: ${booking.id} → Calendar: ${calendarEventId}`);
      res.json(booking);
    } catch (error) {
      logger.error({ error }, "Failed to create booking");
      res.status(500).json({ error: "Failed to create booking" });
    }
  })();
});

// PUT /api/bookings/:id - Update booking
router.put("/:id", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { id } = req.params;
      const { scheduledAt, estimatedDuration, status, notes, serviceType, address } = req.body;

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // If time changed and we have calendar event, update it
      if (scheduledAt && booking.calendarEventId && googleConfig.GOOGLE_CALENDAR_ID) {
        const newStartTime = new Date(scheduledAt as string);
        const newEndTime = new Date(newStartTime.getTime() + (estimatedDuration || booking.estimatedDuration) * 60 * 1000);

        // Update calendar event
        await calendarService.updateCalendarEvent(booking.calendarEventId, {
          start: {
            dateTime: newStartTime.toISOString(),
            timeZone: "Europe/Copenhagen",
          },
          end: {
            dateTime: newEndTime.toISOString(),
            timeZone: "Europe/Copenhagen",
          },
          ...(serviceType && { summary: `Rengøring - ${serviceType}` }),
          ...(notes && { description: notes }),
          ...(address && { location: address }),
          calendarId: googleConfig.GOOGLE_CALENDAR_ID,
        });

        logger.info(`Calendar event updated: ${booking.calendarEventId}`);
      }

      // Update database
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          ...(scheduledAt && {
            scheduledAt: new Date(scheduledAt as string),
            startTime: new Date(scheduledAt as string),
            endTime: new Date(new Date(scheduledAt as string).getTime() + (estimatedDuration || booking.estimatedDuration) * 60 * 1000)
          }),
          ...(estimatedDuration && { estimatedDuration }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          ...(serviceType && { serviceType }),
          ...(address && { address }),
        },
        include: { customer: true, lead: true },
      });

      res.json(updated);
    } catch (error) {
      logger.error({ error }, "Failed to update booking");
      res.status(500).json({ error: "Failed to update booking" });
    }
  })();
});

// DELETE /api/bookings/:id - Cancel booking
router.delete("/:id", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Delete from calendar if we have event ID
      if (booking.calendarEventId && googleConfig.GOOGLE_CALENDAR_ID) {
        await calendarService.deleteCalendarEvent(booking.calendarEventId);
        logger.info(`Calendar event deleted: ${booking.calendarEventId}`);
      }

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id },
        data: { status: "cancelled" },
      });

      logger.info(`Booking cancelled: ${id}`);
      res.json({ success: true });
    } catch (error) {
      logger.error({ error }, "Failed to cancel booking");
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  })();
});

// GET /api/bookings/availability/:date - Check availability for date
router.get("/availability/:date", (req: Request, res: Response) => {
  void (async () => {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);

      if (!googleConfig.GOOGLE_CALENDAR_ID) {
        return res.json({
          date,
          slots: [],
          message: "Calendar not configured"
        });
      }

      // Get available time slots for the day (8 AM - 6 PM, 2-hour slots)
      const dayStart = new Date(targetDate);
      dayStart.setHours(8, 0, 0, 0);

      const dayEnd = new Date(targetDate);
      dayEnd.setHours(18, 0, 0, 0);

      const busySlots = await calendarService.findAvailability(
        googleConfig.GOOGLE_CALENDAR_ID,
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

      // Generate time slots
      const slots = [];
      for (let hour = 8; hour < 18; hour += 2) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(targetDate);
        slotEnd.setHours(hour + 2, 0, 0, 0);

        // Check if slot conflicts with busy times
        const isAvailable = !busySlots.some(busy => {
          if (!busy.start || !busy.end) return false;
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return busyStart < slotEnd && busyEnd > slotStart;
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: isAvailable,
        });
      }

      res.json({ date, slots });
    } catch (error) {
      logger.error({ error }, "Failed to check availability");
      res.status(500).json({ error: "Failed to check availability" });
    }
  })();
});

export default router;

