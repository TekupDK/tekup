/**
 * Enhanced Billy.dk API Client v2.0
 * Provides a resilient typed wrapper around the Billy.dk REST API
 * Features:
 * - Circuit breaker pattern for API resilience
 * - Exponential backoff with jitter for retry policies
 * - Connection pooling optimized for Render.com
 * - Request deduplication for concurrent identical requests
 * - Fallback mechanisms with cached data serving
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import CircuitBreaker from "opossum";
import {
  BillyConfig,
  BillyContact,
  BillyInvoice,
  BillyOrganization,
  BillyProduct,
  CreateCustomerInput,
  CreateInvoiceInput,
  CreateProductInput,
  RevenueData,
} from "./types.js";
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
  CompactInvoice,
  CompactCustomer,
  ListUnpaidInvoicesInput,
  ListOverdueInvoicesInput,
  ListRecentInvoicesInput,
  SearchCustomersInput,
  ListActiveCustomersInput,
  SearchInvoicesInput,
  GetInvoiceDetailsInput,
  GetCustomerDetailsInput,
  GetProductDetailsInput,
} from "./types-v3.js";
import { log } from "./utils/logger.js";

/**
 * Enhanced rate limiter with exponential backoff
 */
class EnhancedRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private backoffMultiplier = 1;
  private lastBackoffTime = 0;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      let waitTime = this.windowMs - (now - oldestRequest);

      // Apply exponential backoff with jitter
      if (now - this.lastBackoffTime < 60000) {
        // Within last minute
        this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, 8);
      } else {
        this.backoffMultiplier = 1; // Reset backoff
      }

      // Add jitter (±25%)
      const jitter = 0.75 + Math.random() * 0.5;
      waitTime = Math.max(waitTime * this.backoffMultiplier * jitter, 1000);

      this.lastBackoffTime = now;

      log.warn("Rate limit reached, applying backoff", {
        waitTime: Math.round(waitTime),
        backoffMultiplier: this.backoffMultiplier,
        requestsInWindow: this.requests.length,
      });

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }

  getStats(): { requestsInWindow: number; backoffMultiplier: number } {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return {
      requestsInWindow: this.requests.length,
      backoffMultiplier: this.backoffMultiplier,
    };
  }
}

/**
 * Request deduplicator for concurrent identical requests
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      log.debug("Deduplicating concurrent request", { key });
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request and cache promise
    const promise = requestFn().finally(() => {
      // Clean up after completion
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export class BillyClient {
  private client: AxiosInstance;
  private rateLimiter: EnhancedRateLimiter;
  private config: BillyConfig;
  private circuitBreaker: CircuitBreaker;
  private requestDeduplicator: RequestDeduplicator;
  private fallbackCache = new Map<string, { data: any; timestamp: number }>();
  private lastErrorStatus: number | null = null; // Track last error for fallback decisions

  constructor(config: BillyConfig) {
    this.config = config;
    this.rateLimiter = new EnhancedRateLimiter();
    this.requestDeduplicator = new RequestDeduplicator();

    // Enhanced HTTP Keep-Alive agents optimized for Render.com
    const httpAgent = new HttpAgent({
      keepAlive: true,
      maxSockets: 100, // Increased for better concurrency
      maxFreeSockets: 20,
      timeout: 60000,
      scheduling: "fifo", // Better for request ordering
    });

    const httpsAgent = new HttpsAgent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 20,
      timeout: 60000,
      scheduling: "fifo",
    });

    this.client = axios.create({
      baseURL: config.apiBase,
      timeout: 30000,
      httpAgent,
      httpsAgent,
      headers: {
        "X-Access-Token": config.apiKey,
        "Content-Type": "application/json",
        "User-Agent": "Billy-mcp-By-Tekup/2.0",
      },
      // Enhanced retry configuration
      validateStatus: (status) => status < 500, // Don't retry 4xx errors
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      this.executeHttpRequest.bind(this) as any,
      {
        timeout: 30000, // 30 seconds
        errorThresholdPercentage: 50, // Open circuit at 50% error rate
        resetTimeout: 60000, // Try to close circuit after 1 minute
        rollingCountTimeout: 10000, // 10 second rolling window
        rollingCountBuckets: 10, // 10 buckets in rolling window
        name: "billy-api-circuit-breaker",
      }
    );

    // Set fallback function after initialization
    this.circuitBreaker.fallback(this.handleCircuitBreakerFallback.bind(this));

    // Circuit breaker event handlers
    this.circuitBreaker.on("open", () => {
      log.warn("Billy API circuit breaker opened - API calls will be blocked");
    });

    this.circuitBreaker.on("halfOpen", () => {
      log.info(
        "Billy API circuit breaker half-open - testing API availability"
      );
    });

    this.circuitBreaker.on("close", () => {
      log.info("Billy API circuit breaker closed - API calls resumed");
    });

    this.circuitBreaker.on("fallback", (result) => {
      log.warn("Billy API circuit breaker fallback triggered", {
        hasCachedData: !!result,
      });
    });

    // Add response interceptor for enhanced error handling
    this.client.interceptors.response.use(
      (response) => {
        // Reset error status on successful response
        this.lastErrorStatus = null;
        return response;
      },
      (error) => {
        // Track error status for fallback decisions
        this.lastErrorStatus = error.response?.status || null;

        // Enhanced error logging
        if (error.response?.status >= 500) {
          log.error("Billy API server error", error, {
            status: error.response.status,
            endpoint: error.config?.url,
            method: error.config?.method,
          });
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          log.error("Billy API authentication error", error, {
            status: error.response.status,
            endpoint: error.config?.url,
            message: "Invalid or missing Billy API credentials",
          });
        }
        throw error;
      }
    );
  }

  /**
   * Execute HTTP request (used by circuit breaker)
   */
  private async executeHttpRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request({
      method,
      url: endpoint,
      data,
    });

    return response.data;
  }

  /**
   * Circuit breaker fallback handler
   */
  private async handleCircuitBreakerFallback<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ): Promise<T> {
    // Check if error was authentication-related (401, 403)
    const isAuthError = this.lastErrorStatus === 401 || this.lastErrorStatus === 403;

    if (isAuthError) {
      // NEVER serve cached data for authentication errors
      log.error("Billy API authentication failed - cached data disabled", {
        endpoint,
        status: this.lastErrorStatus,
        message: "Please verify BILLY_API_KEY and BILLY_ORGANIZATION_ID environment variables",
      });
      throw new Error(
        `Billy API authentication failed (${this.lastErrorStatus}). Please check your API credentials.`
      );
    }

    // Try to serve from fallback cache for GET requests (only for non-auth errors)
    if (method === "GET") {
      const cacheKey = `${method}:${endpoint}`;
      const cached = this.fallbackCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < 3600000) {
        // 1 hour cache
        const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
        log.warn("Serving from fallback cache due to Billy API unavailability", {
          endpoint,
          cacheAge: `${cacheAge}s`,
          lastErrorStatus: this.lastErrorStatus,
          reason: "Network/server error (not authentication)",
        });

        // Add cache metadata to response so clients know data is stale
        const cachedResponse = cached.data as any;
        if (typeof cachedResponse === "object" && cachedResponse !== null) {
          return {
            ...cachedResponse,
            _cached: true,
            _cachedAt: new Date(cached.timestamp).toISOString(),
            _cacheAge: `${cacheAge}s`,
            _warning: "Data served from cache due to Billy API unavailability",
          } as T;
        }
        return cached.data;
      }
    }

    // No fallback available
    throw new Error(
      `Billy API unavailable and no cached data for ${method} ${endpoint}`
    );
  }

  /**
   * Store successful response in fallback cache
   */
  private storeFallbackCache<T>(
    method: string,
    endpoint: string,
    data: T
  ): void {
    if (method === "GET") {
      const cacheKey = `${method}:${endpoint}`;
      this.fallbackCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      // Limit cache size
      if (this.fallbackCache.size > 1000) {
        const oldestKey = this.fallbackCache.keys().next().value;
        if (oldestKey) {
          this.fallbackCache.delete(oldestKey);
        }
      }
    }
  }

  /**
   * Parse Billy API response that can be either singular or plural format
   * Billy API inconsistently returns either {item: {...}} or {items: [...]}
   *
   * @param response - The API response object
   * @param singularKey - The key for singular format (e.g., 'invoice', 'contact', 'product')
   * @param pluralKey - The key for plural format (e.g., 'invoices', 'contacts', 'products')
   * @param context - Context string for error messages (e.g., 'create invoice')
   * @returns The parsed item or undefined
   */
  private parseResponse<T>(
    response: Record<string, any>,
    singularKey: string,
    pluralKey: string,
    context: string
  ): T | undefined {
    // Try singular format first: {item: {...}}
    if (
      response[singularKey] != null &&
      typeof response[singularKey] === "object"
    ) {
      return response[singularKey] as T;
    }

    // Try plural format: {items: [...]}
    if (
      response[pluralKey] != null &&
      Array.isArray(response[pluralKey]) &&
      response[pluralKey].length > 0
    ) {
      return response[pluralKey][0] as T;
    }

    // No valid response found
    log.error(`Invalid ${context} response structure`, null, { response });
    return undefined;
  }

  private async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ): Promise<T> {
    // Apply rate limiting
    await this.rateLimiter.waitIfNeeded();

    // Log request details (hide sensitive data)
    const logData = data ? { ...data } : undefined;
    if (logData && logData.organizationId) {
      logData.organizationId = "[HIDDEN]";
    }
    if (logData && logData.contact && logData.contact.contactPersons) {
      logData.contact.contactPersons = logData.contact.contactPersons.map(
        (p: any) => ({
          name: p.name,
          email: "[HIDDEN]",
          phone: "[HIDDEN]",
        })
      );
    }

    log.billyApi(method, endpoint, {
      data: logData,
      rateLimiterStats: this.rateLimiter.getStats(),
      circuitBreakerState:
        (this.circuitBreaker.stats as any).state || "unknown",
      pendingRequests: this.requestDeduplicator.getPendingCount(),
    });

    // Dry run mode - return mock data instead of making actual API calls
    if (this.config.dryRun) {
      log.info(`[DRY RUN] ${method} ${endpoint}`, { data: logData });
      const mockResponse = this.getMockResponse<T>(method, endpoint, data);
      log.info("Billy API Mock Response", { response: mockResponse });
      return mockResponse;
    }

    // Use request deduplication for GET requests
    const requestKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;

    try {
      const result = await this.requestDeduplicator.deduplicate(
        requestKey,
        async () => {
          // Execute request through circuit breaker
          const response = await this.circuitBreaker.fire(
            method,
            endpoint,
            data
          );

          // Store successful GET responses in fallback cache
          this.storeFallbackCache(method, endpoint, response);

          return response;
        }
      );

      log.info("Billy API Response", {
        endpoint,
        method,
        circuitBreakerState: this.circuitBreaker.opened ? "open" : (this.circuitBreaker.halfOpen ? "half-open" : "closed"),
        dataSize: JSON.stringify(result).length,
      });

      return result as T;
    } catch (error: any) {
      // Enhanced error logging with full Billy API error details
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        endpoint,
        method,
        // Additional Billy API error fields
        errorCode: error.code,
        billyErrorCode:
          error.response?.data?.errorCode || error.response?.data?.code,
        billyErrorMessage:
          error.response?.data?.message || error.response?.data?.error,
        validationErrors:
          error.response?.data?.errors ||
          error.response?.data?.meta?.fieldErrors,
        // Full error object for debugging
        fullError: error.response?.data,
      };

      log.error("Billy API Error", error, errorDetails);

      // Create more descriptive error message
      const enhancedError: any = new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Billy API request failed"
      );
      enhancedError.billyDetails = errorDetails;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  private getMockResponse<T>(method: string, endpoint: string, data?: any): T {
    // Generate mock responses based on endpoint and method
    if (endpoint.includes("/invoices")) {
      if (method === "GET") {
        // Check if it's a single invoice GET
        if (endpoint.match(/\/invoices\/[^?]+/)) {
          return {
            invoice: {
              id:
                endpoint.split("/")[2]?.split("?")[0] ||
                `mock-invoice-${Date.now()}`,
              invoiceNo: `INV-${Date.now()}`,
              state: "draft",
              contactId: "mock-contact-123",
              currency: "DKK",
              totalAmount: 8000,
              entryDate: "2025-10-11",
              paymentTermsDays: 30,
              lines: [],
              organizationId: this.config.organizationId,
            },
          } as T;
        }
        return { invoices: [], totalCount: 0 } as T;
      } else if (method === "POST") {
        if (endpoint.includes("/approve")) {
          return {
            invoice: {
              id: endpoint.split("/")[2],
              invoiceNo: `INV-${Date.now()}`,
              state: "approved",
              contactId: "mock-contact-123",
              currency: "DKK",
              totalAmount: 8000,
              entryDate: "2025-10-11",
              lines: [],
              organizationId: this.config.organizationId,
            },
          } as T;
        } else if (endpoint.includes("/send")) {
          return {} as T; // Send doesn't return invoice
        }
        return {
          invoice: {
            id: `mock-invoice-${Date.now()}`,
            invoiceNo: `INV-${Date.now()}`,
            state: "draft",
            contactId: data?.invoice?.contactId || "mock-contact-123",
            currency: "DKK",
            totalAmount: 8000,
            entryDate: data?.invoice?.entryDate || "2025-10-11",
            paymentTermsDays: data?.invoice?.paymentTermsDays || 30,
            lines: data?.invoice?.lines || [],
            organizationId: this.config.organizationId,
          },
        } as T;
      } else if (method === "PUT") {
        return {
          invoice: {
            id: endpoint.split("/")[2],
            invoiceNo: `INV-${Date.now()}`,
            state: data?.invoice?.state || "draft",
            contactId: data?.invoice?.contactId || "mock-contact-123",
            currency: "DKK",
            totalAmount: data?.invoice?.totalAmount || 8000,
            entryDate: data?.invoice?.entryDate || "2025-10-11",
            paymentDate: data?.invoice?.paymentDate,
            paymentTermsDays: data?.invoice?.paymentTermsDays || 30,
            lines: data?.invoice?.lines || [],
            organizationId: this.config.organizationId,
          },
        } as T;
      }
    } else if (endpoint.includes("/contacts")) {
      if (method === "GET") {
        if (endpoint.match(/\/contacts\/[^?]+/)) {
          return {
            contact: {
              id:
                endpoint.split("/")[2]?.split("?")[0] ||
                `mock-contact-${Date.now()}`,
              contactNo: `CUST-${Date.now()}`,
              type: "customer",
              name: "Mock Customer",
              contactPersons: [],
              organizationId: this.config.organizationId,
            },
          } as T;
        }
        return { contacts: [], totalCount: 0 } as T;
      } else if (method === "POST" || method === "PUT") {
        return {
          contact: {
            id:
              method === "PUT"
                ? endpoint.split("/")[2]
                : `mock-contact-${Date.now()}`,
            contactNo: `CUST-${Date.now()}`,
            type: "customer",
            name: data?.contact?.name || "Mock Customer",
            street: data?.contact?.street,
            zipcode: data?.contact?.zipcode,
            city: data?.contact?.city,
            countryId: data?.contact?.countryId || "DK",
            phone: data?.contact?.phone,
            contactPersons: data?.contact?.contactPersons || [],
            organizationId: this.config.organizationId,
          },
        } as T;
      }
    } else if (endpoint.includes("/products")) {
      if (method === "GET") {
        // Return mock products for testing
        return {
          products: [
            {
              id: "mock-product-456",
              productNo: "PROD-001",
              name: "Mock Product",
              description: "Test product",
              prices: [{ currencyId: "DKK", unitPrice: 1000 }],
              organizationId: this.config.organizationId,
            },
          ],
          totalCount: 1,
        } as T;
      } else if (method === "POST" || method === "PUT") {
        return {
          product: {
            id:
              method === "PUT"
                ? endpoint.split("/")[2]
                : `mock-product-${Date.now()}`,
            productNo: `PROD-${Date.now()}`,
            name: data?.product?.name || "Mock Product",
            description: data?.product?.description,
            prices: data?.product?.prices || [],
            organizationId: this.config.organizationId,
          },
        } as T;
      }
    }

    return {} as T;
  }

  // Invoice methods
  async getInvoices(params?: {
    startDate?: string;
    endDate?: string;
    state?: string;
    contactId?: string;
  }): Promise<BillyInvoice[]> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    // The token is already tied to a single organization
    // Implement pagination to fetch ALL invoices, not just first page
    // Billy API v2 uses page and pageSize (max 1000 per page)
    const allInvoices: BillyInvoice[] = [];
    let page = 1;
    const pageSize = 1000; // Billy API max pageSize
    let hasMore = true;

    while (hasMore) {
      const queryParams = new URLSearchParams();
      if (params?.startDate)
        queryParams.append("entryDateGte", params.startDate);
      if (params?.endDate) queryParams.append("entryDateLte", params.endDate);
      if (params?.state) queryParams.append("state", params.state);
      if (params?.contactId) queryParams.append("contactId", params.contactId);
      queryParams.append("pageSize", pageSize.toString());
      queryParams.append("page", page.toString());

      const endpoint = `/invoices?${queryParams.toString()}`;
      const response = await this.makeRequest<{
        invoices: BillyInvoice[];
        meta?: { paging?: { pageCount?: number; total?: number } };
      }>("GET", endpoint);

      if (!response || !response.invoices) {
        log.error("Invalid invoices response structure", null, { response });
        break;
      }

      const invoices = response.invoices;
      allInvoices.push(...invoices);

      // Check if we've reached the last page
      const paging = response.meta?.paging;
      if (paging) {
        const pageCount = paging.pageCount || 1;
        if (page >= pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // Fallback: if we got fewer invoices than pageSize, we're done
        if (invoices.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Safety limit to prevent infinite loops (max 100 pages = 100,000 invoices)
      if (page > 100) {
        log.warn("Reached pagination safety limit (invoices)", {
          totalFetched: allInvoices.length,
          page,
        });
        break;
      }
    }

    log.debug("Fetched all invoices with pagination", {
      startDate: params?.startDate || "none",
      endDate: params?.endDate || "none",
      state: params?.state || "none",
      totalInvoices: allInvoices.length,
      pagesFetched: page - 1 || 1,
    });

    return allInvoices;
  }

  async getInvoice(invoiceId: string): Promise<BillyInvoice | null> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const endpoint = `/invoices/${invoiceId}`;
    const response = await this.makeRequest<{ invoice: BillyInvoice }>(
      "GET",
      endpoint
    );

    if (!response || !response.invoice) {
      log.error("Invalid get invoice response structure", null, { response });
      throw new Error(
        "Invalid response format from Billy API - expected invoice object"
      );
    }

    // Billy GET /invoices/{id} returns invoice without lines
    // We need to fetch lines separately from /invoiceLines endpoint
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    interface InvoiceLine {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const linesResponse = await this.makeRequest<{
      invoiceLines: InvoiceLine[];
    }>("GET", linesEndpoint);

    // Merge lines into invoice object
    const invoiceWithLines: BillyInvoice = {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };

    return invoiceWithLines;
  }

  async createInvoice(invoiceData: CreateInvoiceInput): Promise<BillyInvoice> {
    const endpoint = `/invoices`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        type: "invoice", // Required by Billy API
        contactId: invoiceData.contactId,
        entryDate: invoiceData.entryDate,
        paymentTermsMode: "net", // Required for Billy to calculate dueDate from paymentTermsDays
        paymentTermsDays: invoiceData.paymentTermsDays || 30,
        lines: invoiceData.lines.map((line) => ({
          productId: line.productId, // Must be first for Billy API
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      },
    };

    interface InvoiceLineResponse {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const response = await this.makeRequest<{
      invoice?: BillyInvoice;
      invoices?: BillyInvoice[];
      invoiceLines?: InvoiceLineResponse[];
    }>("POST", endpoint, payload);

    // Billy API can return either {invoice: {...}} or {invoices: [...]}
    const invoice = this.parseResponse<BillyInvoice>(
      response,
      "invoice",
      "invoices",
      "create invoice"
    );

    if (!invoice) {
      throw new Error(
        "Invalid response format from Billy API - expected invoice or invoices"
      );
    }

    // Billy returns invoiceLines separately - merge them into invoice object
    const invoiceWithLines: BillyInvoice = {
      ...invoice,
      lines: response.invoiceLines || [],
    };

    return invoiceWithLines;
  }

  async sendInvoice(invoiceId: string, message?: string): Promise<void> {
    // Billy API doesn't have a /send endpoint - we update sentState instead
    const endpoint = `/invoices/${invoiceId}`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        sentState: "sent",
        ...(message && { contactMessage: message }),
      },
    };
    await this.makeRequest("PUT", endpoint, payload);
  }

  // Customer methods
  async getContacts(
    type: "customer" | "supplier" = "customer",
    search?: string
  ): Promise<BillyContact[]> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    // Implement pagination to fetch ALL contacts, not just first page
    // Billy API v2 uses page and pageSize (max 1000 per page)
    const allContacts: BillyContact[] = [];
    let page = 1;
    const pageSize = 1000; // Billy API max pageSize
    let hasMore = true;

    while (hasMore) {
      const queryParams = new URLSearchParams();
      // Billy API uses 'company' or 'person', not 'customer'/'supplier'
      queryParams.append("type", type === "customer" ? "company" : "company");
      if (search) queryParams.append("name", search);
      queryParams.append("pageSize", pageSize.toString());
      queryParams.append("page", page.toString());

      const endpoint = `/contacts?${queryParams.toString()}`;
      const response = await this.makeRequest<{
        contacts: BillyContact[];
        meta?: { paging?: { pageCount?: number; total?: number } };
      }>("GET", endpoint);

      if (!response || !response.contacts) {
        log.error("Invalid contacts response structure", null, { response });
        break;
      }

      const contacts = response.contacts;
      allContacts.push(...contacts);

      // Check if we've reached the last page
      const paging = response.meta?.paging;
      if (paging) {
        const pageCount = paging.pageCount || 1;
        if (page >= pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // Fallback: if we got fewer contacts than pageSize, we're done
        if (contacts.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Safety limit to prevent infinite loops (max 100 pages = 100,000 contacts)
      if (page > 100) {
        log.warn("Reached pagination safety limit", {
          totalFetched: allContacts.length,
          page,
        });
        break;
      }
    }

    log.debug("Fetched all contacts with pagination", {
      type,
      search: search || "none",
      totalContacts: allContacts.length,
      pagesFetched: page - 1 || 1,
    });

    return allContacts;
  }

  async getContact(contactId: string): Promise<BillyContact> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    // The token is already tied to a single organization
    const endpoint = `/contacts/${contactId}`;
    const response = await this.makeRequest<{ contact: BillyContact }>(
      "GET",
      endpoint
    );
    return response.contact;
  }

  async createContact(contactData: CreateCustomerInput): Promise<BillyContact> {
    const endpoint = `/contacts`;

    // Billy API structure: BARE MINIMUM - only name and type
    // NO email, NO phone, NO contactPersons on CREATE
    const contact: any = {
      type: "person", // Use 'person' for individuals, 'company' for businesses
      name: contactData.name,
      countryId: contactData.address?.country || "DK",
    };

    // NOTE: Email and phone are NOT supported on CREATE
    // We'll add them via UPDATE after contact is created

    // Add address fields if provided
    if (contactData.address) {
      if (contactData.address.street) {
        contact.street = contactData.address.street;
      }
      if (contactData.address.city) {
        contact.cityText = contactData.address.city;
      }
      if (contactData.address.zipcode) {
        contact.zipcodeText = contactData.address.zipcode;
      }
    }

    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      contact,
    };

    log.debug("Creating contact", { endpoint, payload });

    try {
      // Billy API can return either { contact: {...} } or { contacts: [...] }
      const response = await this.makeRequest<Record<string, any>>(
        "POST",
        endpoint,
        payload
      );

      // Use parseResponse helper to handle both singular and plural formats
      const createdContact = this.parseResponse<BillyContact>(
        response,
        "contact",
        "contacts",
        "create contact"
      );

      if (!createdContact) {
        throw new Error(
          "Invalid response format from Billy API - expected contact or contacts"
        );
      }

      // NOTE: Billy API does NOT support email or phone on contacts when using OAuth tokens
      // The API only allows: name, type, countryId on CREATE
      // There is NO way to add email or phone via UPDATE either (contactPersons cannot be modified)
      //
      // This is a limitation of the Billy API, not our implementation.
      // Email and phone must be managed outside of Billy, or users must use the Billy web interface.
      if (contactData.email || contactData.phone) {
        log.warn("Email and phone not supported for OAuth token contacts", {
          requestedEmail: contactData.email || "none",
          requestedPhone: contactData.phone || "none",
          limitation: "Billy API limitation, not implementation issue",
        });
      }

      return createdContact;
    } catch (error: any) {
      log.error("Billy API create contact error", error, {
        errorType: error.constructor.name,
        billyDetails: error.billyDetails,
        responseData: error.response?.data,
        status: error.response?.status,
      });
      // Re-throw the error WITH Billy details preserved
      throw error;
    }
  }

  // Product methods
  async getProducts(search?: string): Promise<BillyProduct[]> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    // Implement pagination to fetch ALL products, not just first page
    // Billy API v2 uses page and pageSize (max 1000 per page)
    const allProducts: BillyProduct[] = [];
    let page = 1;
    const pageSize = 1000; // Billy API max pageSize
    let hasMore = true;

    while (hasMore) {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("name", search);
      queryParams.append("pageSize", pageSize.toString());
      queryParams.append("page", page.toString());

      const endpoint = `/products?${queryParams.toString()}`;
      const response = await this.makeRequest<{
        products: BillyProduct[];
        meta?: { paging?: { pageCount?: number; total?: number } };
      }>("GET", endpoint);

      if (!response || !response.products) {
        log.error("Invalid products response structure", null, { response });
        break;
      }

      const products = response.products;
      allProducts.push(...products);

      // Check if we've reached the last page
      const paging = response.meta?.paging;
      if (paging) {
        const pageCount = paging.pageCount || 1;
        if (page >= pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // Fallback: if we got fewer products than pageSize, we're done
        if (products.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Safety limit to prevent infinite loops (max 100 pages = 100,000 products)
      if (page > 100) {
        log.warn("Reached pagination safety limit (products)", {
          totalFetched: allProducts.length,
          page,
        });
        break;
      }
    }

    log.debug("Fetched all products with pagination", {
      search: search || "none",
      totalProducts: allProducts.length,
      pagesFetched: page - 1 || 1,
    });

    return allProducts;
  }

  async createProduct(productData: CreateProductInput): Promise<BillyProduct> {
    const endpoint = `/products`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      product: {
        name: productData.name,
        description: productData.description,
        prices: productData.prices.map((price) => ({
          currencyId: price.currencyId || "DKK",
          unitPrice: price.unitPrice,
        })),
      },
    };

    const response = await this.makeRequest<{
      product?: BillyProduct;
      products?: BillyProduct[];
    }>("POST", endpoint, payload);

    // Billy API can return either {product: {...}} or {products: [...]}
    const product = this.parseResponse<BillyProduct>(
      response,
      "product",
      "products",
      "create product"
    );

    if (!product) {
      throw new Error(
        "Invalid response format from Billy API - expected product or products"
      );
    }

    return product;
  }

  // Revenue methods
  async getRevenue(startDate: string, endDate: string): Promise<RevenueData> {
    // Get invoices for the period
    const invoices = await this.getInvoices({ startDate, endDate });

    // Calculate revenue metrics using Billy API fields
    // Note: Billy API uses isPaid boolean, not a 'paid' state
    const paidInvoices = invoices.filter((inv) => inv.isPaid === true);
    const pendingInvoices = invoices.filter(
      (inv) => inv.state === "approved" && !inv.isPaid
    );
    const overdueInvoices = invoices.filter((inv) => {
      if (inv.isPaid || inv.state !== "approved" || !inv.dueDate) return false;
      return new Date(inv.dueDate) < new Date();
    });

    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );

    return {
      period: `${startDate} to ${endDate}`,
      totalRevenue,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
    };
  }

  // Organization methods
  async getOrganization(): Promise<BillyOrganization> {
    const endpoint = `/organizations/${this.config.organizationId}`; // This one uses path param (confirmed working)
    const response = await this.makeRequest<{
      organization: BillyOrganization;
    }>("GET", endpoint);
    return response.organization;
  }

  // Authentication validation
  async validateAuth(): Promise<{
    valid: boolean;
    organization?: BillyOrganization;
    error?: string;
  }> {
    try {
      log.info("Validating Billy API authentication", {
        apiKeyPresent: !!this.config.apiKey,
        organizationId: this.config.organizationId,
        apiBase: this.config.apiBase,
        circuitBreakerState: this.circuitBreaker.opened ? "open" : (this.circuitBreaker.halfOpen ? "half-open" : "closed"),
      });

      const org = await this.getOrganization();
      log.info("Billy API authentication successful", {
        organization: org.name,
      });
      return { valid: true, organization: org };
    } catch (error: any) {
      log.error("Billy API authentication failed", error);
      return {
        valid: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Get client health status including circuit breaker metrics
   */
  getHealthStatus(): {
    circuitBreaker: {
      state: string;
      stats: any;
    };
    rateLimiter: {
      requestsInWindow: number;
      backoffMultiplier: number;
    };
    fallbackCache: {
      size: number;
    };
    pendingRequests: number;
  } {
    return {
      circuitBreaker: {
        state: (this.circuitBreaker.stats as any).state || "unknown",
        stats: {
          requests: (this.circuitBreaker.stats as any).requests || 0,
          successes: (this.circuitBreaker.stats as any).successes || 0,
          failures: (this.circuitBreaker.stats as any).failures || 0,
          rejects: (this.circuitBreaker.stats as any).rejects || 0,
          timeouts: (this.circuitBreaker.stats as any).timeouts || 0,
          fallbacks: (this.circuitBreaker.stats as any).fallbacks || 0,
          latencyMean: (this.circuitBreaker.stats as any).latencyMean || 0,
          percentiles: (this.circuitBreaker.stats as any).percentiles || {},
        },
      },
      rateLimiter: this.rateLimiter.getStats(),
      fallbackCache: {
        size: this.fallbackCache.size,
      },
      pendingRequests: this.requestDeduplicator.getPendingCount(),
    };
  }

  /**
   * Reset circuit breaker (for testing/recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.close();
    log.info("Circuit breaker manually reset");
  }

  /**
   * Clear fallback cache
   */
  clearFallbackCache(): void {
    this.fallbackCache.clear();
    log.info("Fallback cache cleared");
  }

  // Sprint 1: Update methods

  /**
   * Update an existing invoice
   */
  async updateInvoice(
    invoiceId: string,
    invoiceData: Partial<CreateInvoiceInput>
  ): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;

    // Fetch existing invoice first to merge with updates
    const existingInvoice = await this.getInvoice(invoiceId);

    if (!existingInvoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        type: "invoice", // Required by Billy API
        contactId: invoiceData.contactId || existingInvoice.contactId,
        entryDate: invoiceData.entryDate || existingInvoice.entryDate,
        paymentTermsDays:
          invoiceData.paymentTermsDays || existingInvoice.paymentTermsDays,
        ...(invoiceData.lines && {
          lines: invoiceData.lines.map((line) => ({
            productId: line.productId, // Must be first
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      },
    };

    const response = await this.makeRequest<{ invoice: BillyInvoice }>(
      "PUT",
      endpoint,
      payload
    );

    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    interface InvoiceLine {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const linesResponse = await this.makeRequest<{
      invoiceLines: InvoiceLine[];
    }>("GET", linesEndpoint);

    return {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };
  }

  /**
   * Approve an invoice (change state from draft to approved)
   */
  async approveInvoice(invoiceId: string): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        state: "approved",
      },
    };

    const response = await this.makeRequest<{ invoice: BillyInvoice }>(
      "PUT",
      endpoint,
      payload
    );

    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    interface InvoiceLine {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const linesResponse = await this.makeRequest<{
      invoiceLines: InvoiceLine[];
    }>("GET", linesEndpoint);

    return {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        state: "cancelled",
      },
    };

    const response = await this.makeRequest<{ invoice: BillyInvoice }>(
      "PUT",
      endpoint,
      payload
    );

    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    interface InvoiceLine {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const linesResponse = await this.makeRequest<{
      invoiceLines: InvoiceLine[];
    }>("GET", linesEndpoint);

    return {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(
    invoiceId: string,
    paymentDate: string,
    amount?: number
  ): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        state: "paid",
        paymentDate: paymentDate,
        ...(amount && { totalAmount: amount }),
      },
    };

    const response = await this.makeRequest<{ invoice: BillyInvoice }>(
      "PUT",
      endpoint,
      payload
    );

    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    interface InvoiceLine {
      id: string;
      invoiceId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      tax: number;
    }
    const linesResponse = await this.makeRequest<{
      invoiceLines: InvoiceLine[];
    }>("GET", linesEndpoint);

    return {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };
  }

  /**
   * Update an existing contact/customer
   *
   * SIMPLIFIED APPROACH: Send only the fields being updated
   * Billy API will merge with existing contact data automatically
   */
  async updateContact(
    contactId: string,
    contactData: {
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
  ): Promise<BillyContact> {
    const endpoint = `/contacts/${contactId}`;

    // Build minimal payload - ONLY fields being updated
    // No need to fetch existing contact - Billy API handles merging
    const contactUpdate: any = {};

    // Add name if provided
    if (contactData.name !== undefined) {
      contactUpdate.name = contactData.name;
    }

    // Add phone if provided (top level only, NOT in contactPersons!)
    if (contactData.phone !== undefined) {
      contactUpdate.phone = contactData.phone;
    }

    // Add email if provided (contactPersons array, NO phone here!)
    if (contactData.email !== undefined) {
      contactUpdate.contactPersons = [
        {
          name: contactData.name || "Contact", // Fallback if name not provided
          email: contactData.email,
          // CRITICAL: NO phone field here - Billy API rejects it!
        },
      ];
    }

    // Add address fields if provided
    if (contactData.address) {
      if (contactData.address.street)
        contactUpdate.street = contactData.address.street;
      if (contactData.address.zipcode)
        contactUpdate.zipcode = contactData.address.zipcode;
      if (contactData.address.city)
        contactUpdate.city = contactData.address.city;
      if (contactData.address.country)
        contactUpdate.countryId = contactData.address.country;
    }

    // Send minimal payload
    const payload = { contact: contactUpdate };

    const response = await this.makeRequest<{
      contact?: BillyContact;
      contacts?: BillyContact[];
    }>("PUT", endpoint, payload);

    // Billy API can return either {contact: {...}} or {contacts: [...]}
    const contact = this.parseResponse<BillyContact>(
      response,
      "contact",
      "contacts",
      "update contact"
    );

    if (!contact) {
      throw new Error(
        "Invalid response format from Billy API - expected contact or contacts"
      );
    }

    return contact;
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    productData: Partial<CreateProductInput>
  ): Promise<BillyProduct> {
    const endpoint = `/products/${productId}`;

    // Fetch existing product first to merge with updates
    const existingProducts = await this.getProducts();
    const existingProduct = existingProducts.find((p) => p.id === productId);

    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      product: {
        name: productData.name || existingProduct.name,
        description: productData.description || existingProduct.description,
        ...(productData.prices && {
          prices: productData.prices.map((price) => ({
            currencyId: price.currencyId || "DKK",
            unitPrice: price.unitPrice,
          })),
        }),
      },
    };

    // Billy API can return either {product: {...}} or {products: [...]}
    const response = await this.makeRequest<{
      product?: BillyProduct;
      products?: BillyProduct[];
    }>("PUT", endpoint, payload);

    const product = this.parseResponse<BillyProduct>(
      response,
      "product",
      "products",
      "update product"
    );

    if (!product) {
      throw new Error(
        "Invalid response format from Billy API - expected product or products"
      );
    }

    return product;
  }

  // ============================================================================
  // v3.0 HIERARCHICAL TOOLS
  // ============================================================================

  /**
   * Helper: Convert Billy invoice to compact format
   */
  private toCompactInvoice(invoice: BillyInvoice): CompactInvoice {
    const dueDate = invoice.paymentTerms?.paymentTermsType === "net"
      ? new Date(new Date(invoice.createdTime).getTime() + (invoice.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
      : new Date(invoice.createdTime);

    const now = new Date();
    const daysOverdue = invoice.state !== "paid" && dueDate < now
      ? Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo || "DRAFT",
      customerName: invoice.contact?.name || "Unknown",
      customerEmail: invoice.contact?.email,
      amount: invoice.totalAmount || 0,
      currency: invoice.currency || "DKK",
      dueDate: dueDate.toISOString().split('T')[0],
      state: invoice.state || "draft",
      daysOverdue,
      _customerId: invoice.contactId || "",
    };
  }

  /**
   * Helper: Convert Billy contact to compact format
   */
  private toCompactCustomer(contact: BillyContact, invoices?: BillyInvoice[]): CompactCustomer {
    const customerInvoices = invoices || [];
    const lastInvoice = customerInvoices
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())[0];

    return {
      id: contact.id,
      name: contact.name,
      email: contact.contactPersons?.[0]?.email || contact.email || "",
      phone: contact.phone,
      _lastInvoiceDate: lastInvoice ? new Date(lastInvoice.createdTime).toISOString().split('T')[0] : undefined,
      _totalInvoices: customerInvoices.length,
    };
  }

  // ============================================================================
  // LEVEL 1: SUMMARY TOOLS (10-50 tokens)
  // ============================================================================

  /**
   * get_invoice_summary - High-level invoice statistics
   * Token budget: 15 tokens
   */
  async getInvoiceSummary(): Promise<InvoiceSummary> {
    const invoices = await this.getInvoices();

    const unpaid = invoices.filter(i => i.state === "approved" || i.state === "sent");
    const now = new Date();
    const overdue = unpaid.filter(i => {
      const dueDate = i.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(i.createdTime);
      return dueDate < now;
    });

    const paid = invoices.filter(i => i.state === "paid");
    const draft = invoices.filter(i => i.state === "draft");

    const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const avgAmount = invoices.length > 0 ? totalAmount / invoices.length : 0;

    const totalUnpaidAmount = unpaid.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const oldestUnpaid = unpaid.length > 0
      ? unpaid.reduce((oldest, i) => {
          const date = new Date(i.createdTime);
          return date < oldest ? date : oldest;
        }, new Date())
      : new Date();
    const oldestUnpaidDays = unpaid.length > 0
      ? Math.floor((now.getTime() - oldestUnpaid.getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      total: invoices.length,
      unpaid: unpaid.length,
      overdue: overdue.length,
      paid: paid.length,
      draft: draft.length,
      _avgAmount: Math.round(avgAmount * 100) / 100,
      _oldestUnpaidDays: oldestUnpaidDays,
      _totalUnpaidAmount: Math.round(totalUnpaidAmount * 100) / 100,
      _schema: "BillyInvoiceSummary",
      _nextActions: ["list_unpaid_invoices", "list_overdue_invoices", "list_recent_invoices"],
      _tokenUsage: 15,
    };
  }

  /**
   * get_customer_summary - High-level customer statistics
   * Token budget: 12 tokens
   */
  async getCustomerSummary(): Promise<CustomerSummary> {
    const contacts = await this.getContacts();
    const invoices = await this.getInvoices();

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const active = contacts.filter(contact => {
      const customerInvoices = invoices.filter(i => i.contactId === contact.id);
      return customerInvoices.some(i => new Date(i.createdTime) > ninetyDaysAgo);
    });

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = contacts.filter(c => new Date(c.createdTime) >= startOfMonth);

    const totalInvoices = invoices.length;
    const avgInvoicesPerCustomer = contacts.length > 0 ? totalInvoices / contacts.length : 0;

    return {
      total: contacts.length,
      active: active.length,
      dormant: contacts.length - active.length,
      _newThisMonth: newThisMonth.length,
      _avgInvoicesPerCustomer: Math.round(avgInvoicesPerCustomer * 10) / 10,
      _schema: "BillyCustomerSummary",
      _nextActions: ["search_customers", "list_active_customers"],
      _tokenUsage: 12,
    };
  }

  /**
   * get_business_overview - Complete business snapshot
   * Token budget: 35 tokens
   */
  async getBusinessOverview(): Promise<BusinessOverview> {
    // Fetch all data in parallel for speed
    const [invoices, contacts, products] = await Promise.all([
      this.getInvoices(),
      this.getContacts(),
      this.getProducts(),
    ]);

    const now = new Date();
    const unpaid = invoices.filter(i => i.state === "approved" || i.state === "sent");
    const overdue = unpaid.filter(i => {
      const dueDate = i.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(i.createdTime);
      return dueDate < now;
    });
    const draft = invoices.filter(i => i.state === "draft");
    const totalUnpaidAmount = unpaid.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const activeCustomers = contacts.filter(contact => {
      const customerInvoices = invoices.filter(i => i.contactId === contact.id);
      return customerInvoices.some(i => new Date(i.createdTime) > ninetyDaysAgo);
    });

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = contacts.filter(c => new Date(c.createdTime) >= startOfMonth);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentInvoices = invoices.filter(i => new Date(i.createdTime) > sevenDaysAgo);

    const alerts: string[] = [];
    if (overdue.length > 0) alerts.push(`${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}`);
    if (newCustomersThisMonth.length > 0) alerts.push(`${newCustomersThisMonth.length} new customer${newCustomersThisMonth.length > 1 ? 's' : ''} this month`);
    if (draft.length > 5) alerts.push(`${draft.length} draft invoices pending`);

    return {
      invoices: {
        total: invoices.length,
        unpaid: unpaid.length,
        overdue: overdue.length,
        draft: draft.length,
        _totalUnpaidAmount: Math.round(totalUnpaidAmount * 100) / 100,
      },
      customers: {
        total: contacts.length,
        active: activeCustomers.length,
        _newThisMonth: newCustomersThisMonth.length,
      },
      products: {
        total: products.length,
        active: products.length, // Billy doesn't have inactive products
      },
      _recentActivity: `${recentInvoices.length} invoice${recentInvoices.length !== 1 ? 's' : ''} created this week`,
      _alerts: alerts,
      _schema: "BillyBusinessOverview",
      _nextActions: unpaid.length > 0 ? ["list_unpaid_invoices", "search_customers"] : ["create_invoice", "search_customers"],
      _tokenUsage: 35,
    };
  }

  // ============================================================================
  // LEVEL 2: FILTERED LISTS (100-500 tokens)
  // ============================================================================

  /**
   * list_unpaid_invoices - Compact list of unpaid invoices
   * Token budget: 120 tokens (12 invoices × 10 tokens each)
   */
  async listUnpaidInvoices(input: ListUnpaidInvoicesInput = {}): Promise<InvoiceList> {
    const { limit = 20, sortBy = "dueDate" } = input;
    const maxLimit = Math.min(limit, 100);

    const allInvoices = await this.getInvoices();
    let unpaid = allInvoices.filter(i => i.state === "approved" || i.state === "sent");

    // Sort
    if (sortBy === "dueDate") {
      unpaid.sort((a, b) => {
        const dateA = a.paymentTerms?.paymentTermsType === "net"
          ? new Date(new Date(a.createdTime).getTime() + (a.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
          : new Date(a.createdTime);
        const dateB = b.paymentTerms?.paymentTermsType === "net"
          ? new Date(new Date(b.createdTime).getTime() + (b.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
          : new Date(b.createdTime);
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });
    } else if (sortBy === "amount") {
      unpaid.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0)); // Highest first
    } else if (sortBy === "createdDate") {
      unpaid.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()); // Newest first
    }

    const total = unpaid.length;
    const limited = unpaid.slice(0, maxLimit);
    const compact = limited.map(i => this.toCompactInvoice(i));
    const totalAmount = unpaid.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return {
      invoices: compact,
      _total: total,
      _hasMore: total > maxLimit,
      _totalAmount: Math.round(totalAmount * 100) / 100,
      _schema: "BillyUnpaidInvoiceList",
      _nextActions: ["get_invoice_details", "send_invoice", "mark_invoice_paid"],
      _tokenUsage: compact.length * 10,
    };
  }

  /**
   * list_overdue_invoices - Compact list of overdue invoices
   * Token budget: 80 tokens
   */
  async listOverdueInvoices(input: ListOverdueInvoicesInput = {}): Promise<InvoiceList> {
    const { limit = 20, minDaysOverdue = 0 } = input;
    const maxLimit = Math.min(limit, 100);

    const allInvoices = await this.getInvoices();
    const now = new Date();

    let overdue = allInvoices.filter(i => {
      if (i.state !== "approved" && i.state !== "sent") return false;

      const dueDate = i.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(i.createdTime);

      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      return daysOverdue >= minDaysOverdue;
    });

    // Sort by days overdue (most urgent first)
    overdue.sort((a, b) => {
      const dateA = a.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(a.createdTime).getTime() + (a.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(a.createdTime);
      const dateB = b.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(b.createdTime).getTime() + (b.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(b.createdTime);
      return dateA.getTime() - dateB.getTime(); // Oldest due date first
    });

    const total = overdue.length;
    const limited = overdue.slice(0, maxLimit);
    const compact = limited.map(i => this.toCompactInvoice(i));
    const totalAmount = overdue.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return {
      invoices: compact,
      _total: total,
      _hasMore: total > maxLimit,
      _totalAmount: Math.round(totalAmount * 100) / 100,
      _schema: "BillyOverdueInvoiceList",
      _nextActions: ["get_invoice_details", "send_invoice"],
      _tokenUsage: compact.length * 10,
    };
  }

  /**
   * list_recent_invoices - Recent invoices (any state)
   * Token budget: 100 tokens
   */
  async listRecentInvoices(input: ListRecentInvoicesInput = {}): Promise<InvoiceList> {
    const { days = 7, limit = 20, state = "all" } = input;
    const maxLimit = Math.min(limit, 100);

    const allInvoices = await this.getInvoices();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let recent = allInvoices.filter(i => new Date(i.createdTime) > cutoffDate);

    if (state !== "all") {
      if (state === "unpaid") {
        recent = recent.filter(i => i.state === "approved" || i.state === "sent");
      } else {
        recent = recent.filter(i => i.state === state);
      }
    }

    // Sort by created date (newest first)
    recent.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

    const total = recent.length;
    const limited = recent.slice(0, maxLimit);
    const compact = limited.map(i => this.toCompactInvoice(i));

    return {
      invoices: compact,
      _total: total,
      _hasMore: total > maxLimit,
      _period: `last_${days}_days`,
      _schema: "BillyRecentInvoiceList",
      _nextActions: ["get_invoice_details"],
      _tokenUsage: compact.length * 10,
    };
  }

  /**
   * search_customers - Fuzzy search for customers by name
   * Token budget: 80 tokens (10 customers × 8 tokens each)
   */
  async searchCustomers(input: SearchCustomersInput): Promise<CustomerSearchResult> {
    const { query, limit = 10 } = input;
    const maxLimit = Math.min(limit, 50);

    const allContacts = await this.getContacts();
    const allInvoices = await this.getInvoices();

    // Normalize query for fuzzy matching
    const normalizedQuery = query.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

    // Score each contact
    const scored = allContacts.map(contact => {
      const normalizedName = contact.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let score = 0;

      // Exact match
      if (normalizedName === normalizedQuery) score = 100;
      // Starts with
      else if (normalizedName.startsWith(normalizedQuery)) score = 90;
      // Contains
      else if (normalizedName.includes(normalizedQuery)) score = 70;
      // Partial word match
      else {
        const queryWords = normalizedQuery.split(/\s+/);
        const nameWords = normalizedName.split(/\s+/);
        const matchingWords = queryWords.filter(qw =>
          nameWords.some(nw => nw.startsWith(qw) || nw.includes(qw))
        );
        score = (matchingWords.length / queryWords.length) * 60;
      }

      return { contact, score };
    });

    // Filter and sort
    const matches = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLimit);

    const exactMatch = matches.length > 0 && matches[0].score === 100;

    // Generate suggestions if no exact match
    const suggestions: string[] = [];
    if (!exactMatch && matches.length > 0) {
      suggestions.push(...matches.slice(0, 3).map(m => m.contact.name));
    }

    const compact = matches.map(m => {
      const customerInvoices = allInvoices.filter(i => i.contactId === m.contact.id);
      const result = this.toCompactCustomer(m.contact, customerInvoices);
      return { ...result, _matchScore: Math.round(m.score) };
    });

    return {
      customers: compact,
      _exactMatch: exactMatch,
      _suggestions: suggestions,
      _total: matches.length,
      _schema: "BillyCustomerSearchResult",
      _nextActions: exactMatch ? ["get_customer_details", "create_invoice"] : ["create_customer"],
      _tokenUsage: compact.length * 8,
    };
  }

  /**
   * list_active_customers - Customers with recent invoices
   * Token budget: 150 tokens
   */
  async listActiveCustomers(input: ListActiveCustomersInput = {}): Promise<CustomerSearchResult> {
    const { activeDays = 90, limit = 20 } = input;
    const maxLimit = Math.min(limit, 50);

    const allContacts = await this.getContacts();
    const allInvoices = await this.getInvoices();

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - activeDays * 24 * 60 * 60 * 1000);

    const active = allContacts.filter(contact => {
      const customerInvoices = allInvoices.filter(i => i.contactId === contact.id);
      return customerInvoices.some(i => new Date(i.createdTime) > cutoffDate);
    });

    // Sort by most recent invoice
    active.sort((a, b) => {
      const aInvoices = allInvoices.filter(i => i.contactId === a.id);
      const bInvoices = allInvoices.filter(i => i.contactId === b.id);
      const aLatest = aInvoices.reduce((latest, i) => {
        const date = new Date(i.createdTime);
        return date > latest ? date : latest;
      }, new Date(0));
      const bLatest = bInvoices.reduce((latest, i) => {
        const date = new Date(i.createdTime);
        return date > latest ? date : latest;
      }, new Date(0));
      return bLatest.getTime() - aLatest.getTime(); // Most recent first
    });

    const total = active.length;
    const limited = active.slice(0, maxLimit);
    const compact = limited.map(c => {
      const customerInvoices = allInvoices.filter(i => i.contactId === c.id);
      return this.toCompactCustomer(c, customerInvoices);
    });

    return {
      customers: compact,
      _total: total,
      _schema: "BillyCustomerSearchResult",
      _nextActions: ["get_customer_details", "create_invoice"],
      _tokenUsage: compact.length * 8,
    };
  }

  /**
   * search_invoices - Search/filter invoices
   * Token budget: 150 tokens
   */
  async searchInvoices(input: SearchInvoicesInput = {}): Promise<InvoiceSearchResult> {
    const { customerName, state = "all", minAmount, maxAmount, dateFrom, dateTo, limit = 20 } = input;
    const maxLimit = Math.min(limit, 100);

    let invoices = await this.getInvoices();

    // Filter by customer name
    if (customerName) {
      const normalizedQuery = customerName.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      invoices = invoices.filter(i => {
        const normalizedName = (i.contact?.name || "").toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedName.includes(normalizedQuery);
      });
    }

    // Filter by state
    if (state !== "all") {
      if (state === "unpaid") {
        invoices = invoices.filter(i => i.state === "approved" || i.state === "sent");
      } else if (state === "overdue") {
        const now = new Date();
        invoices = invoices.filter(i => {
          if (i.state !== "approved" && i.state !== "sent") return false;
          const dueDate = i.paymentTerms?.paymentTermsType === "net"
            ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
            : new Date(i.createdTime);
          return dueDate < now;
        });
      } else {
        invoices = invoices.filter(i => i.state === state);
      }
    }

    // Filter by amount
    if (minAmount !== undefined) {
      invoices = invoices.filter(i => (i.totalAmount || 0) >= minAmount);
    }
    if (maxAmount !== undefined) {
      invoices = invoices.filter(i => (i.totalAmount || 0) <= maxAmount);
    }

    // Filter by date
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      invoices = invoices.filter(i => new Date(i.createdTime) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      invoices = invoices.filter(i => new Date(i.createdTime) <= toDate);
    }

    // Sort by created date (newest first)
    invoices.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

    const total = invoices.length;
    const limited = invoices.slice(0, maxLimit);
    const compact = limited.map(i => this.toCompactInvoice(i));

    return {
      invoices: compact,
      _total: total,
      _hasMore: total > maxLimit,
      _filters: {
        state: state !== "all" ? state : undefined,
        customerName,
        minAmount,
        maxAmount,
        dateFrom,
        dateTo,
      },
      _schema: "BillyInvoiceSearchResult",
      _nextActions: ["get_invoice_details"],
      _tokenUsage: compact.length * 10,
    };
  }

  // ============================================================================
  // LEVEL 3: DETAILED RETRIEVAL (500-2000 tokens)
  // ============================================================================

  /**
   * get_invoice_details - Complete invoice data
   * Token budget: 500 tokens
   */
  async getInvoiceDetails(input: GetInvoiceDetailsInput): Promise<InvoiceDetails> {
    const { invoiceId, invoiceNo } = input;

    if (!invoiceId && !invoiceNo) {
      throw new Error("Either invoiceId or invoiceNo must be provided");
    }

    // Find invoice
    const allInvoices = await this.getInvoices();
    let invoice: BillyInvoice | undefined;

    if (invoiceId) {
      invoice = allInvoices.find(i => i.id === invoiceId);
    } else if (invoiceNo) {
      invoice = allInvoices.find(i => i.invoiceNo === invoiceNo);
    }

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId || invoiceNo}`);
    }

    // Get full invoice with lines
    const fullInvoice = await this.getInvoice(invoice.id);

    // Get related invoices for same customer
    const relatedInvoices = allInvoices
      .filter(i => i.contactId === invoice.contactId && i.id !== invoice.id)
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      .slice(0, 5)
      .map(i => ({
        id: i.id,
        invoiceNo: i.invoiceNo || "DRAFT",
        amount: i.totalAmount || 0,
        state: i.state || "draft",
        dueDate: i.paymentTerms?.paymentTermsType === "net"
          ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(i.createdTime).toISOString().split('T')[0],
      }));

    return {
      invoice: {
        id: fullInvoice.id,
        invoiceNo: fullInvoice.invoiceNo || "DRAFT",
        state: fullInvoice.state || "draft",
        createdDate: new Date(fullInvoice.createdTime).toISOString().split('T')[0],
        dueDate: fullInvoice.paymentTerms?.paymentTermsType === "net"
          ? new Date(new Date(fullInvoice.createdTime).getTime() + (fullInvoice.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(fullInvoice.createdTime).toISOString().split('T')[0],
        sentDate: fullInvoice.sentAt ? new Date(fullInvoice.sentAt).toISOString().split('T')[0] : undefined,
        paidDate: fullInvoice.state === "paid" ? new Date(fullInvoice.createdTime).toISOString().split('T')[0] : undefined,
        customer: {
          id: fullInvoice.contactId || "",
          name: fullInvoice.contact?.name || "Unknown",
          email: fullInvoice.contact?.contactPersons?.[0]?.email || fullInvoice.contact?.email || "",
          phone: fullInvoice.contact?.phone,
          address: {
            street: fullInvoice.contact?.street || "",
            city: fullInvoice.contact?.city || "",
            zipcode: fullInvoice.contact?.zipcode || "",
            country: fullInvoice.contact?.countryId || "DK",
          },
        },
        lines: (fullInvoice.lines || []).map(line => ({
          productId: line.productId,
          productName: line.description || "Unknown",
          description: line.description || "",
          quantity: line.quantity || 1,
          unitPrice: line.unitPrice || 0,
          discountPercent: line.discountPercent,
          taxPercent: line.taxPercent || 25,
          total: (line.quantity || 1) * (line.unitPrice || 0),
        })),
        subtotal: fullInvoice.subtotalAmount || 0,
        taxAmount: fullInvoice.taxAmount || 0,
        totalAmount: fullInvoice.totalAmount || 0,
        paidAmount: fullInvoice.state === "paid" ? fullInvoice.totalAmount || 0 : 0,
        currency: fullInvoice.currency || "DKK",
      },
      _relatedInvoices: relatedInvoices,
      _schema: "BillyInvoiceDetails",
      _nextActions: fullInvoice.state === "draft" ? ["send_invoice", "update_invoice"] : ["send_invoice", "mark_invoice_paid"],
      _tokenUsage: 500,
    };
  }

  /**
   * get_customer_details - Complete customer data
   * Token budget: 400 tokens
   */
  async getCustomerDetails(input: GetCustomerDetailsInput): Promise<CustomerDetails> {
    const { customerId, customerName } = input;

    if (!customerId && !customerName) {
      throw new Error("Either customerId or customerName must be provided");
    }

    // Find customer
    const allContacts = await this.getContacts();
    let contact: BillyContact | undefined;

    if (customerId) {
      contact = allContacts.find(c => c.id === customerId);
    } else if (customerName) {
      // Exact match only
      contact = allContacts.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    }

    if (!contact) {
      throw new Error(`Customer not found: ${customerId || customerName}`);
    }

    // Get all invoices for this customer
    const allInvoices = await this.getInvoices();
    const customerInvoices = allInvoices.filter(i => i.contactId === contact.id);

    // Calculate statistics
    const paid = customerInvoices.filter(i => i.state === "paid");
    const unpaid = customerInvoices.filter(i => i.state === "approved" || i.state === "sent");
    const now = new Date();
    const overdue = unpaid.filter(i => {
      const dueDate = i.paymentTerms?.paymentTermsType === "net"
        ? new Date(new Date(i.createdTime).getTime() + (i.paymentTerms.numberOfDays || 0) * 24 * 60 * 60 * 1000)
        : new Date(i.createdTime);
      return dueDate < now;
    });

    const totalRevenue = paid.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const avgInvoiceAmount = customerInvoices.length > 0
      ? customerInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0) / customerInvoices.length
      : 0;

    // Get recent invoices
    const recentInvoices = customerInvoices
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      .slice(0, 5)
      .map(i => this.toCompactInvoice(i));

    return {
      customer: {
        id: contact.id,
        name: contact.name,
        type: contact.type || "company",
        email: contact.contactPersons?.[0]?.email || contact.email || "",
        phone: contact.phone,
        address: {
          street: contact.street,
          city: contact.city,
          zipcode: contact.zipcode,
          country: contact.countryId || "DK",
        },
        _createdDate: new Date(contact.createdTime).toISOString().split('T')[0],
      },
      _invoiceStats: {
        total: customerInvoices.length,
        paid: paid.length,
        unpaid: unpaid.length,
        overdue: overdue.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgInvoiceAmount: Math.round(avgInvoiceAmount * 100) / 100,
      },
      _recentInvoices: recentInvoices,
      _schema: "BillyCustomerDetails",
      _nextActions: ["create_invoice", "update_customer"],
      _tokenUsage: 400,
    };
  }

  /**
   * get_product_details - Complete product data
   * Token budget: 300 tokens
   */
  async getProductDetails(input: GetProductDetailsInput): Promise<ProductDetails> {
    const { productId } = input;

    const allProducts = await this.getProducts();
    const product = allProducts.find(p => p.id === productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Get invoices using this product
    const allInvoices = await this.getInvoices();
    const productInvoices: Array<{
      invoiceNo: string;
      customerName: string;
      quantity: number;
      date: string;
    }> = [];

    for (const invoice of allInvoices) {
      if (invoice.lines) {
        for (const line of invoice.lines) {
          if (line.productId === productId) {
            productInvoices.push({
              invoiceNo: invoice.invoiceNo || "DRAFT",
              customerName: invoice.contact?.name || "Unknown",
              quantity: line.quantity || 1,
              date: new Date(invoice.createdTime).toISOString().split('T')[0],
            });
          }
        }
      }
    }

    // Sort by date and limit to 5 most recent
    const recentUsage = productInvoices
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description || "",
        unitPrice: product.prices?.[0]?.unitPrice || 0,
        currency: product.prices?.[0]?.currencyId || "DKK",
        taxPercent: 25, // Billy uses standard 25% VAT for Denmark
        accountId: product.account?.id,
        _createdDate: new Date(product.createdTime).toISOString().split('T')[0],
        _usageCount: productInvoices.length,
      },
      _recentInvoices: recentUsage,
      _schema: "BillyProductDetails",
      _nextActions: ["create_invoice", "update_product"],
      _tokenUsage: 300,
    };
  }
}
// Force redeploy 2025-10-13 11:34:16
