/**
 * TypeScript Type Definitions for Billy MCP Client
 * Based on Tekup-Billy server types
 * 
 * Following TekUp standards:
 * - Interfaces for domain models
 * - Types for unions and utilities
 * - PascalCase naming
 */

// ============================================================================
// Billy Domain Models (from Tekup-Billy server)
// ============================================================================

export interface BillyInvoice {
  id: string;
  invoiceNo: string;
  state: InvoiceState;
  contactId: string;
  currency: string;
  totalAmount: number;
  entryDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  paymentDate?: string;
  lines: BillyInvoiceLine[];
}

export interface BillyInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string;
}

export interface BillyCustomer {
  id: string;
  contactNo: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  countryId?: string;
}

export interface BillyProduct {
  id: string;
  productNo: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
}

export interface BillyRevenue {
  period: string;
  totalRevenue: number;
  currency: string;
  invoiceCount: number;
}

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPToolRequest {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime?: number;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

// ============================================================================
// Client Configuration Types
// ============================================================================

export interface BillyConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  dryRun: boolean;
}

export interface BillyErrorDetails {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  endpoint?: string;
  method?: string;
  billyErrorCode?: string;
  billyErrorMessage?: string;
  validationErrors?: any;
}

// ============================================================================
// Tool Input/Output Types
// ============================================================================

// Invoice Tools
export interface ListInvoicesInput {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  state?: InvoiceState;
  contactId?: string;
  pageSize?: number;
  page?: number;
}

export interface CreateInvoiceInput {
  contactId: string;
  entryDate: string; // YYYY-MM-DD
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId: string;
  }>;
}

export interface GetInvoiceInput {
  invoiceId: string;
}

export interface SendInvoiceInput {
  invoiceId: string;
  message?: string;
}

// Customer Tools
export interface ListCustomersInput {
  search?: string;
  pageSize?: number;
  page?: number;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipcode?: string;
}

export interface GetCustomerInput {
  customerId: string;
}

// Product Tools
export interface ListProductsInput {
  search?: string;
  pageSize?: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  unitPrice: number;
  currency?: string;
}

// Revenue Tools
export interface GetRevenueInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  groupBy?: 'day' | 'week' | 'month';
}

// ============================================================================
// Type Aliases & Unions (TekUp standard)
// ============================================================================

export type InvoiceState = 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: BillyErrorDetails;
}

export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

