"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TekupBillyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TekupBillyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const integration_service_1 = require("../integration.service");
let TekupBillyService = TekupBillyService_1 = class TekupBillyService {
    constructor(integrationService, configService) {
        this.integrationService = integrationService;
        this.configService = configService;
        this.logger = new common_1.Logger(TekupBillyService_1.name);
        this.config = {
            baseUrl: this.configService.get('integrations.tekupBilly.url'),
            apiKey: this.configService.get('integrations.tekupBilly.apiKey'),
            timeout: 30000,
            retries: 2,
        };
        if (!this.config.baseUrl || !this.config.apiKey) {
            this.logger.warn('Tekup-Billy integration not configured properly');
        }
    }
    async createCustomer(customerData) {
        try {
            this.logger.debug('Creating customer in Billy.dk', { name: customerData.name });
            const response = await this.integrationService.post('tekup-billy', this.config, '/customers', customerData);
            this.logger.log(`Customer created in Billy.dk: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create customer in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to create customer in Billy.dk: ${error.message}`);
        }
    }
    async updateCustomer(customerId, customerData) {
        try {
            this.logger.debug('Updating customer in Billy.dk', { customerId });
            const response = await this.integrationService.put('tekup-billy', this.config, `/customers/${customerId}`, customerData);
            this.logger.log(`Customer updated in Billy.dk: ${customerId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to update customer in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to update customer in Billy.dk: ${error.message}`);
        }
    }
    async getCustomer(customerId) {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, `/customers/${customerId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get customer from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get customer from Billy.dk: ${error.message}`);
        }
    }
    async searchCustomers(query) {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, `/customers/search?q=${encodeURIComponent(query)}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to search customers in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to search customers in Billy.dk: ${error.message}`);
        }
    }
    async createProduct(productData) {
        try {
            this.logger.debug('Creating product in Billy.dk', { name: productData.name });
            const response = await this.integrationService.post('tekup-billy', this.config, '/products', productData);
            this.logger.log(`Product created in Billy.dk: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create product in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to create product in Billy.dk: ${error.message}`);
        }
    }
    async getProducts() {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, '/products');
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get products from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get products from Billy.dk: ${error.message}`);
        }
    }
    async createInvoice(invoiceData) {
        try {
            this.logger.debug('Creating invoice in Billy.dk', {
                customerId: invoiceData.customerId,
                totalAmount: invoiceData.totalAmount
            });
            const response = await this.integrationService.post('tekup-billy', this.config, '/invoices', invoiceData);
            this.logger.log(`Invoice created in Billy.dk: ${response.id} (${response.invoiceNumber})`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create invoice in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to create invoice in Billy.dk: ${error.message}`);
        }
    }
    async getInvoice(invoiceId) {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, `/invoices/${invoiceId}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get invoice from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get invoice from Billy.dk: ${error.message}`);
        }
    }
    async sendInvoice(invoiceId, email) {
        try {
            this.logger.debug('Sending invoice via Billy.dk', { invoiceId, email });
            await this.integrationService.post('tekup-billy', this.config, `/invoices/${invoiceId}/send`, { email });
            this.logger.log(`Invoice sent via Billy.dk: ${invoiceId}`);
        }
        catch (error) {
            this.logger.error('Failed to send invoice via Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to send invoice via Billy.dk: ${error.message}`);
        }
    }
    async getInvoicePdf(invoiceId) {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, `/invoices/${invoiceId}/pdf`);
            return Buffer.from(response);
        }
        catch (error) {
            this.logger.error('Failed to get invoice PDF from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get invoice PDF from Billy.dk: ${error.message}`);
        }
    }
    async recordPayment(paymentData) {
        try {
            this.logger.debug('Recording payment in Billy.dk', {
                invoiceId: paymentData.invoiceId,
                amount: paymentData.amount
            });
            const response = await this.integrationService.post('tekup-billy', this.config, '/payments', paymentData);
            this.logger.log(`Payment recorded in Billy.dk: ${response.id}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to record payment in Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to record payment in Billy.dk: ${error.message}`);
        }
    }
    async getPayments(invoiceId) {
        try {
            const endpoint = invoiceId ? `/payments?invoiceId=${invoiceId}` : '/payments';
            const response = await this.integrationService.get('tekup-billy', this.config, endpoint);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get payments from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get payments from Billy.dk: ${error.message}`);
        }
    }
    async getFinancialReport(dateFrom, dateTo) {
        try {
            const response = await this.integrationService.get('tekup-billy', this.config, `/reports/financial?from=${dateFrom}&to=${dateTo}`);
            return response;
        }
        catch (error) {
            this.logger.error('Failed to get financial report from Billy.dk', error);
            throw new common_1.BadRequestException(`Failed to get financial report from Billy.dk: ${error.message}`);
        }
    }
    async handleWebhook(webhookData) {
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
        }
        catch (error) {
            this.logger.error('Failed to process Billy.dk webhook', error);
            throw error;
        }
    }
    async createInvoiceFromJob(jobData, customerData) {
        try {
            let billyCustomer;
            try {
                billyCustomer = await this.getCustomer(customerData.billy_customer_id);
            }
            catch (error) {
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
            const lines = [{
                    description: `${this.getServiceTypeName(jobData.service_type)} - ${jobData.job_number}`,
                    quantity: 1,
                    unitPrice: jobData.profitability?.total_price || 0,
                    vatRate: 25,
                    totalAmount: jobData.profitability?.total_price || 0,
                }];
            const invoiceData = {
                customerId: billyCustomer.id,
                date: new Date().toISOString().split('T')[0],
                dueDate: this.calculateDueDate(14),
                lines,
                notes: jobData.special_instructions,
                reference: jobData.job_number,
                currency: 'DKK',
            };
            return await this.createInvoice(invoiceData);
        }
        catch (error) {
            this.logger.error('Failed to create invoice from job', error);
            throw error;
        }
    }
    async handleInvoicePaid(invoiceData) {
        this.logger.log(`Invoice paid: ${invoiceData.id}`);
    }
    async handleInvoiceOverdue(invoiceData) {
        this.logger.log(`Invoice overdue: ${invoiceData.id}`);
    }
    async handlePaymentReceived(paymentData) {
        this.logger.log(`Payment received: ${paymentData.id}`);
    }
    getServiceTypeName(serviceType) {
        const serviceNames = {
            standard: 'Standard Rengøring',
            deep: 'Hovedrengøring',
            window: 'Vinduespolering',
            moveout: 'Fraflytningsrengøring',
            office: 'Kontorrengøring',
        };
        return serviceNames[serviceType] || serviceType;
    }
    calculateDueDate(days) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        return dueDate.toISOString().split('T')[0];
    }
    async healthCheck() {
        try {
            await this.integrationService.get('tekup-billy', this.config, '/health');
            return true;
        }
        catch (error) {
            this.logger.error('Billy.dk health check failed', error);
            return false;
        }
    }
};
exports.TekupBillyService = TekupBillyService;
exports.TekupBillyService = TekupBillyService = TekupBillyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        config_1.ConfigService])
], TekupBillyService);
//# sourceMappingURL=tekup-billy.service.js.map