import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('tekup-crm-billing-integration');

@Injectable()
export class DanishBillingIntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly billyApiUrl = 'https://api.billysbilling.com/v2';
  private readonly billyApiKey = process.env.BILLY_API_KEY;

  /**
   * Create invoice in Billy accounting system
   */
  async createBillyInvoice(dealId: string): Promise<BillingIntegrationResult> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          contact: {
            include: { company: true }
          }
        }
      });

      if (!deal?.contact?.company?.cvr) {
        throw new Error('Company CVR required for Danish billing integration');
      }

      const billyInvoice = {
        contactId: await this.getOrCreateBillyContact(deal.contact.company),
        description: deal.title,
        currency: 'DKK',
        vatMode: 'vatInclusive',
        lines: [{
          description: deal.title,
          unitPrice: deal.value,
          quantity: 1,
          vatRate: 0.25, // 25% Danish VAT
          product: {
            name: deal.title,
            salesPrice: deal.value,
            vatRateId: 'standard_dk_vat'
          }
        }],
        paymentTerms: {
          numberOfDays: 30,
          percentage: 0
        },
        layout: {
          logoId: process.env.BILLY_LOGO_ID,
          colorScheme: 'blue'
        }
      };

      const response = await fetch(`${this.billyApiUrl}/invoices`, {
        method: 'POST',
        headers: {
          'X-Access-Token': this.billyApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billyInvoice)
      });

      if (!response.ok) {
        throw new Error(`Billy API error: ${response.status}`);
      }

      const billyInvoiceData = await response.json();

      // Update deal with Billy invoice reference
      await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          billingIntegration: {
            billyInvoiceId: billyInvoiceData.id,
            billyInvoiceNumber: billyInvoiceData.invoiceNo,
            invoiceUrl: billyInvoiceData.pdfDownloadUrl,
            status: 'CREATED',
            createdAt: new Date()
          }
        }
      });

      // Create activity log
      await this.prisma.activity.create({
        data: {
          type: 'INVOICE_CREATED',
          description: `Danish invoice created via Billy: ${billyInvoiceData.invoiceNo}`,
          dealId,
          companyId: deal.contact.companyId,
          metadata: {
            billyInvoiceId: billyInvoiceData.id,
            invoiceNumber: billyInvoiceData.invoiceNo,
            amount: deal.value,
            currency: 'DKK'
          }
        }
      });

      logger.info(`Billy invoice created for deal ${dealId}: ${billyInvoiceData.invoiceNo}`);

      return {
        success: true,
        billyInvoiceId: billyInvoiceData.id,
        invoiceNumber: billyInvoiceData.invoiceNo,
        pdfUrl: billyInvoiceData.pdfDownloadUrl,
        amount: deal.value,
        currency: 'DKK'
      };

    } catch (error) {
      logger.error(`Billy invoice creation failed for deal ${dealId}:`, error);
      
      // Log failed attempt
      await this.prisma.activity.create({
        data: {
          type: 'INVOICE_CREATION_FAILED',
          description: `Failed to create Danish invoice: ${error.message}`,
          dealId,
          metadata: { error: error.message }
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync payment status from Billy
   */
  async syncBillyPaymentStatus(dealId: string): Promise<void> {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId }
      });

      if (!deal?.billingIntegration?.billyInvoiceId) {
        throw new Error('No Billy invoice found for this deal');
      }

      const response = await fetch(`${this.billyApiUrl}/invoices/${deal.billingIntegration.billyInvoiceId}`, {
        headers: {
          'X-Access-Token': this.billyApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Billy API error: ${response.status}`);
      }

      const invoiceData = await response.json();
      const paymentStatus = this.mapBillyPaymentStatus(invoiceData.state);

      // Update deal with payment status
      await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          billingIntegration: {
            ...deal.billingIntegration,
            status: paymentStatus,
            paidAt: invoiceData.paidDate ? new Date(invoiceData.paidDate) : null,
            lastSync: new Date()
          }
        }
      });

      // Create activity if payment status changed
      if (paymentStatus === 'PAID' && deal.billingIntegration.status !== 'PAID') {
        await this.prisma.activity.create({
          data: {
            type: 'PAYMENT_RECEIVED',
            description: `Payment received for invoice ${deal.billingIntegration.billyInvoiceNumber}`,
            dealId,
            metadata: {
              billyInvoiceId: deal.billingIntegration.billyInvoiceId,
              paidAmount: invoiceData.totalAmount,
              paidDate: invoiceData.paidDate
            }
          }
        });
      }

      logger.info(`Payment status synced for deal ${dealId}: ${paymentStatus}`);

    } catch (error) {
      logger.error(`Payment status sync failed for deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Generate Danish tax report (SKAT integration placeholder)
   */
  async generateDanishTaxReport(tenantId: string, year: number): Promise<DanishTaxReport> {
    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        status: 'WON',
        billingIntegration: { not: null },
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      },
      include: {
        contact: {
          include: { company: true }
        }
      }
    });

    const report: DanishTaxReport = {
      year,
      tenantId,
      totalRevenue: 0,
      totalVAT: 0,
      transactions: [],
      generatedAt: new Date()
    };

    for (const deal of deals) {
      const vatAmount = deal.value * 0.25; // 25% Danish VAT
      const netAmount = deal.value - vatAmount;

      report.totalRevenue += netAmount;
      report.totalVAT += vatAmount;
      
      report.transactions.push({
        dealId: deal.id,
        invoiceNumber: deal.billingIntegration?.billyInvoiceNumber,
        customerCVR: deal.contact?.company?.cvr,
        customerName: deal.contact?.company?.name,
        grossAmount: deal.value,
        netAmount,
        vatAmount,
        date: deal.createdAt
      });
    }

    // This would integrate with SKAT (Danish Tax Authority) APIs in production
    logger.info(`Danish tax report generated for ${tenantId}, year ${year}: ${report.totalRevenue} DKK net revenue`);

    return report;
  }

  /**
   * Get or create contact in Billy system
   */
  private async getOrCreateBillyContact(company: any): Promise<string> {
    // First, try to find existing contact by CVR
    const searchResponse = await fetch(`${this.billyApiUrl}/contacts?vatNo=${company.cvr}`, {
      headers: {
        'X-Access-Token': this.billyApiKey
      }
    });

    if (searchResponse.ok) {
      const contacts = await searchResponse.json();
      if (contacts.contacts && contacts.contacts.length > 0) {
        return contacts.contacts[0].id;
      }
    }

    // Create new contact in Billy
    const newContact = {
      type: 'company',
      name: company.name,
      vatNo: company.cvr,
      address: company.address?.street,
      zipcode: company.address?.postalCode,
      city: company.address?.city,
      countryId: 'DK',
      phone: company.phone,
      email: company.email,
      website: company.website
    };

    const createResponse = await fetch(`${this.billyApiUrl}/contacts`, {
      method: 'POST',
      headers: {
        'X-Access-Token': this.billyApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newContact)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create Billy contact: ${createResponse.status}`);
    }

    const billyContact = await createResponse.json();
    return billyContact.id;
  }

  private mapBillyPaymentStatus(billyState: string): string {
    switch (billyState) {
      case 'paid': return 'PAID';
      case 'sent': return 'SENT';
      case 'approved': return 'APPROVED';
      case 'overdue': return 'OVERDUE';
      default: return 'CREATED';
    }
  }
}

export interface BillingIntegrationResult {
  success: boolean;
  billyInvoiceId?: string;
  invoiceNumber?: string;
  pdfUrl?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface DanishTaxReport {
  year: number;
  tenantId: string;
  totalRevenue: number;
  totalVAT: number;
  transactions: Array<{
    dealId: string;
    invoiceNumber?: string;
    customerCVR?: string;
    customerName?: string;
    grossAmount: number;
    netAmount: number;
    vatAmount: number;
    date: Date;
  }>;
  generatedAt: Date;
}
