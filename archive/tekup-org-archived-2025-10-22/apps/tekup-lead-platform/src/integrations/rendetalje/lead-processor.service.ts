import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleWorkspaceService, SLAAction } from './google-workspace.service';
import { CalendarBookingService, TimeSlotSuggestion } from './calendar-booking.service';
import { BillyInvoicingService } from './billy-invoicing.service';
import { LeadPayloadShared } from '@tekup/shared';
// import { LeadQualificationService } from './lead-qualification.service'; // TODO: Implement

export interface RendetaljeLeadData extends LeadPayloadShared {
  // Rendetalje-specific fields
  property_type?: 'lejlighed' | 'hus' | 'erhverv' | 'andet';
  sqm?: number;
  rooms?: number;
  bathrooms?: number;
  kitchen?: boolean;
  furnished?: boolean;
  job_category?: 'ugentlig' | 'hoved' | 'flytte' | 'erhverv' | 'airbnb' | 'efter_handv' | 'events' | 'akut';
  addons?: {
    oven?: boolean;
    fridge?: boolean;
    windows_in?: boolean;
  };
  preferred_dates?: string[];
  address?: {
    street?: string;
    postal_code?: string;
    city?: string;
  };
  estimate?: {
    hours?: number;
    team_hours?: number;
    rate_dkk?: number;
    price_dkk?: number;
    explain?: string;
  };
}

@Injectable()
export class RendetaljeLeadProcessor {
  constructor(
    private prisma: PrismaService,
    private googleWorkspace: GoogleWorkspaceService,
    private calendarBooking: CalendarBookingService,
    private billyInvoicing: BillyInvoicingService,
  ) {}

  /**
   * Validate lead data before processing
   */
  private validateLeadData(leadData: RendetaljeLeadData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!leadData.email) errors.push('Email er påkrævet');
    if (!leadData.phone) errors.push('Telefonnummer er påkrævet');
    if (!leadData.name) errors.push('Navn er påkrævet');
    if (!leadData.address?.postal_code) errors.push('Postnummer er påkrævet');
    
    // Geo-gating: Only Aarhus postal codes
    const aarhusPostalCodes = ['8000', '8200', '8210', '8220', '8230', '8240', '8250', '8260', '8270', '8310', '8362'];
    if (leadData.address?.postal_code && !aarhusPostalCodes.includes(leadData.address.postal_code)) {
      errors.push('Vi servicerer kun Aarhus området');
    }
    
    // Domain validation
    if (!leadData.sqm || leadData.sqm < 10 || leadData.sqm > 500) {
      errors.push('Kvadratmeter skal være mellem 10-500 m²');
    }
    
    if (!leadData.job_category) {
      errors.push('Rengøringstype skal specificeres');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Process qualified Rendetalje lead through complete workflow with validation
   */
  async processQualifiedLead(leadId: string, tenantId: string, options?: { skipValidation?: boolean; messageId?: string }) {
    return this.prisma.withTenant(tenantId, async () => {
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId }
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      // TODO: Fix Prisma model - payload field seems to be missing
      const leadData = (lead as any).payload as RendetaljeLeadData || {};
      
      // Step 1: Validate lead data
      if (!options?.skipValidation) {
        const validation = this.validateLeadData(leadData);
        if (!validation.isValid) {
          throw new Error(`Lead validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Step 2: Generate estimate based on enhanced Rendetalje rules
      const estimate = await this.generateEstimate(leadData);
      
      // Step 3: Suggest optimal time slots
      const timeSlots = await this.calendarBooking.suggestTimeSlots({
        preferredTimeSlots: (leadData as any).preferred_time_slots || ['morning', 'afternoon'],
        urgency: leadData.job_category === 'flytte' ? 'within_week' : leadData.job_category === 'akut' ? 'immediate' : 'flexible',
        estimatedHours: estimate.hours,
      });
      
      // Step 4: Create and send response email with time suggestions
      const emailResponse = await this.createResponseEmailWithTimeSlots(leadData, estimate, timeSlots);
      const emailResult = await this.googleWorkspace.sendEmailWithAttachment(emailResponse);
      
      // Step 5: Apply Gmail label based on lead qualification
      if (options?.messageId) {
        const nextAction = this.determineNextAction(leadData);
        await this.googleWorkspace.applyLeadLabel(options.messageId, nextAction);
        
        // Create SLA action
        const slaAction: SLAAction = {
          leadId,
          action: nextAction as any,
          priority: leadData.job_category === 'akut' ? 'high' : leadData.job_category === 'flytte' ? 'medium' : 'low',
          dueAt: new Date(),
        };
        await this.googleWorkspace.createSLAAction(slaAction);
      }
      
      // Step 6: Update lead with enhanced data
      // TODO: Fix Prisma model - payload field seems to be missing
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          // payload: {
          //   ...leadData,
          //   estimate,
          //   suggested_time_slots: JSON.parse(JSON.stringify(timeSlots)),
          //   response_sent: true,
          //   response_sent_at: new Date().toISOString(),
          //   next_action: 'awaiting_customer_response',
          //   email_message_id: emailResult.messageId,
          //   validation_passed: true
          // }
          status: 'QUALIFIED' // Update status for now
        }
      });

      return {
        leadId,
        estimate,
        suggestedTimeSlots: timeSlots,
        emailSent: true,
        emailMessageId: emailResult.messageId,
        nextSteps: ['awaiting_customer_response', 'follow_up_in_48h', 'sla_tracking_active']
      };
    });
  }

  /**
   * Handle customer acceptance and create booking
   */
  async handleCustomerAcceptance(leadId: string, tenantId: string, acceptedDateTime: Date) {
    return this.prisma.withTenant(tenantId, async () => {
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId }
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      // TODO: Fix Prisma model - payload field seems to be missing
      const leadData = (lead as any).payload as RendetaljeLeadData || {};
      
      // Create calendar booking
      const calendarEvent = await this.calendarBooking.createBooking({
        leadId,
        customerName: leadData.name || 'Kunde',
        customerEmail: leadData.email,
        customerPhone: leadData.phone,
        address: leadData.address,
        serviceType: leadData.job_category || 'ugentlig',
        estimatedHours: leadData.estimate?.hours || 2,
        scheduledDateTime: acceptedDateTime,
        notes: leadData.message
      });

      // Create customer in Billy if not exists
      const billyCustomer = await this.billyInvoicing.createOrUpdateCustomer({
        name: leadData.name || 'Kunde',
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address
      });

      // Update lead status
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONTACTED', // Move to next status in flow-api
          // TODO: Fix Prisma model - payload field seems to be missing
          // payload: {
          //   ...leadData,
          //   booking_confirmed: true,
          //   booking_datetime: acceptedDateTime.toISOString(),
          //   calendar_event_id: calendarEvent.id,
          //   billy_customer_id: billyCustomer.id,
          //   next_action: 'service_scheduled'
          // }
        }
      });

      return {
        leadId,
        bookingConfirmed: true,
        calendarEventId: calendarEvent.id,
        billyCustomerId: billyCustomer.id
      };
    });
  }

  private determineNextAction(leadData: RendetaljeLeadData): string {
    if (leadData.job_category === 'akut') return 'immediate_contact';
    if (leadData.job_category === 'flytte') return 'schedule_follow_up';
    if (leadData.sqm && leadData.sqm > 120) return 'immediate_contact'; // Large properties
    return 'schedule_follow_up';
  }

  /**
   * Generate estimate based on Rendetalje pricing rules
   */
  private async generateEstimate(leadData: RendetaljeLeadData) {
    const HOURLY_RATE = 349; // DKK per hour including VAT
    
    let baseHours = 2.0; // Default baseline
    
    // Adjust based on property size
    if (leadData.sqm) {
      if (leadData.sqm <= 80) baseHours = 2.0;
      else if (leadData.sqm <= 110) baseHours = 3.0;
      else if (leadData.sqm <= 140) baseHours = 4.0;
      else baseHours = 5.0;
    }

    // Adjust based on job type
    switch (leadData.job_category) {
      case 'flytte':
        baseHours *= 2.5; // Moving cleaning takes longer
        break;
      case 'hoved':
        baseHours *= 1.8; // Deep cleaning
        break;
      case 'erhverv':
        baseHours *= 1.2; // Commercial cleaning
        break;
      case 'efter_handv':
        baseHours *= 2.0; // After construction
        break;
    }

    // Add time for addons
    let addonHours = 0;
    if (leadData.addons?.oven) addonHours += 0.5;
    if (leadData.addons?.fridge) addonHours += 0.5;
    if (leadData.addons?.windows_in) addonHours += 1.0;

    const totalHours = baseHours + addonHours;
    const teamHours = totalHours * 2; // 2-person team
    const totalPrice = Math.round(totalHours * HOURLY_RATE);

    return {
      hours: totalHours,
      team_hours: teamHours,
      rate_dkk: HOURLY_RATE,
      price_dkk: totalPrice,
      explain: this.generateEstimateExplanation(leadData, baseHours, addonHours, totalPrice)
    };
  }

  /**
   * Create response email with time slot suggestions
   */
  private async createResponseEmailWithTimeSlots(leadData: RendetaljeLeadData, estimate: any, timeSlots: TimeSlotSuggestion[]) {
    const emailResponse = await this.createResponseEmail(leadData, estimate);
    
    // Add calendar attachment if we have ICS content for the top time slot
    const attachments = [];
    if (timeSlots.length > 0) {
      const topSlot = timeSlots[0];
      // Create a simple ICS for the suggested time
      const icsContent = this.createICSForTimeSlot(topSlot, leadData, estimate);
      attachments.push({
        filename: 'forslag-tid.ics',
        content: Buffer.from(icsContent).toString('base64'),
        mimeType: 'text/calendar; charset=utf-8; method=REQUEST'
      });
    }
    
    return {
      ...emailResponse,
      attachments
    };
  }

  private createICSForTimeSlot(timeSlot: TimeSlotSuggestion, leadData: RendetaljeLeadData, estimate: any): string {
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rendetalje//Lead Response//DA',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@rendetalje.dk`,
      `DTSTART:${formatICSDate(timeSlot.startTime)}`,
      `DTEND:${formatICSDate(timeSlot.endTime)}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `SUMMARY:Forslag: ${leadData.job_category || 'Rengøring'} - ${leadData.name}`,
      `DESCRIPTION:${timeSlot.reason}\\nEstimat: ${estimate.hours} timer - ${estimate.price_dkk} kr`,
      `LOCATION:${leadData.address?.street || ''} ${leadData.address?.postal_code || ''} ${leadData.address?.city || ''}`,
      'STATUS:TENTATIVE',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * Create response email based on Rendetalje templates
   */
  private async createResponseEmail(leadData: RendetaljeLeadData, estimate: any) {
    const isMovingCleaning = leadData.job_category === 'flytte';
    const isCommercial = leadData.job_category === 'erhverv';
    
    let subject: string;
    let body: string;

    if (isMovingCleaning) {
      subject = `Tilbud på flytterengøring - ${leadData.address?.city || 'din bolig'}`;
      body = this.generateMovingCleaningEmail(leadData, estimate);
    } else if (isCommercial) {
      subject = `Tilbud på erhvervsrengøring - ${leadData.company || 'jeres virksomhed'}`;
      body = this.generateCommercialCleaningEmail(leadData, estimate);
    } else {
      subject = `Tilbud på rengøring - ${leadData.address?.city || 'din bolig'}`;
      body = this.generateRegularCleaningEmail(leadData, estimate);
    }

    return {
      to: leadData.email,
      subject,
      body,
      from: 'info@rendetalje.dk'
    };
  }

  private generateRegularCleaningEmail(leadData: RendetaljeLeadData, estimate: any): string {
    return `Hej ${leadData.name || 'kunde'}

Vores timepris er 349 kr inkl. moms.
Estimat: ca. ${estimate.hours} timer pr. gang → ca. ${estimate.price_dkk} kr.
Tiden starter når vi går ind og slutter når vi går ud.

Vi kan tilbyde ${this.suggestTimeSlots()}.
Hvad passer dig bedst?

Mvh Rendetalje.dk · 22 65 02 26`;
  }

  private generateMovingCleaningEmail(leadData: RendetaljeLeadData, estimate: any): string {
    const priceRange = `${estimate.price_dkk - 500}-${estimate.price_dkk + 500}`;
    
    return `Hej ${leadData.name || 'kunde'}

Estimat: ${estimate.hours}-${estimate.hours + 2} teamtimer afhængig af køkken/bad/ovn/vinduer → ca. ${priceRange} kr.
Vi kan komme ${this.suggestTimeSlots()}.
Bekræft gerne adresse og ønsket tidspunkt.

Mvh Rendetalje.dk · 22 65 02 26`;
  }

  private generateCommercialCleaningEmail(leadData: RendetaljeLeadData, estimate: any): string {
    return `Hej ${leadData.name || 'kunde'}

Vi tilbyder erhvervsrengøring efter kl. 16. 349 kr/t inkl. moms.
Estimat ${estimate.hours} t/uge inkl. skrald og papir.

Forslag: ${this.suggestTimeSlots()}.

Mvh Rendetalje.dk · 22 65 02 26`;
  }

  private generateEstimateExplanation(leadData: RendetaljeLeadData, baseHours: number, addonHours: number, totalPrice: number): string {
    let explanation = `Basistid: ${baseHours} timer`;
    
    if (leadData.sqm) {
      explanation += ` (${leadData.sqm} m²)`;
    }
    
    if (addonHours > 0) {
      explanation += `, tillæg: ${addonHours} timer`;
    }
    
    explanation += `. Total: ${totalPrice} kr inkl. moms.`;
    
    return explanation;
  }

  private suggestTimeSlots(): string {
    // Generate two available time slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const days = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    
    return `${days[tomorrow.getDay()]} kl. 10 eller ${days[dayAfter.getDay()]} kl. 9`;
  }
}
