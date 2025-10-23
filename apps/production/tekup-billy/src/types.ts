/**
 * TypeScript interfaces for Billy.dk API
 * Based on Billy.dk API documentation and existing RenOS integration
 */

// Core Billy API Types
export interface BillyInvoice {
  id: string;
  invoiceNo: string;
  state: 'draft' | 'approved' | 'voided'; // Billy API only returns these three states
  contactId: string;
  currency: string;
  totalAmount: number;
  entryDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD (deprecated - use dueDate)
  dueDate?: string; // YYYY-MM-DD (actual due date from Billy API)
  paymentTermsDays?: number;
  isPaid?: boolean; // Billy API payment status
  balance?: number; // Remaining balance
  sentState?: string; // Billy API sent status
  lines: BillyInvoiceLine[];
  organizationId: string;
}

export interface BillyInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string;
}

export interface BillyContact {
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
  organizationId: string;
}

export interface BillyProduct {
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
  organizationId: string;
}

export interface BillyOrganization {
  id: string;
  name: string;
  countryId: string;
  timezone: string;
}

// MCP Tool Input Types
export interface CreateInvoiceInput {
  contactId: string;
  entryDate: string; // YYYY-MM-DD
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}

export interface ListInvoicesInput {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  state?: 'draft' | 'approved' | 'voided'; // Billy API only supports these three states
  contactId?: string;
}

export interface GetInvoiceInput {
  invoiceId: string;
}

export interface SendInvoiceInput {
  invoiceId: string;
  message?: string;
}

export interface ListCustomersInput {
  search?: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    zipcode: string;
    city: string;
    country?: string;
  };
}

export interface GetCustomerInput {
  contactId: string;
}

export interface ListProductsInput {
  search?: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  prices: Array<{
    unitPrice: number;
    currencyId?: string;
  }>;
}

export interface GetRevenueInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// Sprint 1: New Update Input Types
export interface UpdateInvoiceInput {
  invoiceId: string;
  contactId?: string;
  entryDate?: string;
  paymentTermsDays?: number;
  lines?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}

export interface ApproveInvoiceInput {
  invoiceId: string;
}

export interface CancelInvoiceInput {
  invoiceId: string;
  reason?: string;
}

export interface MarkInvoicePaidInput {
  invoiceId: string;
  paymentDate: string; // YYYY-MM-DD
  amount?: number; // Optional, defaults to invoice totalAmount
}

export interface UpdateCustomerInput {
  contactId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    zipcode?: string;
    city?: string;
    country?: string;
  };
}

export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string;
  prices?: Array<{
    unitPrice: number;
    currencyId?: string;
  }>;
}

// API Response Types
export interface BillyApiResponse<T> {
  data: T;
  status: number;
}

export interface RevenueData {
  period: string;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

// Error Types
export interface BillyApiError {
  message: string;
  status?: number;
  endpoint?: string;
}

// Configuration Types
export interface BillyConfig {
  apiKey: string;
  organizationId: string;
  apiBase: string;
  testMode?: boolean;
  dryRun?: boolean;
}

// MCP Tool Result Types
export interface ToolResult<T = any> {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ToolError {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError: true;
}