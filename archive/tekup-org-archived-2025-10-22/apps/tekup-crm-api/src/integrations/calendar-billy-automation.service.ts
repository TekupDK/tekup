import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DanishBillingIntegrationService } from '../danish/billing-integration.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('calendar-billy-automation');

@Injectable()
export class CalendarBillyAutomationService {
  constructor(
    private prisma: PrismaService,
    private billingService: DanishBillingIntegrationService
  ) {}

  /**
   * Automatisk oprettelse af Deal og Billy invoice efter Calendar event completion
   */
  async processCompletedCalendarEvent(eventId: string, eventData: any): Promise<void> {
    try {
      logger.info(`Processing completed calendar event: ${eventId}`);

      // Parse event data
      const serviceDetails = this.parseCalendarEventData(eventData);
      
      // Create or find contact
      const contact = await this.createOrFindContact(serviceDetails);
      
      // Create company if needed
      const company = await this.createOrFindCompany(serviceDetails, contact.id);
      
      // Create deal
      const deal = await this.createDealFromService(serviceDetails, contact.id, company.id);
      
      // Create Billy invoice
      const invoiceResult = await this.billingService.createBillyInvoice(deal.id);
      
      if (invoiceResult.success) {
        logger.info(`Successfully created invoice for event ${eventId}: ${invoiceResult.invoiceNumber}`);
        
        // Send invoice email to customer
        await this.sendInvoiceNotification(contact.email, invoiceResult);
        
        // Update calendar event with deal reference
        await this.updateCalendarEventWithDeal(eventId, deal.id, invoiceResult.billyInvoiceId);
      }

    } catch (error) {
      logger.error(`Failed to process calendar event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Parse Calendar event data til service detaljer
   */
  private parseCalendarEventData(eventData: any) {
    const description = eventData.description || '';
    const summary = eventData.summary || '';
    
    // Extract customer info from description
    const customerMatch = description.match(/Kunde:\s*(.+)/i);
    const contactMatch = description.match(/Kontakt:\s*([^,]+),?\s*(.+)/i);
    const addressMatch = description.match(/Adresse:\s*(.+)/i);
    const priceMatch = description.match(/(\d+)\s*kr/i);
    const hoursMatch = description.match(/(\d+(?:\.\d+)?)\s*timer/i);
    
    const customerName = customerMatch?.[1]?.trim() || 'Ukendt kunde';
    const phone = contactMatch?.[1]?.trim();
    const email = contactMatch?.[2]?.trim();
    const address = addressMatch?.[1]?.trim();
    const price = priceMatch ? parseInt(priceMatch[1]) : 698; // Default price
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 2; // Default 2 hours
    
    // Extract service type from summary
    let serviceType = 'Standard rengøring';
    if (summary.toLowerCase().includes('hovedrengøring')) serviceType = 'Hovedrengøring';
    if (summary.toLowerCase().includes('flytterengøring')) serviceType = 'Flytterengøring';
    if (summary.toLowerCase().includes('kontorrengøring')) serviceType = 'Kontorrengøring';

    return {
      customerName,
      phone,
      email,
      address,
      serviceType,
      price,
      hours,
      eventStart: eventData.start,
      eventEnd: eventData.end,
      location: eventData.location || address
    };
  }

  /**
   * Opret eller find eksisterende contact
   */
  private async createOrFindContact(serviceDetails: any) {
    const { customerName, phone, email } = serviceDetails;
    
    // Try to find existing contact by email or phone
    let contact = null;
    if (email) {
      contact = await this.prisma.contact.findFirst({
        where: { email }
      });
    }
    
    if (!contact && phone) {
      contact = await this.prisma.contact.findFirst({
        where: { phone }
      });
    }

    if (contact) {
      logger.info(`Found existing contact: ${contact.id}`);
      return contact;
    }

    // Create new contact
    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    contact = await this.prisma.contact.create({
      data: {
        tenantId: 'default', // TODO: Get from context
        firstName,
        lastName,
        email,
        phone,
        address: serviceDetails.address
      }
    });

    logger.info(`Created new contact: ${contact.id}`);
    return contact;
  }

  /**
   * Opret eller find eksisterende company
   */
  private async createOrFindCompany(serviceDetails: any, contactId: string) {
    // For private customers, create a simple company record
    const companyName = `${serviceDetails.customerName} (Privat)`;
    
    let company = await this.prisma.company.findFirst({
      where: { 
        name: companyName,
        tenantId: 'default'
      }
    });

    if (company) {
      return company;
    }

    company = await this.prisma.company.create({
      data: {
        tenantId: 'default',
        name: companyName,
        industry: 'Private',
        address: serviceDetails.address
      }
    });

    logger.info(`Created new company: ${company.id}`);
    return company;
  }

  /**
   * Opret Deal baseret på service detaljer
   */
  private async createDealFromService(serviceDetails: any, contactId: string, companyId: string) {
    // Find or create deal stage
    let stage = await this.prisma.dealStage.findFirst({
      where: { 
        name: 'Completed',
        tenantId: 'default'
      }
    });

    if (!stage) {
      stage = await this.prisma.dealStage.create({
        data: {
          tenantId: 'default',
          name: 'Completed',
          color: '#10b981'
        }
      });
    }

    const deal = await this.prisma.deal.create({
      data: {
        tenantId: 'default',
        companyId,
        name: `${serviceDetails.serviceType} - ${serviceDetails.customerName}`,
        description: `${serviceDetails.serviceType} udført ${serviceDetails.eventStart}. Varighed: ${serviceDetails.hours} timer.`,
        value: serviceDetails.price,
        currency: 'DKK',
        stageId: stage.id,
        closeDate: new Date(serviceDetails.eventStart)
      }
    });

    // Link contact to deal
    await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        contacts: {
          connect: { id: contactId }
        }
      }
    });

    logger.info(`Created deal: ${deal.id} (${serviceDetails.price} DKK)`);
    return deal;
  }

  /**
   * Send invoice notification til kunde
   */
  private async sendInvoiceNotification(email: string, invoiceResult: any): Promise<void> {
    if (!email) return;

    // TODO: Implement email service integration
    logger.info(`Invoice notification would be sent to ${email}:`, {
      invoiceNumber: invoiceResult.invoiceNumber,
      amount: invoiceResult.amount,
      pdfUrl: invoiceResult.pdfUrl
    });
  }

  /**
   * Opdater Calendar event med Deal reference
   */
  private async updateCalendarEventWithDeal(eventId: string, dealId: string, billyInvoiceId?: string): Promise<void> {
    // TODO: Implement Google Calendar API update
    logger.info(`Calendar event ${eventId} would be updated with deal ${dealId} and invoice ${billyInvoiceId}`);
  }

  /**
   * Batch process alle completed events fra i dag
   */
  async processCompletedEventsToday(): Promise<void> {
    // TODO: Implement Google Calendar API integration to fetch completed events
    logger.info('Processing completed events from today...');
    
    // For now, this would be called by a scheduled job
    // that fetches completed calendar events and processes them
  }

  /**
   * Manual trigger for processing specific event
   */
  async manualProcessEvent(eventId: string): Promise<{ success: boolean; dealId?: string; invoiceId?: string; error?: string }> {
    try {
      // TODO: Fetch event data from Google Calendar API
      const mockEventData = {
        id: eventId,
        summary: '🏠 HOVEDRENGØRING - Natascha Kring',
        description: `🏠 <strong>HOVEDRENGØRING</strong> - Natascha Kring

<strong>Kunde:</strong> Natascha Kring
<strong>Kontakt:</strong> 28602472, kringnatascha@gmail.com
<strong>Type:</strong> Dybderengøring af badeværelse (6 kvm)
<strong>Adresse:</strong> Mølleparken 33, 8320 Mårslet

<strong>📋 OPGAVEN OMFATTER:</strong>
• Professionel dybderengøring af badeværelse på 6 kvm
• Særligt fokus på væggene i brusenichen
• Grundig afkalkning og rengøring
• Svanemærkede produkter og specialudstyr

<strong>⏱️ ESTIMAT:</strong>
• <strong>Fakturerbare timer:</strong> 1,5-2 timer
• <strong>Pris:</strong> 524-698 kr inkl. moms (349 kr/time)`,
        start: '2025-09-15T13:00:00+02:00',
        end: '2025-09-15T15:00:00+02:00',
        location: 'Mølleparken 33, 8320 Mårslet'
      };

      await this.processCompletedCalendarEvent(eventId, mockEventData);
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
