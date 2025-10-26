import { Injectable } from '@nestjs/common';
// import { loadConfig } from '@tekup/config'; // TODO: Fix module type issues
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-tekup-lead-platform-src-i');

export interface BillyCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    postal_code?: string;
    city?: string;
  };
}

export interface BillyInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

@Injectable()
export class BillyInvoicingService {
  private readonly billyApiUrl = 'https://api.billysbilling.com/v2';
  private readonly apiKey: string;

  constructor() {
    // Use environment variable directly for now - Billy API key should be in env
    this.apiKey = process.env.BILLY_API_KEY || '';
  }

  /**
   * Create or update customer in Billy
   */
  async createOrUpdateCustomer(customerData: Omit<BillyCustomer, 'id'>): Promise<BillyCustomer> {
    try {
      // First, try to find existing customer by email
      const existingCustomer = await this.findCustomerByEmail(customerData.email);
      
      if (existingCustomer) {
        return this.updateCustomer(existingCustomer.id, customerData);
      }

      // Create new customer
      const response = await this.billyApiRequest('POST', '/contacts', {
        type: 'customer',
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        street: customerData.address?.street,
        zipcode: customerData.address?.postal_code,
        city: customerData.address?.city,
        countryId: 'DK', // Denmark
      });

      return {
        id: response.contacts[0].id,
        name: response.contacts[0].name,
        email: response.contacts[0].email,
        phone: response.contacts[0].phone,
        address: {
          street: response.contacts[0].street,
          postal_code: response.contacts[0].zipcode,
          city: response.contacts[0].city,
        },
      };
    } catch (error) {
      logger.error('Failed to create/update Billy customer:', error);
      throw new Error(`Billy customer operation failed: ${error.message}`);
    }
  }

  /**
   * Create invoice in Billy
   */
  async createInvoice(
    customerId: string,
    lineItems: InvoiceLineItem[],
    dueDate?: Date
  ): Promise<BillyInvoice> {
    try {
      const invoiceDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      const response = await this.billyApiRequest('POST', '/invoices', {
        contactId: customerId,
        entryDate: new Date().toISOString().split('T')[0],
        dueDate: invoiceDueDate.toISOString().split('T')[0],
        currencyId: 'DKK',
        lines: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRateId: this.getVatRateId(item.vatRate),
        })),
      });

      const invoice = response.invoices[0];
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNo,
        customerId: invoice.contactId,
        amount: invoice.totalGrossAmount,
        currency: invoice.currencyId,
        status: invoice.state as any,
        dueDate: new Date(invoice.dueDate),
      };
    } catch (error) {
      logger.error('Failed to create Billy invoice:', error);
      throw new Error(`Billy invoice creation failed: ${error.message}`);
    }
  }

  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId: string, emailMessage?: string): Promise<boolean> {
    try {
      await this.billyApiRequest('POST', `/invoices/${invoiceId}/send`, {
        method: 'email',
        message: emailMessage || 'Tak for din bestilling. Vedlagt finder du fakturaen.',
      });

      return true;
    } catch (error) {
      logger.error('Failed to send Billy invoice:', error);
      return false;
    }
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(invoiceId: string): Promise<BillyInvoice | null> {
    try {
      const response = await this.billyApiRequest('GET', `/invoices/${invoiceId}`);
      const invoice = response.invoices[0];

      if (!invoice) return null;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNo,
        customerId: invoice.contactId,
        amount: invoice.totalGrossAmount,
        currency: invoice.currencyId,
        status: invoice.state as any,
        dueDate: new Date(invoice.dueDate),
      };
    } catch (error) {
      logger.error('Failed to get Billy invoice status:', error);
      return null;
    }
  }

  /**
   * Create standard cleaning service invoice
   */
  async createCleaningInvoice(
    customerId: string,
    serviceType: string,
    hours: number,
    hourlyRate: number = 349,
    serviceDate?: Date
  ): Promise<BillyInvoice> {
    const lineItems: InvoiceLineItem[] = [
      {
        description: `${this.getServiceDescription(serviceType)} - ${serviceDate ? serviceDate.toLocaleDateString('da-DK') : 'dato aftales'}`,
        quantity: hours,
        unitPrice: hourlyRate,
        vatRate: 25, // 25% Danish VAT
      },
    ];

    return this.createInvoice(customerId, lineItems);
  }

  /**
   * Find customer by email
   */
  private async findCustomerByEmail(email?: string): Promise<BillyCustomer | null> {
    if (!email) return null;

    try {
      const response = await this.billyApiRequest('GET', `/contacts?email=${encodeURIComponent(email)}`);
      const contacts = response.contacts || [];
      
      if (contacts.length === 0) return null;

      const contact = contacts[0];
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: {
          street: contact.street,
          postal_code: contact.zipcode,
          city: contact.city,
        },
      };
    } catch (error) {
      logger.error('Failed to find Billy customer by email:', error);
      return null;
    }
  }

  /**
   * Update existing customer
   */
  private async updateCustomer(customerId: string, customerData: Omit<BillyCustomer, 'id'>): Promise<BillyCustomer> {
    try {
      const response = await this.billyApiRequest('PUT', `/contacts/${customerId}`, {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        street: customerData.address?.street,
        zipcode: customerData.address?.postal_code,
        city: customerData.address?.city,
      });

      const contact = response.contacts[0];
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: {
          street: contact.street,
          postal_code: contact.zipcode,
          city: contact.city,
        },
      };
    } catch (error) {
      logger.error('Failed to update Billy customer:', error);
      throw new Error(`Billy customer update failed: ${error.message}`);
    }
  }

  /**
   * Make API request to Billy
   */
  private async billyApiRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.billyApiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': this.apiKey,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billy API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get VAT rate ID for Billy
   */
  private getVatRateId(vatRate: number): string {
    // Standard Danish VAT rates in Billy
    switch (vatRate) {
      case 25: return 'DK25'; // Standard VAT
      case 0: return 'DK0';   // No VAT
      default: return 'DK25'; // Default to 25%
    }
  }

  /**
   * Get service description in Danish
   */
  private getServiceDescription(serviceType: string): string {
    const descriptions = {
      'ugentlig': 'Ugentlig rengøring',
      'hoved': 'Hovedrengøring',
      'flytte': 'Flytterengøring',
      'erhverv': 'Erhvervsrengøring',
      'airbnb': 'Airbnb rengøring',
      'efter_handv': 'Rengøring efter håndværker',
      'events': 'Event rengøring',
      'akut': 'Akut rengøring',
    };

    return descriptions[serviceType as keyof typeof descriptions] || 'Rengøring';
  }
}
