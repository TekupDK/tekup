import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('auto-booking');

export interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  estimatedDuration: number;
}

export interface BookingProposal {
  leadId: string;
  customerName: string;
  serviceType: string;
  estimatedPrice: number;
  estimatedDuration: number;
  proposedSlots: BookingSlot[];
  bookingUrl: string;
  expiresAt: Date;
}

@Injectable()
export class AutoBookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generer automatisk booking forslag til high-score leads
   */
  async generateBookingProposal(leadId: string): Promise<BookingProposal> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          contact: true,
          company: true
        }
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      const serviceDetails = this.analyzeServiceRequirements(lead);
      const availableSlots = await this.findAvailableSlots(serviceDetails);
      const bookingUrl = this.generateBookingUrl(leadId);

      const proposal: BookingProposal = {
        leadId,
        customerName: `${lead.contact?.firstName} ${lead.contact?.lastName}`.trim(),
        serviceType: serviceDetails.type,
        estimatedPrice: serviceDetails.price,
        estimatedDuration: serviceDetails.duration,
        proposedSlots: availableSlots,
        bookingUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Gem booking proposal
      await this.saveBookingProposal(proposal);

      logger.info(`Generated booking proposal for lead ${leadId}`);
      return proposal;

    } catch (error) {
      logger.error(`Failed to generate booking proposal for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Analyser service krav baseret på lead data
   */
  private analyzeServiceRequirements(lead: any) {
    const rawText = lead.metadata?.rawText?.toLowerCase() || '';
    
    let serviceType = 'Standard rengøring';
    let baseDuration = 2; // hours
    let basePrice = 698; // DKK

    // Analyze service type
    if (rawText.includes('hovedrengøring')) {
      serviceType = 'Hovedrengøring';
      baseDuration = 3;
      basePrice = 1047;
    } else if (rawText.includes('flytterengøring')) {
      serviceType = 'Flytterengøring';
      baseDuration = 4;
      basePrice = 1396;
    } else if (rawText.includes('kontorrengøring') || rawText.includes('erhverv')) {
      serviceType = 'Kontorrengøring';
      baseDuration = 3;
      basePrice = 1047;
    }

    // Analyze size if mentioned
    const sizeMatch = rawText.match(/(\d+)\s*(?:m2|m²|kvm)/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size > 100) {
        baseDuration += Math.ceil((size - 100) / 50); // +1 hour per 50m² above 100m²
        basePrice = baseDuration * 349; // 349 kr/hour
      }
    }

    return {
      type: serviceType,
      duration: baseDuration,
      price: basePrice
    };
  }

  /**
   * Find ledige tidsslots baseret på service krav
   */
  private async findAvailableSlots(serviceDetails: any): Promise<BookingSlot[]> {
    const slots: BookingSlot[] = [];
    const today = new Date();
    
    // Generate slots for next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for now
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate time slots (9-17, excluding lunch 12-13)
      const timeSlots = [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '16:00' },
        { start: '16:00', end: '19:00' }
      ];

      for (const timeSlot of timeSlots) {
        const slotDuration = this.calculateSlotDuration(timeSlot.start, timeSlot.end);
        
        // Only include slots that can accommodate the service
        if (slotDuration >= serviceDetails.duration) {
          const endTime = this.addHoursToTime(timeSlot.start, serviceDetails.duration);
          
          slots.push({
            date: date.toISOString().split('T')[0],
            startTime: timeSlot.start,
            endTime: endTime,
            available: await this.isSlotAvailable(date, timeSlot.start, endTime),
            estimatedDuration: serviceDetails.duration
          });
        }
      }
    }

    // Return only available slots, max 6
    return slots.filter(slot => slot.available).slice(0, 6);
  }

  /**
   * Tjek om et tidsslot er ledigt
   */
  private async isSlotAvailable(date: Date, startTime: string, endTime: string): Promise<boolean> {
    // TODO: Integrate with Google Calendar API to check availability
    // For now, simulate availability (80% chance of being available)
    return Math.random() > 0.2;
  }

  /**
   * Beregn varighed af tidsslot
   */
  private calculateSlotDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return (end - start) / 60; // Convert to hours
  }

  /**
   * Tilføj timer til tidspunkt
   */
  private addHoursToTime(time: string, hours: number): string {
    const minutes = this.timeToMinutes(time) + (hours * 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Konverter tid til minutter
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Generer booking URL
   */
  private generateBookingUrl(leadId: string): string {
    const token = Buffer.from(leadId).toString('base64url');
    return `https://rendetalje-os.tekup.dk/booking/${token}`;
  }

  /**
   * Gem booking proposal i database
   */
  private async saveBookingProposal(proposal: BookingProposal): Promise<void> {
    // TODO: Create booking_proposals table in schema
    // For now, store in lead metadata
    await this.prisma.lead.update({
      where: { id: proposal.leadId },
      data: {
        metadata: {
          bookingProposal: proposal,
          proposalGenerated: new Date()
        }
      }
    });
  }

  /**
   * Bekræft booking fra kunde
   */
  async confirmBooking(token: string, selectedSlot: BookingSlot): Promise<{ success: boolean; calendarEventId?: string; error?: string }> {
    try {
      const leadId = Buffer.from(token, 'base64url').toString();
      
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { contact: true }
      });

      if (!lead) {
        return { success: false, error: 'Invalid booking token' };
      }

      // Create calendar event
      const calendarEventId = await this.createCalendarEvent(lead, selectedSlot);

      // Update lead status
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'booked',
          metadata: {
            ...lead.metadata,
            bookedSlot: selectedSlot,
            calendarEventId,
            bookedAt: new Date()
          }
        }
      });

      // Create activity
      await this.prisma.activity.create({
        data: {
          type: 'BOOKING_CONFIRMED',
          description: `Kunde bekræftede booking for ${selectedSlot.date} ${selectedSlot.startTime}`,
          leadId,
          tenantId: lead.tenantId,
          metadata: {
            selectedSlot,
            calendarEventId
          }
        }
      });

      logger.info(`Booking confirmed for lead ${leadId}: ${selectedSlot.date} ${selectedSlot.startTime}`);
      
      return { success: true, calendarEventId };

    } catch (error) {
      logger.error(`Booking confirmation failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Opret Calendar event
   */
  private async createCalendarEvent(lead: any, slot: BookingSlot): Promise<string> {
    // TODO: Integrate with Google Calendar API
    // For now, return mock event ID
    const eventId = `event_${Date.now()}`;
    
    logger.info(`Calendar event would be created:`, {
      eventId,
      customer: `${lead.contact?.firstName} ${lead.contact?.lastName}`,
      date: slot.date,
      time: `${slot.startTime}-${slot.endTime}`,
      phone: lead.contact?.phone,
      email: lead.contact?.email
    });

    return eventId;
  }

  /**
   * Send booking bekræftelse email
   */
  async sendBookingConfirmation(leadId: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true }
    });

    if (!lead?.contact?.email) return;

    const bookedSlot = lead.metadata?.bookedSlot;
    if (!bookedSlot) return;

    // TODO: Send confirmation email
    logger.info(`Booking confirmation email would be sent to ${lead.contact.email}:`, {
      date: bookedSlot.date,
      time: `${bookedSlot.startTime}-${bookedSlot.endTime}`
    });
  }

  /**
   * Få booking statistikker
   */
  async getBookingStats(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: { status: true, metadata: true }
    });

    const proposalsGenerated = leads.filter(l => l.metadata?.bookingProposal).length;
    const bookingsConfirmed = leads.filter(l => l.status === 'booked').length;
    const conversionRate = proposalsGenerated > 0 ? (bookingsConfirmed / proposalsGenerated) * 100 : 0;

    return {
      proposalsGenerated,
      bookingsConfirmed,
      conversionRate: Math.round(conversionRate),
      pendingProposals: proposalsGenerated - bookingsConfirmed
    };
  }
}
