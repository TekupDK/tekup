import { ConfigService } from '@nestjs/config';
import { IntegrationService } from '../integration.service';
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
export declare class TekupBillyService {
    private readonly integrationService;
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(integrationService: IntegrationService, configService: ConfigService);
    createCustomer(customerData: BillyCustomer): Promise<BillyCustomer>;
    updateCustomer(customerId: string, customerData: Partial<BillyCustomer>): Promise<BillyCustomer>;
    getCustomer(customerId: string): Promise<BillyCustomer>;
    searchCustomers(query: string): Promise<BillyCustomer[]>;
    createProduct(productData: BillyProduct): Promise<BillyProduct>;
    getProducts(): Promise<BillyProduct[]>;
    createInvoice(invoiceData: BillyInvoice): Promise<BillyInvoice>;
    getInvoice(invoiceId: string): Promise<BillyInvoice>;
    sendInvoice(invoiceId: string, email?: string): Promise<void>;
    getInvoicePdf(invoiceId: string): Promise<Buffer>;
    recordPayment(paymentData: BillyPayment): Promise<BillyPayment>;
    getPayments(invoiceId?: string): Promise<BillyPayment[]>;
    getFinancialReport(dateFrom: string, dateTo: string): Promise<any>;
    handleWebhook(webhookData: any): Promise<void>;
    createInvoiceFromJob(jobData: any, customerData: any): Promise<BillyInvoice>;
    private handleInvoicePaid;
    private handleInvoiceOverdue;
    private handlePaymentReceived;
    private getServiceTypeName;
    private calculateDueDate;
    healthCheck(): Promise<boolean>;
}
