/**
 * Billy MCP v3.0 Hierarchical Tools
 *
 * Research-based tool architecture for optimal LLM performance:
 * - Level 1: Summary tools (10-50 tokens)
 * - Level 2: Filtered lists (100-500 tokens)
 * - Level 3: Detailed retrieval (500-2000 tokens)
 *
 * Based on:
 * - Lost in the Middle (Liu et al., 2023) - avoid long lists
 * - Toolformer (Meta AI, 2023) - selective tool use
 * - Hierarchical RAG patterns - progressive disclosure
 * - MCP Tool Output Schemas (June 2025) - structured outputs
 */

import { BillyClient } from "../billy-client.js";
import type {
  InvoiceSummary,
  CustomerSummary,
  BusinessOverview,
  InvoiceList,
  CustomerSearchResult,
  InvoiceSearchResult,
  InvoiceDetails,
  CustomerDetails,
  ProductDetails,
  ListUnpaidInvoicesInput,
  ListOverdueInvoicesInput,
  ListRecentInvoicesInput,
  SearchCustomersInput,
  ListActiveCustomersInput,
  SearchInvoicesInput,
  GetInvoiceDetailsInput,
  GetCustomerDetailsInput,
  GetProductDetailsInput,
} from "../types-v3.js";

// ============================================================================
// LEVEL 1: SUMMARY TOOLS
// ============================================================================

export async function getInvoiceSummary(
  client: BillyClient,
  args: Record<string, never>
): Promise<InvoiceSummary> {
  return await client.getInvoiceSummary();
}

export async function getCustomerSummary(
  client: BillyClient,
  args: Record<string, never>
): Promise<CustomerSummary> {
  return await client.getCustomerSummary();
}

export async function getBusinessOverview(
  client: BillyClient,
  args: Record<string, never>
): Promise<BusinessOverview> {
  return await client.getBusinessOverview();
}

// ============================================================================
// LEVEL 2: FILTERED LISTS
// ============================================================================

export async function listUnpaidInvoices(
  client: BillyClient,
  args: ListUnpaidInvoicesInput
): Promise<InvoiceList> {
  return await client.listUnpaidInvoices(args);
}

export async function listOverdueInvoices(
  client: BillyClient,
  args: ListOverdueInvoicesInput
): Promise<InvoiceList> {
  return await client.listOverdueInvoices(args);
}

export async function listRecentInvoices(
  client: BillyClient,
  args: ListRecentInvoicesInput
): Promise<InvoiceList> {
  return await client.listRecentInvoices(args);
}

export async function searchCustomers(
  client: BillyClient,
  args: SearchCustomersInput
): Promise<CustomerSearchResult> {
  return await client.searchCustomers(args);
}

export async function listActiveCustomers(
  client: BillyClient,
  args: ListActiveCustomersInput
): Promise<CustomerSearchResult> {
  return await client.listActiveCustomers(args);
}

export async function searchInvoices(
  client: BillyClient,
  args: SearchInvoicesInput
): Promise<InvoiceSearchResult> {
  return await client.searchInvoices(args);
}

// ============================================================================
// LEVEL 3: DETAILED RETRIEVAL
// ============================================================================

export async function getInvoiceDetails(
  client: BillyClient,
  args: GetInvoiceDetailsInput
): Promise<InvoiceDetails> {
  return await client.getInvoiceDetails(args);
}

export async function getCustomerDetails(
  client: BillyClient,
  args: GetCustomerDetailsInput
): Promise<CustomerDetails> {
  return await client.getCustomerDetails(args);
}

export async function getProductDetails(
  client: BillyClient,
  args: GetProductDetailsInput
): Promise<ProductDetails> {
  return await client.getProductDetails(args);
}
