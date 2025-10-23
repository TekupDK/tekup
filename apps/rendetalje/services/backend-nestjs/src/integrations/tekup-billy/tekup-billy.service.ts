import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationService, IntegrationConfig } from '../integration.service';

export interface BillyCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  vatNumber?: string;
  organizationNumber?: string;
}

export interface BillyProduct {
  id?: string;
  name: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
  productNumber?: string;
}

export interface BillyInvoiceLine {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalAmount: number;
}

export interface BillyInvoice {
  id?: string;
  customerId: string;
  invoiceNumber?: string;
  date: string;
  dueDate: string;
  lines: BillyInvoiceLine[];
  notes?: string;
  reference?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  totalAmount?: number;
  vatAmount?: number;
  currency?: string;
}

export interface BillyPayment {
  id?: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

@Injectable()
export class TekupBillyService {
  private readonly logger = new Logger(TekupBillyService.name);
  private readonly config: IntegrationConfig;

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('integrations.tekupBilly.url'),
      apiKey: this.configService.get<string>('integrations.tekupBilly.apiKey'),
      timeout: 30000,
      retries: 2,
    };

    if (!this.config.baseUrl || !this.config.apiKey) {
      this.logger.warn('Tekup-Billy integration not configured properly');
    }
  }

  // Customer Management
  async createCustomer(customerData: BillyCustomer): Promise<BillyCustomer> {
    try {
      this.logger.debug('Creating customer in Billy.dk', { name: customerData.name });
      
      const response = await this.integrationService.post<BillyCustomer>(
        'tekup-billy',
        this.config,
        '/customers',
        customerData,
      );

      this.logger.log(`Customer created in Billy.dk: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create customer in Billy.dk', error);
      throw new BadRequestException(`Failed to create customer in Billy.dk: ${error.message}`);
    }
  }

  async updateCustomer(customerId: string, customerData: Partial<BillyCustomer>): Promise<BillyCustomer> {
    try {
      this.logger.debug('Updating customer in Billy.dk', { customerId });
      
      const response = await this.integrationService.put<BillyCustomer>(
        'tekup-billy',
        this.config,
        `/customers/${customerId}`,
        customerData,
      );

      this.logger.log(`Customer updated in Billy.dk: ${customerId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to update customer in Billy.dk', error);
      throw new BadRequestException(`Failed to update customer in Billy.dk: ${error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<BillyCustomer> {
    try {
      const response = await this.integrationService.get<BillyCustomer>(
        'tekup-billy',
        this.config,
        `/customers/${customerId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get customer from Billy.dk', error);
      throw new BadRequestException(`Failed to get customer from Billy.dk: ${error.message}`);
    }
  }

  async searchCustomers(query: string): Promise<BillyCustomer[]> {
    try {
      const response = await this.integrationService.get<BillyCustomer[]>(
        'tekup-billy',
        this.config,
        `/customers/search?q=${encodeURIComponent(query)}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to search customers in Billy.dk', error);
      throw new BadRequestException(`Failed to search customers in Billy.dk: ${error.message}`);
    }
  }

  // Product Management
  async createProduct(productData: BillyProduct): Promise<BillyProduct> {
    try {
      this.logger.debug('Creating product in Billy.dk', { name: productData.name });
      
      const response = await this.integrationService.post<BillyProduct>(
        'tekup-billy',
        this.config,
        '/products',
        productData,
      );

      this.logger.log(`Product created in Billy.dk: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create product in Billy.dk', error);
      throw new BadRequestException(`Failed to create product in Billy.dk: ${error.message}`);
    }
  }

  async getProducts(): Promise<BillyProduct[]> {
    try {
      const response = await this.integrationService.get<BillyProduct[]>(
        'tekup-billy',
        this.config,
        '/products',
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get products from Billy.dk', error);
      throw new BadRequestException(`Failed to get products from Billy.dk: ${error.message}`);
    }
  }

  // Invoice Management
  async createInvoice(invoiceData: BillyInvoice): Promise<BillyInvoice> {
    try {
      this.logger.debug('Creating invoice in Billy.dk', { 
        customerId: invoiceData.customerId,
        totalAmount: invoiceData.totalAmount 
      });
      
      const response = await this.integrationService.post<BillyInvoice>(
        'tekup-billy',
        this.config,
        '/invoices',
        invoiceData,
      );

      this.logger.log(`Invoice created in Billy.dk: ${response.id} (${response.invoiceNumber})`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create invoice in Billy.dk', error);
      throw new BadRequestException(`Failed to create invoice in Billy.dk: ${error.message}`);
    }
  }

  async getInvoice(invoiceId: string): Promise<BillyInvoice> {
    try {
      const response = await this.integrationService.get<BillyInvoice>(
        'tekup-billy',
        this.config,
        `/invoices/${invoiceId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get invoice from Billy.dk', error);
      throw new BadRequestException(`Failed to get invoice from Billy.dk: ${error.message}`);
    }
  }

  async sendInvoice(invoiceId: string, email?: string): Promise<void> {
    try {
      this.logger.debug('Sending invoice via Billy.dk', { invoiceId, email });
      
      await this.integrationService.post(
        'tekup-billy',
        this.config,
        `/invoices/${invoiceId}/send`,
        { email },
      );

      this.logger.log(`Invoice sent via Billy.dk: ${invoiceId}`);
    } catch (error) {
      this.logger.error('Failed to send invoice via Billy.dk', error);
      throw new BadRequestException(`Failed to send invoice via Billy.dk: ${error.message}`);
    }
  }

  async getInvoicePdf(invoiceId: string): Promise<Buffer> {
    try {
      const response = await this.integrationService.get<ArrayBuffer>(
        'tekup-billy',
        this.config,
        `/invoices/${invoiceId}/pdf`,
      );

      return Buffer.from(response);
    } catch (error) {
      this.logger.error('Failed to get invoice PDF from Billy.dk', error);
      throw new BadRequestException(`Failed to get invoice PDF from Billy.dk: ${error.message}`);
    }
  }

  // Payment Management
  async recordPayment(paymentData: BillyPayment): Promise<BillyPayment> {
    try {
      this.logger.debug('Recording payment in Billy.dk', { 
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount 
      });
      
      const response = await this.integrationService.post<BillyPayment>(
        'tekup-billy',
        this.config,
        '/payments',
        paymentData,
      );

      this.logger.log(`Payment recorded in Billy.dk: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to record payment in Billy.dk', error);
      throw new BadRequestException(`Failed to record payment in Billy.dk: ${error.message}`);
    }
  }

  async getPayments(invoiceId?: string): Promise<BillyPayment[]> {
    try {
      const endpoint = invoiceId ? `/payments?invoiceId=${invoiceId}` : '/payments';
      const response = await this.integrationService.get<BillyPayment[]>(
        'tekup-billy',
        this.config,
        endpoint,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get payments from Billy.dk', error);
      throw new BadRequestException(`Failed to get payments from Billy.dk: ${error.message}`);
    }
  }

  // Financial Reports
  async getFinancialReport(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const response = await this.integrationService.get(
        'tekup-billy',
        this.config,
        `/reports/financial?from=${dateFrom}&to=${dateTo}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to get financial report from Billy.dk', error);
      throw new BadRequestException(`Failed to get financial report from Billy.dk: ${error.message}`);
    }
  }

  // Webhook handling
  async handleWebhook(webhookData: any): Promise<void> {
    try {
      this.logger.debug('Processing Billy.dk webhook', { type: webhookData.type });

      switch (webhookData.type) {
        case 'invoice.paid':
          await this.handleInvoicePaid(webhookData.data);
          break;
        case 'invoice.overdue':
          await this.handleInvoiceOverdue(webhookData.data);
          break;
        case 'payment.received':
          await this.handlePaymentReceived(webhookData.data);
          break;
        default:
          this.logger.warn(`Unknown webhook type: ${webhookData.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to process Billy.dk webhook', error);
      throw error;
    }
  }

  // Utility methods for job integration
  async createInvoiceFromJob(jobData: any, customerData: any): Promise<BillyInvoice> {
    try {
      // Ensure customer exists in Billy.dk
      let billyCustomer: BillyCustomer;
      try {
        billyCustomer = await this.getCustomer(customerData.billy_customer_id);
      } catch (error) {
        // Customer doesn't exist, create it
        billyCustomer = await this.createCustomer({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address ? {
            street: customerData.address.street,
            city: customerData.address.city,
            zipCode: customerData.address.postal_code,
            country: customerData.address.country,
          } : undefined,
        });
      }

      // Create invoice lines based on job data
      const lines: BillyInvoiceLine[] = [{
        description: `${this.getServiceTypeName(jobData.service_type)} - ${jobData.job_number}`,
        quantity: 1,
        unitPrice: jobData.profitability?.total_price || 0,
        vatRate: 25, // Danish VAT rate
        totalAmount: jobData.profitability?.total_price || 0,
      }];

      // Create invoice
      const invoiceData: BillyInvoice = {
        customerId: billyCustomer.id!,
        date: new Date().toISOString().split('T')[0],
        dueDate: this.calculateDueDate(14), // 14 days payment terms
        lines,
        notes: jobData.special_instructions,
        reference: jobData.job_number,
        currency: 'DKK',
      };

      return await this.createInvoice(invoiceData);
    } catch (error) {
      this.logger.error('Failed to create invoice from job', error);
      throw error;
    }
  }

  private async handleInvoicePaid(invoiceData: any): Promise<void> {
    this.logger.log(`Invoice paid: ${invoiceData.id}`);
    // TODO: Update job status, send notifications, etc.
  }

  private async handleInvoiceOverdue(invoiceData: any): Promise<void> {
    this.logger.log(`Invoice overdue: ${invoiceData.id}`);
    // TODO: Send overdue notifications, update customer status, etc.
  }

  private async handlePaymentReceived(paymentData: any): Promise<void> {
    this.logger.log(`Payment received: ${paymentData.id}`);
    // TODO: Update payment status, send confirmation, etc.
  }

  private getServiceTypeName(serviceType: string): string {
    const serviceNames = {
      standard: 'Standard Rengøring',
      deep: 'Hovedrengøring',
      window: 'Vinduespolering',
      moveout: 'Fraflytningsrengøring',
      office: 'Kontorrengøring',
    };
    return serviceNames[serviceType] || serviceType;
  }

  private calculateDueDate(days: number): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.integrationService.get(
        'tekup-billy',
        this.config,
        '/health',
      );
      return true;
    } catch (error) {
      this.logger.error('Billy.dk health check failed', error);
      return false;
    }
  }
}