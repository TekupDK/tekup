# Billy.dk API Reference - Working Code Examples

This file contains **working code examples** from the existing RenOS integration that you can adapt for the MCP server.

## Authentication Pattern

\\\ ypescript
import axios, { AxiosInstance } from 'axios';

const BILLY_API_BASE = '<https://api.billysbilling.com/v2>';

const client = axios.create({
    baseURL: BILLY_API_BASE,
    headers: {
        'X-Access-Token': process.env.BILLY_API_KEY,
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
\\\

## Example 1: Get Revenue Data (Working Code)

\\\ ypescript
async function getRevenueData(startDate: Date, endDate: Date) {
    const response = await client.get('/invoices', {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
            entryDateGte: startDate.toISOString().split['T'](0),
            entryDateLte: endDate.toISOString().split['T'](0),
        },
    });

    const invoices = response.data.invoices || [];

    // Filter by state
    const paidInvoices = invoices.filter(inv => inv.state === 'paid');
    const pendingInvoices = invoices.filter(
        inv => inv.state === 'approved' || inv.state === 'sent'
    );

    // Calculate overdue
    const overdueInvoices = invoices.filter(inv => {
        if (inv.state !== 'paid' && inv.entryDate) {
            const dueDate = new Date(inv.entryDate);
            dueDate.setDate(dueDate.getDate() + 14); // 14 day payment terms
            return dueDate < new Date();
        }
        return false;
    });

    // Calculate total
    const totalRevenue = paidInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
    );

    return {
        period: \\ - \\,
        totalRevenue,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
    };
}
\\\

## Example 2: Create Invoice (Working Code)

\\\ ypescript
async function createInvoice(invoiceData: {
    contactId: string;
    entryDate: string; // YYYY-MM-DD
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string;
    }>;
}) {
    const response = await client.post('/invoices', {
        organizationId: process.env.BILLY_ORGANIZATION_ID,
        type: 'invoice',
        entryDate: invoiceData.entryDate,
        paymentTermsMode: 'net',
        paymentTermsDays: 14,
        contactId: invoiceData.contactId,
        lines: invoiceData.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productId: item.productId || null,
        })),
    });

    return response.data.invoice;
}
\\\

## Example 3: List Customers

\\\ ypescript
async function listCustomers(searchTerm?: string) {
    const response = await client.get('/contacts', {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
            type: 'customer', // or 'supplier'
            ...(searchTerm && { search: searchTerm }),
        },
    });

    return response.data.contacts || [];
}
\\\

## Example 4: Create Customer

\\\ ypescript
async function createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    address?: {
        street: string;
        zipcode: string;
        city: string;
        country?: string;
    };
}) {
    const response = await client.post('/contacts', {
        organizationId: process.env.BILLY_ORGANIZATION_ID,
        type: 'customer',
        name: customerData.name,
        contactNo: '', // Auto-generated if empty
        contactPersons: [
            {
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone || '',
            },
        ],
        ...(customerData.address && {
            street: customerData.address.street,
            zipcode: customerData.address.zipcode,
            city: customerData.address.city,
            countryId: customerData.address.country || 'DK',
        }),
    });

    return response.data.contact;
}
\\\

## Example 5: List Products

\\\ ypescript
async function listProducts() {
    const response = await client.get('/products', {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
        },
    });

    return response.data.products || [];
}
\\\

## Example 6: Create Product

\\\ ypescript
async function createProduct(productData: {
    name: string;
    description?: string;
    unitPrice: number;
}) {
    const response = await client.post('/products', {
        organizationId: process.env.BILLY_ORGANIZATION_ID,
        name: productData.name,
        description: productData.description || '',
        prices: [
            {
                currencyId: 'DKK',
                unitPrice: productData.unitPrice,
            },
        ],
    });

    return response.data.product;
}
\\\

## Example 7: Send Invoice

\\\ ypescript
async function sendInvoice(invoiceId: string, message?: string) {
    const response = await client.post(\/invoices/\/send\, {
        method: 'email',
        message: message || 'Venligst find vedhæftet faktura.',
    });

    return response.data;
}
\\\

## Example 8: Get Invoice Details

\\\ ypescript
async function getInvoice(invoiceId: string) {
    const response = await client.get(\/invoices/\\, {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
        },
    });

    return response.data.invoice;
}
\\\

## Example 9: Get Customer Details

\\\ ypescript
async function getCustomer(contactId: string) {
    const response = await client.get(\/contacts/\\, {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
        },
    });

    return response.data.contact;
}
\\\

## Example 10: Get Organization Info

\\\ ypescript
async function getOrganization() {
    const response = await client.get('/organization', {
        params: {
            organizationId: process.env.BILLY_ORGANIZATION_ID,
        },
    });

    return response.data.organization;
}
\\\

---

## TypeScript Interfaces

\\\ ypescript
interface BillyInvoice {
    id: string;
    invoiceNo: string;
    state: 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled';
    contactId: string;
    currency: string;
    totalAmount: number;
    entryDate: string; // YYYY-MM-DD
    paymentDate?: string; // YYYY-MM-DD
    lines: BillyInvoiceLine[];
}

interface BillyInvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    productId?: string;
}

interface BillyContact {
    id: string;
    contactNo: string;
    type: 'customer' | 'supplier';
    name: string;
    street?: string;
    zipcode?: string;
    city?: string;
    countryId?: string;
    phone?: string;
    contactPersons: Array<{
        name: string;
        email: string;
        phone?: string;
    }>;
}

interface BillyProduct {
    id: string;
    productNo: string;
    name: string;
    description?: string;
    account?: {
        accountNo: string;
        name: string;
    };
    prices: Array<{
        currencyId: string;
        unitPrice: number;
    }>;
}

interface BillyOrganization {
    id: string;
    name: string;
    countryId: string;
    timezone: string;
}
\\\

---

## Error Handling Pattern

\\\ ypescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
    try {
        return await apiCall();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Billy API Error:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                endpoint: error.config?.url,
            });
        } else {
            console.error('Unexpected error:', error);
        }
        return null;
    }
}

// Usage:
const revenue = await safeApiCall(() => getRevenueData(startDate, endDate));
if (!revenue) {
    // Fallback logic or error response
}
\\\

---

## Common Query Parameters

\\\ ypescript
// Date filtering
params: {
    entryDateGte: '2025-01-01',  // Greater than or equal
    entryDateLte: '2025-01-31',  // Less than or equal
}

// State filtering (invoices)
params: {
    state: 'paid', // or 'draft', 'approved', 'sent', 'cancelled'
}

// Contact filtering
params: {
    type: 'customer', // or 'supplier'
    search: 'search term',
}

// Always include organizationId
params: {
    organizationId: process.env.BILLY_ORGANIZATION_ID,
}
\\\

---

## Rate Limiting

Billy.dk API limits:
- **100 requests per minute**
- **1000 requests per hour**

Implement rate limiting in your MCP server:

\\\ ypescript
class RateLimiter {
    private requests: number[] = [];
    private readonly maxPerMinute = 100;
    private readonly maxPerHour = 1000;

    async checkLimit(): Promise<boolean> {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;

        // Remove old requests
        this.requests = this.requests.filter(time => time > oneHourAgo);

        // Check limits
        const recentMinute = this.requests.filter(time => time > oneMinuteAgo);
        if (recentMinute.length >= this.maxPerMinute) return false;
        if (this.requests.length >= this.maxPerHour) return false;

        // Add current request
        this.requests.push(now);
        return true;
    }
}
\\\

---

## Official Documentation

- **API Docs**: <https://www.billy.dk/api>
- **Authentication**: <https://www.billy.dk/api#authentication>
- **Invoices**: <https://www.billy.dk/api#invoices>
- **Contacts**: <https://www.billy.dk/api#contacts>
- **Products**: <https://www.billy.dk/api#products>

---

**END OF API REFERENCE**
