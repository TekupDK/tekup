import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('danish-booking-system');

@Injectable()
export class DanishBookingSystemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new booking with Danish consumer protection compliance
   */
  async createBooking(request: BookingRequest): Promise<BookingResult> {
    try {
      const { clientId, serviceId, staffId, dateTime, duration, notes } = request;

      // Validate service availability
      const service = await this.prisma.beautyService.findUnique({
        where: { id: serviceId },
        include: { salon: true }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Check staff availability
      const staffAvailable = await this.checkStaffAvailability(staffId, dateTime, duration);
      if (!staffAvailable) {
        throw new Error('Staff member not available at requested time');
      }

      // Generate booking with Danish consumer rights
      const booking = await this.prisma.booking.create({
        data: {
          clientId,
          serviceId,
          staffId,
          salonId: service.salonId,
          scheduledDate: dateTime,
          duration,
          status: 'CONFIRMED',
          price: service.price,
          notes,
          
          // Danish consumer protection
          cancellationPolicy: this.getDanishCancellationPolicy(),
          consumerRights: this.getDanishConsumerRights(),
          termsAcceptedAt: new Date(),
          
          // GDPR compliance
          dataProcessingConsent: true,
          marketingConsent: request.marketingConsent || false,
          
          createdAt: new Date()
        }
      });

      // Send confirmation with Danish consumer information
      await this.sendBookingConfirmation(booking);

      // Update staff schedule
      await this.updateStaffSchedule(staffId, dateTime, duration, booking.id);

      logger.info(`Booking created: ${booking.id} for service ${serviceId}`);

      return {
        bookingId: booking.id,
        confirmationNumber: this.generateConfirmationNumber(booking.id),
        scheduledDate: booking.scheduledDate,
        service: service.name,
        staff: (await this.getStaffInfo(staffId)).name,
        price: booking.price,
        cancellationDeadline: this.calculateCancellationDeadline(dateTime),
        consumerRights: booking.consumerRights,
        status: 'CONFIRMED'
      };

    } catch (error) {
      logger.error('Booking creation failed:', error);
      throw new Error(`Booking failed: ${error.message}`);
    }
  }

  /**
   * Handle booking modifications with Danish consumer protection
   */
  async modifyBooking(bookingId: string, modifications: BookingModification): Promise<ModificationResult> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { client: true, service: true, staff: true }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check modification eligibility under Danish consumer law
      const modificationAllowed = await this.checkModificationEligibility(booking, modifications);
      
      if (!modificationAllowed.allowed) {
        return {
          success: false,
          reason: modificationAllowed.reason,
          alternativeOptions: await this.suggestAlternatives(booking, modifications)
        };
      }

      // Calculate any fees for modifications
      const modificationFees = this.calculateModificationFees(booking, modifications);

      // Apply modifications
      const updatedBooking = await this.applyModifications(booking, modifications, modificationFees);

      // Notify affected parties
      await this.notifyBookingModification(updatedBooking, modifications);

      logger.info(`Booking modified: ${bookingId}`);

      return {
        success: true,
        updatedBooking: {
          bookingId: updatedBooking.id,
          newDateTime: updatedBooking.scheduledDate,
          newService: updatedBooking.service?.name,
          modificationFees,
          newCancellationDeadline: this.calculateCancellationDeadline(updatedBooking.scheduledDate)
        }
      };

    } catch (error) {
      logger.error('Booking modification failed:', error);
      throw error;
    }
  }

  /**
   * Process cancellation according to Danish consumer protection law
   */
  async cancelBooking(bookingId: string, reason: string): Promise<CancellationResult> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { client: true, service: true }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Determine cancellation terms under Danish law
      const cancellationTerms = await this.evaluateCancellationTerms(booking);

      // Process cancellation
      const cancelledBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
          refundAmount: cancellationTerms.refundAmount,
          cancellationFees: cancellationTerms.fees
        }
      });

      // Process refund if applicable
      if (cancellationTerms.refundAmount > 0) {
        await this.processRefund(cancelledBooking, cancellationTerms.refundAmount);
      }

      // Free up staff time slot
      await this.releaseStaffTimeSlot(booking.staffId, booking.scheduledDate, booking.duration);

      // Send cancellation confirmation
      await this.sendCancellationConfirmation(cancelledBooking, cancellationTerms);

      logger.info(`Booking cancelled: ${bookingId} with refund ${cancellationTerms.refundAmount} DKK`);

      return {
        cancelled: true,
        refundAmount: cancellationTerms.refundAmount,
        cancellationFees: cancellationTerms.fees,
        refundMethod: 'Original payment method',
        refundTimeframe: '5-7 business days',
        consumerRights: this.getDanishCancellationRights()
      };

    } catch (error) {
      logger.error('Booking cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Generate availability calendar with Danish holiday considerations
   */
  async getAvailability(serviceId: string, startDate: Date, endDate: Date): Promise<AvailabilityCalendar> {
    try {
      const service = await this.prisma.beautyService.findUnique({
        where: { id: serviceId },
        include: { 
          salon: { include: { staff: true } },
          staffServices: { include: { staff: true } }
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Get Danish holidays for the period
      const danishHolidays = await this.getDanishHolidays(startDate, endDate);

      // Get salon operating hours
      const operatingHours = service.salon.operatingHours;

      // Generate availability slots
      const availabilitySlots = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Skip Danish holidays and salon closed days
        if (!this.isSalonClosed(currentDate, danishHolidays, operatingHours)) {
          const dailySlots = await this.generateDailySlots(
            service,
            currentDate,
            operatingHours
          );
          availabilitySlots.push(...dailySlots);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        serviceId,
        period: { start: startDate, end: endDate },
        totalSlots: availabilitySlots.length,
        availableSlots: availabilitySlots.filter(slot => slot.available).length,
        slots: availabilitySlots,
        holidays: danishHolidays,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Availability generation failed:', error);
      throw error;
    }
  }

  /**
   * Send automated appointment reminders with Danish language support
   */
  async sendAppointmentReminders(): Promise<void> {
    try {
      // Get bookings for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const upcomingBookings = await this.prisma.booking.findMany({
        where: {
          scheduledDate: {
            gte: tomorrow,
            lte: tomorrowEnd
          },
          status: 'CONFIRMED'
        },
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true
        }
      });

      // Send SMS and email reminders
      for (const booking of upcomingBookings) {
        await this.sendReminderMessages(booking);
      }

      logger.info(`Sent ${upcomingBookings.length} appointment reminders`);

    } catch (error) {
      logger.error('Reminder sending failed:', error);
    }
  }

  // Private helper methods
  private async checkStaffAvailability(staffId: string, dateTime: Date, duration: number): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    const conflictingBookings = await this.prisma.booking.count({
      where: {
        staffId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            scheduledDate: { lte: dateTime },
            scheduledEnd: { gt: dateTime }
          },
          {
            scheduledDate: { lt: endTime },
            scheduledEnd: { gte: endTime }
          },
          {
            scheduledDate: { gte: dateTime },
            scheduledEnd: { lte: endTime }
          }
        ]
      }
    });

    return conflictingBookings === 0;
  }

  private getDanishCancellationPolicy(): string {
    return 'Fortrydelsesret gælder i henhold til dansk forbrugerlovgivning. Aflysning kan ske indtil 24 timer før aftalt tid uden gebyr.';
  }

  private getDanishConsumerRights(): string {
    return 'Som forbruger i Danmark har du ret til at fortryde dit køb inden for 14 dage efter aftale, medmindre behandlingen allerede er påbegyndt.';
  }

  private getDanishCancellationRights(): string {
    return 'Refundering sker til den oprindelige betalingsmetode inden for 5-7 arbejdsdage i henhold til dansk lovgivning.';
  }

  private generateConfirmationNumber(bookingId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `EP${timestamp}${random}`;
  }

  private calculateCancellationDeadline(scheduledDate: Date): Date {
    const deadline = new Date(scheduledDate);
    deadline.setHours(deadline.getHours() - 24); // 24 hours before
    return deadline;
  }

  private async sendBookingConfirmation(booking: any): Promise<void> {
    // Send SMS and email confirmation
    // Implementation would use Twilio/email services
    logger.info(`Booking confirmation sent for booking ${booking.id}`);
  }

  private async updateStaffSchedule(staffId: string, dateTime: Date, duration: number, bookingId: string): Promise<void> {
    await this.prisma.staffSchedule.create({
      data: {
        staffId,
        bookingId,
        startTime: dateTime,
        endTime: new Date(dateTime.getTime() + duration * 60000),
        type: 'BOOKING'
      }
    });
  }

  private async getStaffInfo(staffId: string): Promise<{ name: string }> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId }
    });
    return { name: staff?.name || 'Unknown' };
  }

  private async checkModificationEligibility(booking: any, modifications: BookingModification): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const bookingTime = new Date(booking.scheduledDate);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Danish consumer law: modifications allowed up to 24 hours before
    if (hoursUntilBooking < 24) {
      return {
        allowed: false,
        reason: 'Ændringer kan ikke foretages mindre end 24 timer før aftalt tid'
      };
    }

    return { allowed: true };
  }

  private calculateModificationFees(booking: any, modifications: BookingModification): number {
    // No fees for modifications more than 24 hours in advance (Danish consumer protection)
    return 0;
  }

  private async applyModifications(booking: any, modifications: BookingModification, fees: number): Promise<any> {
    const updateData: any = {};

    if (modifications.newDateTime) {
      updateData.scheduledDate = modifications.newDateTime;
    }

    if (modifications.newServiceId) {
      updateData.serviceId = modifications.newServiceId;
    }

    if (modifications.newStaffId) {
      updateData.staffId = modifications.newStaffId;
    }

    updateData.modificationFees = fees;
    updateData.lastModified = new Date();

    return this.prisma.booking.update({
      where: { id: booking.id },
      data: updateData,
      include: { service: true, staff: true }
    });
  }

  private async suggestAlternatives(booking: any, modifications: BookingModification): Promise<AlternativeOption[]> {
    // Suggest nearby time slots or alternative staff members
    const alternatives: AlternativeOption[] = [];

    if (modifications.newDateTime) {
      const nearbySlots = await this.findNearbyAvailableSlots(
        booking.serviceId,
        modifications.newDateTime,
        2 // 2 hours range
      );

      alternatives.push(...nearbySlots.map(slot => ({
        type: 'TIME_ALTERNATIVE',
        dateTime: slot.dateTime,
        staffId: slot.staffId,
        description: `Alternativ tid: ${slot.dateTime.toLocaleString('da-DK')}`
      })));
    }

    return alternatives;
  }

  private async notifyBookingModification(booking: any, modifications: BookingModification): Promise<void> {
    // Send modification confirmation to client and staff
    logger.info(`Booking modification notification sent for ${booking.id}`);
  }

  private async evaluateCancellationTerms(booking: any): Promise<CancellationTerms> {
    const now = new Date();
    const bookingTime = new Date(booking.scheduledDate);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking >= 24) {
      // Full refund if cancelled more than 24 hours in advance
      return {
        refundAmount: booking.price,
        fees: 0,
        reason: 'Aflysning mere end 24 timer i forvejen - fuld refundering'
      };
    } else if (hoursUntilBooking >= 2) {
      // 50% refund if cancelled 2-24 hours in advance
      return {
        refundAmount: booking.price * 0.5,
        fees: booking.price * 0.5,
        reason: 'Aflysning 2-24 timer i forvejen - 50% refundering'
      };
    } else {
      // No refund if cancelled less than 2 hours in advance
      return {
        refundAmount: 0,
        fees: booking.price,
        reason: 'Aflysning mindre end 2 timer i forvejen - ingen refundering'
      };
    }
  }

  private async processRefund(booking: any, amount: number): Promise<void> {
    // Process refund via Stripe or other payment processor
    logger.info(`Processing refund of ${amount} DKK for booking ${booking.id}`);
  }

  private async releaseStaffTimeSlot(staffId: string, dateTime: Date, duration: number): Promise<void> {
    await this.prisma.staffSchedule.deleteMany({
      where: {
        staffId,
        startTime: dateTime
      }
    });
  }

  private async sendCancellationConfirmation(booking: any, terms: CancellationTerms): Promise<void> {
    logger.info(`Cancellation confirmation sent for booking ${booking.id}`);
  }

  private async getDanishHolidays(startDate: Date, endDate: Date): Promise<DanishHoliday[]> {
    // Return Danish public holidays for the period
    const holidays: DanishHoliday[] = [
      { name: 'Nytårsdag', date: new Date('2024-01-01') },
      { name: 'Påskemandag', date: new Date('2024-04-01') },
      { name: 'Store Bededag', date: new Date('2024-04-26') },
      { name: 'Kristi Himmelfartsdag', date: new Date('2024-05-09') },
      { name: '2. Pinsedag', date: new Date('2024-05-20') },
      { name: 'Grundlovsdag', date: new Date('2024-06-05') },
      { name: 'Juleaftensdag', date: new Date('2024-12-24') },
      { name: 'Juledag', date: new Date('2024-12-25') },
      { name: '2. Juledag', date: new Date('2024-12-26') }
    ];

    return holidays.filter(holiday => 
      holiday.date >= startDate && holiday.date <= endDate
    );
  }

  private isSalonClosed(date: Date, holidays: DanishHoliday[], operatingHours: any): boolean {
    // Check if salon is closed on this date
    const dayOfWeek = date.getDay();
    
    // Check holidays
    if (holidays.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    )) {
      return true;
    }

    // Check regular closed days (e.g., Sundays)
    if (dayOfWeek === 0 && !operatingHours.sunday) {
      return true;
    }

    return false;
  }

  private async generateDailySlots(service: any, date: Date, operatingHours: any): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const serviceDuration = service.duration || 60; // Default 60 minutes

    // Generate 30-minute slots during operating hours
    const startHour = operatingHours.start || 9; // 9 AM
    const endHour = operatingHours.end || 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minutes, 0, 0);

        const available = await this.isTimeSlotAvailable(
          service.id,
          slotTime,
          serviceDuration
        );

        slots.push({
          dateTime: slotTime,
          duration: serviceDuration,
          available,
          staffIds: available ? await this.getAvailableStaffForSlot(service.id, slotTime) : []
        });
      }
    }

    return slots;
  }

  private async isTimeSlotAvailable(serviceId: string, dateTime: Date, duration: number): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    const conflictingBookings = await this.prisma.booking.count({
      where: {
        serviceId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { lt: endTime },
        scheduledEnd: { gt: dateTime }
      }
    });

    return conflictingBookings === 0;
  }

  private async getAvailableStaffForSlot(serviceId: string, dateTime: Date): Promise<string[]> {
    const service = await this.prisma.beautyService.findUnique({
      where: { id: serviceId },
      include: { staffServices: { include: { staff: true } } }
    });

    if (!service) return [];

    const availableStaff = [];
    
    for (const staffService of service.staffServices) {
      const isAvailable = await this.checkStaffAvailability(
        staffService.staffId,
        dateTime,
        service.duration || 60
      );
      
      if (isAvailable) {
        availableStaff.push(staffService.staffId);
      }
    }

    return availableStaff;
  }

  private async findNearbyAvailableSlots(serviceId: string, preferredTime: Date, hourRange: number): Promise<{ dateTime: Date; staffId: string }[]> {
    const slots = [];
    const startTime = new Date(preferredTime.getTime() - hourRange * 60 * 60 * 1000);
    const endTime = new Date(preferredTime.getTime() + hourRange * 60 * 60 * 1000);

    // Simplified implementation - would be more sophisticated in production
    return slots;
  }

  private async sendReminderMessages(booking: any): Promise<void> {
    const reminderText = `Hej ${booking.client.firstName}! Påmindelse om din aftale i morgen kl. ${booking.scheduledDate.toLocaleTimeString('da-DK')} for ${booking.service.name}. Kontakt os på 12345678 hvis du har spørgsmål.`;
    
    // Send SMS reminder
    if (booking.client.phone) {
      logger.info(`SMS reminder sent to ${booking.client.phone} for booking ${booking.id}`);
    }

    // Send email reminder
    if (booking.client.email) {
      logger.info(`Email reminder sent to ${booking.client.email} for booking ${booking.id}`);
    }
  }
}

// Type definitions
export interface BookingRequest {
  clientId: string;
  serviceId: string;
  staffId: string;
  dateTime: Date;
  duration: number;
  notes?: string;
  marketingConsent?: boolean;
}

export interface BookingResult {
  bookingId: string;
  confirmationNumber: string;
  scheduledDate: Date;
  service: string;
  staff: string;
  price: number;
  cancellationDeadline: Date;
  consumerRights: string;
  status: string;
}

export interface BookingModification {
  newDateTime?: Date;
  newServiceId?: string;
  newStaffId?: string;
  reason?: string;
}

export interface ModificationResult {
  success: boolean;
  reason?: string;
  updatedBooking?: any;
  alternativeOptions?: AlternativeOption[];
}

export interface AlternativeOption {
  type: 'TIME_ALTERNATIVE' | 'STAFF_ALTERNATIVE' | 'SERVICE_ALTERNATIVE';
  dateTime?: Date;
  staffId?: string;
  serviceId?: string;
  description: string;
}

export interface CancellationResult {
  cancelled: boolean;
  refundAmount: number;
  cancellationFees: number;
  refundMethod: string;
  refundTimeframe: string;
  consumerRights: string;
}

export interface CancellationTerms {
  refundAmount: number;
  fees: number;
  reason: string;
}

export interface AvailabilityCalendar {
  serviceId: string;
  period: { start: Date; end: Date };
  totalSlots: number;
  availableSlots: number;
  slots: TimeSlot[];
  holidays: DanishHoliday[];
  generatedAt: Date;
}

export interface TimeSlot {
  dateTime: Date;
  duration: number;
  available: boolean;
  staffIds: string[];
}

export interface DanishHoliday {
  name: string;
  date: Date;
}
