/**
 * Tekup-Billy MCP HTTP Client
 * TypeScript/JavaScript client library for RenOS Backend
 * 
 * Usage:
 * ```typescript
 * import { BillyMCPClient } from './services/BillyMCPClient';
 * 
 * const billy = new BillyMCPClient({
 *   baseURL: 'https://tekup-billy-mcp.onrender.com',
 *   apiKey: process.env.BILLY_MCP_API_KEY
 * });
 * 
 * const invoices = await billy.listInvoices({ startDate: '2025-01-01' });
 * ```
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface BillyMCPClientConfig {
    baseURL: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
}

export interface BillyMCPResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    executionTime?: number;
}

export interface BillyInvoice {
    id: string;
    invoiceNo: string;
    state: string;
    contactId: string;
    contactName?: string;
    lines: Array<{
        productId: string;
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    totalAmount: number;
    currency: string;
    createdDate: string;
    dueDate?: string;
}

export interface BillyCustomer {
    id: string;
    name: string;
    type: 'company' | 'person';
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        zipcode?: string;
        country?: string;
    };
    vatNo?: string;
}

export interface BillyProduct {
    id: string;
    productNo: string;
    name: string;
    description?: string;
    salesPrice: number;
    currency: string;
    isArchived: boolean;
}

export interface RevenueData {
    totalRevenue: number;
    currency: string;
    startDate: string;
    endDate: string;
    invoiceCount: number;
    paidInvoiceCount: number;
    paymentRate: number;
}

export class BillyMCPClientError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'BillyMCPClientError';
    }
}

/**
 * Billy MCP HTTP Client
 * Communicates with Tekup-Billy MCP server via REST API
 */
export class BillyMCPClient {
    private client: AxiosInstance;
    private config: BillyMCPClientConfig;

    constructor(config: BillyMCPClientConfig) {
        this.config = {
            timeout: 30000,
            retries: 3,
            ...config
        };

        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.config.apiKey
            }
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<any>) => {
                const errorData = error.response?.data;
                const mcpError = new BillyMCPClientError(
                    errorData?.error || error.message || 'Unknown error',
                    error.response?.status,
                    errorData
                );
                throw mcpError;
            }
        );
    }

    /**
     * Generic tool execution
     */
    private async callTool<T = any>(toolName: string, args: Record<string, any> = {}): Promise<T> {
        const response = await this.client.post<BillyMCPResponse<T>>(
            `/api/v1/tools/${toolName}`,
            { arguments: args }
        );

        if (!response.data.success) {
            throw new BillyMCPClientError(
                response.data.error || 'Tool execution failed',
                response.status,
                response.data
            );
        }

        return response.data.data as T;
    }

    /**
     * Health check
     */
    async health(): Promise<{
        status: string;
        timestamp: string;
        version: string;
        uptime: number;
        billy: { connected: boolean; organization: string };
    }> {
        const response = await this.client.get('/health');
        return response.data;
    }

    /**
     * List available tools
     */
    async listTools(): Promise<Array<{
        name: string;
        category: string;
        description: string;
    }>> {
        const response = await this.client.get<BillyMCPResponse>('/api/v1/tools');
        return response.data.data.tools;
    }

    // ========================================
    // Invoice Methods
    // ========================================

    /**
     * List invoices with optional filters
     */
    async listInvoices(params?: {
        startDate?: string;
        endDate?: string;
        state?: string;
        contactId?: string;
    }): Promise<{ invoices: BillyInvoice[] }> {
        return this.callTool('list_invoices', params || {});
    }

    /**
     * Create a new invoice
     */
    async createInvoice(data: {
        contactId: string;
        lines: Array<{
            productId: string;
            quantity: number;
            unitPrice?: number;
            description?: string;
        }>;
        currency?: string;
        dueDate?: string;
    }): Promise<{ invoice: BillyInvoice }> {
        return this.callTool('create_invoice', data);
    }

    /**
     * Get invoice by ID
     */
    async getInvoice(invoiceId: string): Promise<{ invoice: BillyInvoice }> {
        return this.callTool('get_invoice', { invoiceId });
    }

    /**
     * Send invoice via email
     */
    async sendInvoice(params: {
        invoiceId: string;
        message?: string;
    }): Promise<{ success: boolean; message: string }> {
        return this.callTool('send_invoice', params);
    }

    // ========================================
    // Customer Methods
    // ========================================

    /**
     * List customers
     */
    async listCustomers(params?: {
        search?: string;
        type?: 'company' | 'person';
    }): Promise<{ customers: BillyCustomer[] }> {
        return this.callTool('list_customers', params || {});
    }

    /**
     * Create a new customer
     */
    async createCustomer(data: {
        name: string;
        type: 'company' | 'person';
        email?: string;
        phone?: string;
        address?: {
            street?: string;
            city?: string;
            zipcode?: string;
            country?: string;
        };
        vatNo?: string;
    }): Promise<{ customer: BillyCustomer }> {
        return this.callTool('create_customer', data);
    }

    /**
     * Get customer by ID
     */
    async getCustomer(customerId: string): Promise<{ customer: BillyCustomer }> {
        return this.callTool('get_customer', { customerId });
    }

    // ========================================
    // Product Methods
    // ========================================

    /**
     * List products
     */
    async listProducts(params?: {
        search?: string;
    }): Promise<{ products: BillyProduct[] }> {
        return this.callTool('list_products', params || {});
    }

    /**
     * Create a new product
     */
    async createProduct(data: {
        name: string;
        productNo?: string;
        description?: string;
        salesPrice: number;
        currency?: string;
    }): Promise<{ product: BillyProduct }> {
        return this.callTool('create_product', data);
    }

    // ========================================
    // Revenue Methods
    // ========================================

    /**
     * Get revenue analytics
     */
    async getRevenue(params: {
        startDate: string;
        endDate: string;
    }): Promise<RevenueData> {
        return this.callTool('get_revenue', params);
    }

    // ========================================
    // Test Methods
    // ========================================

    /**
     * List test scenarios
     */
    async listTestScenarios(): Promise<{
        scenarios: Array<{
            id: string;
            name: string;
            description: string;
            type: string;
        }>;
    }> {
        return this.callTool('list_test_scenarios');
    }

    /**
     * Run test scenario
     */
    async runTestScenario(scenarioId: string): Promise<{
        success: boolean;
        message: string;
        createdEntities?: {
            customers: string[];
            products: string[];
            invoices: string[];
        };
    }> {
        return this.callTool('run_test_scenario', { scenarioId });
    }

    /**
     * Generate test data
     */
    async generateTestData(params: {
        businessType: 'freelancer' | 'retail' | 'service';
        count?: number;
    }): Promise<{
        success: boolean;
        message: string;
        createdEntities: {
            customers: string[];
            products: string[];
            invoices: string[];
        };
    }> {
        return this.callTool('generate_test_data', params);
    }

    // ========================================
    // Batch Operations
    // ========================================

    /**
     * Execute multiple tools in one request
     */
    async batch(tools: Array<{
        tool: string;
        arguments: Record<string, any>;
    }>): Promise<Array<{
        tool: string;
        success: boolean;
        data?: any;
        error?: string;
    }>> {
        const response = await this.client.post<BillyMCPResponse>('/api/v1/tools/batch', {
            tools
        });

        if (!response.data.success) {
            throw new BillyMCPClientError(
                response.data.error || 'Batch execution failed',
                response.status,
                response.data
            );
        }

        return response.data.data.results;
    }
}

// Export singleton instance factory
export function createBillyMCPClient(config: BillyMCPClientConfig): BillyMCPClient {
    return new BillyMCPClient(config);
}

// Default export
export default BillyMCPClient;
