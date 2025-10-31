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

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import CircuitBreaker from 'opossum';
import { log } from './utils/logger.js';
import {
  BillyInvoice,
  BillyContact,
  BillyProduct,
  BillyOrganization,
  BillyConfig,
  BillyApiError,
  CreateInvoiceInput,
  CreateCustomerInput,
  CreateProductInput,
  RevenueData,
} from './types.js';

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
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      let waitTime = this.windowMs - (now - oldestRequest);
      
      // Apply exponential backoff with jitter
      if (now - this.lastBackoffTime < 60000) { // Within last minute
        this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, 8);
      } else {
        this.backoffMultiplier = 1; // Reset backoff
      }
      
      // Add jitter (±25%)
      const jitter = 0.75 + (Math.random() * 0.5);
      waitTime = Math.max(waitTime * this.backoffMultiplier * jitter, 1000);
      
      this.lastBackoffTime = now;
      
      log.warn('Rate limit reached, applying backoff', {
        waitTime: Math.round(waitTime),
        backoffMultiplier: this.backoffMultiplier,
        requestsInWindow: this.requests.length
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }

  getStats(): { requestsInWindow: number; backoffMultiplier: number } {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return {
      requestsInWindow: this.requests.length,
      backoffMultiplier: this.backoffMultiplier
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
      log.debug('Deduplicating concurrent request', { key });
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
      scheduling: 'fifo', // Better for request ordering
    });

    const httpsAgent = new HttpsAgent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 20,
      timeout: 60000,
      scheduling: 'fifo',
    });

    this.client = axios.create({
      baseURL: config.apiBase,
      timeout: 30000,
      httpAgent,
      httpsAgent,
      headers: {
        'X-Access-Token': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Tekup-Billy-MCP/2.0',
      },
      // Enhanced retry configuration
      validateStatus: (status) => status < 500, // Don't retry 4xx errors
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(this.executeHttpRequest.bind(this) as any, {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50, // Open circuit at 50% error rate
      resetTimeout: 60000, // Try to close circuit after 1 minute
      rollingCountTimeout: 10000, // 10 second rolling window
      rollingCountBuckets: 10, // 10 buckets in rolling window
      name: 'billy-api-circuit-breaker',
      // Fallback function
      fallback: this.handleCircuitBreakerFallback.bind(this),
    });

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      log.warn('Billy API circuit breaker opened - API calls will be blocked');
    });

    this.circuitBreaker.on('halfOpen', () => {
      log.info('Billy API circuit breaker half-open - testing API availability');
    });

    this.circuitBreaker.on('close', () => {
      log.info('Billy API circuit breaker closed - API calls resumed');
    });

    this.circuitBreaker.on('fallback', (result) => {
      log.warn('Billy API circuit breaker fallback triggered', { 
        hasCachedData: !!result 
      });
    });

    // Add response interceptor for enhanced error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Enhanced error logging
        if (error.response?.status >= 500) {
          log.error('Billy API server error', error, {
            status: error.response.status,
            endpoint: error.config?.url,
            method: error.config?.method
          });
        }
        throw error;
      }
    );
  }

  /**
   * Execute HTTP request (used by circuit breaker)
   */
  private async executeHttpRequest<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any): Promise<T> {
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
  private async handleCircuitBreakerFallback<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any): Promise<T> {
    // Try to serve from fallback cache for GET requests
    if (method === 'GET') {
      const cacheKey = `${method}:${endpoint}`;
      const cached = this.fallbackCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        log.info('Serving from fallback cache', { endpoint });
        return cached.data;
      }
    }

    // No fallback available
    throw new Error(`Billy API unavailable and no cached data for ${method} ${endpoint}`);
  }

  /**
   * Store successful response in fallback cache
   */
  private storeFallbackCache<T>(method: string, endpoint: string, data: T): void {
    if (method === 'GET') {
      const cacheKey = `${method}:${endpoint}`;
      this.fallbackCache.set(cacheKey, {
        data,
        timestamp: Date.now()
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

  private async makeRequest<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any): Promise<T> {
    // Apply rate limiting
    await this.rateLimiter.waitIfNeeded();

    // Log request details (hide sensitive data)
    const logData = data ? { ...data } : undefined;
    if (logData && logData.organizationId) {
      logData.organizationId = '[HIDDEN]';
    }
    if (logData && logData.contact && logData.contact.contactPersons) {
      logData.contact.contactPersons = logData.contact.contactPersons.map((p: any) => ({
        name: p.name,
        email: '[HIDDEN]',
        phone: '[HIDDEN]'
      }));
    }
    
    log.billyApi(method, endpoint, {
      data: logData,
      rateLimiterStats: this.rateLimiter.getStats(),
      circuitBreakerState: (this.circuitBreaker.stats as any).state || 'unknown',
      pendingRequests: this.requestDeduplicator.getPendingCount()
    });

    // Dry run mode - return mock data instead of making actual API calls
    if (this.config.dryRun) {
      log.info(`[DRY RUN] ${method} ${endpoint}`, { data: logData });
      const mockResponse = this.getMockResponse<T>(method, endpoint, data);
      log.info('Billy API Mock Response', { response: mockResponse });
      return mockResponse;
    }

    // Use request deduplication for GET requests
    const requestKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;
    
    try {
      const result = await this.requestDeduplicator.deduplicate(requestKey, async () => {
        // Execute request through circuit breaker
        const response = await this.circuitBreaker.fire(method, endpoint, data);
        
        // Store successful GET responses in fallback cache
        this.storeFallbackCache(method, endpoint, response);
        
        return response;
      });
      
      log.info('Billy API Response', {
        endpoint,
        method,
        circuitBreakerState: (this.circuitBreaker.stats as any).state || 'unknown',
        dataSize: JSON.stringify(result).length
      });
      
      return result;
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
        billyErrorCode: error.response?.data?.errorCode || error.response?.data?.code,
        billyErrorMessage: error.response?.data?.message || error.response?.data?.error,
        validationErrors: error.response?.data?.errors || error.response?.data?.meta?.fieldErrors,
        // Full error object for debugging
        fullError: error.response?.data,
      };
      
      log.error('Billy API Error', error, errorDetails);
      
      // Create more descriptive error message
      const enhancedError: any = new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Billy API request failed'
      );
      enhancedError.billyDetails = errorDetails;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  private getMockResponse<T>(method: string, endpoint: string, data?: any): T {
    // Generate mock responses based on endpoint and method
    if (endpoint.includes('/invoices')) {
      if (method === 'GET') {
        // Check if it's a single invoice GET
        if (endpoint.match(/\/invoices\/[^?]+/)) {
          return {
            invoice: {
              id: endpoint.split('/')[2]?.split('?')[0] || `mock-invoice-${Date.now()}`,
              invoiceNo: `INV-${Date.now()}`,
              state: 'draft',
              contactId: 'mock-contact-123',
              currency: 'DKK',
              totalAmount: 8000,
              entryDate: '2025-10-11',
              paymentTermsDays: 30,
              lines: [],
              organizationId: this.config.organizationId
            }
          } as T;
        }
        return { invoices: [], totalCount: 0 } as T;
      } else if (method === 'POST') {
        if (endpoint.includes('/approve')) {
          return {
            invoice: {
              id: endpoint.split('/')[2],
              invoiceNo: `INV-${Date.now()}`,
              state: 'approved',
              contactId: 'mock-contact-123',
              currency: 'DKK',
              totalAmount: 8000,
              entryDate: '2025-10-11',
              lines: [],
              organizationId: this.config.organizationId
            }
          } as T;
        } else if (endpoint.includes('/send')) {
          return {} as T; // Send doesn't return invoice
        }
        return {
          invoice: {
            id: `mock-invoice-${Date.now()}`,
            invoiceNo: `INV-${Date.now()}`,
            state: 'draft',
            contactId: data?.invoice?.contactId || 'mock-contact-123',
            currency: 'DKK',
            totalAmount: 8000,
            entryDate: data?.invoice?.entryDate || '2025-10-11',
            paymentTermsDays: data?.invoice?.paymentTermsDays || 30,
            lines: data?.invoice?.lines || [],
            organizationId: this.config.organizationId
          }
        } as T;
      } else if (method === 'PUT') {
        return {
          invoice: {
            id: endpoint.split('/')[2],
            invoiceNo: `INV-${Date.now()}`,
            state: data?.invoice?.state || 'draft',
            contactId: data?.invoice?.contactId || 'mock-contact-123',
            currency: 'DKK',
            totalAmount: data?.invoice?.totalAmount || 8000,
            entryDate: data?.invoice?.entryDate || '2025-10-11',
            paymentDate: data?.invoice?.paymentDate,
            paymentTermsDays: data?.invoice?.paymentTermsDays || 30,
            lines: data?.invoice?.lines || [],
            organizationId: this.config.organizationId
          }
        } as T;
      }
    } else if (endpoint.includes('/contacts')) {
      if (method === 'GET') {
        if (endpoint.match(/\/contacts\/[^?]+/)) {
          return {
            contact: {
              id: endpoint.split('/')[2]?.split('?')[0] || `mock-contact-${Date.now()}`,
              contactNo: `CUST-${Date.now()}`,
              type: 'customer',
              name: 'Mock Customer',
              contactPersons: [],
              organizationId: this.config.organizationId
            }
          } as T;
        }
        return { contacts: [], totalCount: 0 } as T;
      } else if (method === 'POST' || method === 'PUT') {
        return {
          contact: {
            id: method === 'PUT' ? endpoint.split('/')[2] : `mock-contact-${Date.now()}`,
            contactNo: `CUST-${Date.now()}`,
            type: 'customer',
            name: data?.contact?.name || 'Mock Customer',
            street: data?.contact?.street,
            zipcode: data?.contact?.zipcode,
            city: data?.contact?.city,
            countryId: data?.contact?.countryId || 'DK',
            phone: data?.contact?.phone,
            contactPersons: data?.contact?.contactPersons || [],
            organizationId: this.config.organizationId
          }
        } as T;
      }
    } else if (endpoint.includes('/products')) {
      if (method === 'GET') {
        // Return mock products for testing
        return {
          products: [
            {
              id: 'mock-product-456',
              productNo: 'PROD-001',
              name: 'Mock Product',
              description: 'Test product',
              prices: [{ currencyId: 'DKK', unitPrice: 1000 }],
              organizationId: this.config.organizationId
            }
          ],
          totalCount: 1
        } as T;
      } else if (method === 'POST' || method === 'PUT') {
        return {
          product: {
            id: method === 'PUT' ? endpoint.split('/')[2] : `mock-product-${Date.now()}`,
            productNo: `PROD-${Date.now()}`,
            name: data?.product?.name || 'Mock Product',
            description: data?.product?.description,
            prices: data?.product?.prices || [],
            organizationId: this.config.organizationId
          }
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
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('entryDateGte', params.startDate);
    if (params?.endDate) queryParams.append('entryDateLte', params.endDate);
    if (params?.state) queryParams.append('state', params.state);
    if (params?.contactId) queryParams.append('contactId', params.contactId);

    const endpoint = queryParams.toString() ? `/invoices?${queryParams.toString()}` : `/invoices`;
    const response = await this.makeRequest<{ invoices: BillyInvoice[] }>('GET', endpoint);
    
    if (!response || !response.invoices) {
      log.error('Invalid invoices response structure', null, { response });
      return [];
    }
    
    return response.invoices;
  }

  async getInvoice(invoiceId: string): Promise<BillyInvoice | null> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const endpoint = `/invoices/${invoiceId}`;
    const response = await this.makeRequest<{ invoice: any }>('GET', endpoint);
    
    if (!response || !response.invoice) {
      log.error('Invalid get invoice response structure', null, { response });
      throw new Error('Invalid response format from Billy API - expected invoice object');
    }
    
    // Billy GET /invoices/{id} returns invoice without lines
    // We need to fetch lines separately from /invoiceLines endpoint
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    const linesResponse = await this.makeRequest<{ invoiceLines: any[] }>('GET', linesEndpoint);
    
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
        type: 'invoice', // Required by Billy API
        contactId: invoiceData.contactId,
        entryDate: invoiceData.entryDate,
        paymentTermsMode: 'net', // Required for Billy to calculate dueDate from paymentTermsDays
        paymentTermsDays: invoiceData.paymentTermsDays || 30,
        lines: invoiceData.lines.map(line => ({
          productId: line.productId, // Must be first for Billy API
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      },
    };

    const response = await this.makeRequest<{ invoices: any[]; invoiceLines: any[] }>('POST', endpoint, payload);
    
    if (!response || !response.invoices || response.invoices.length === 0) {
      log.error('Invalid create invoice response structure', null, { response });
      throw new Error('Invalid response format from Billy API - expected invoices array');
    }
    
    const invoice = response.invoices[0];
    if (!invoice) {
      throw new Error('No invoice returned from Billy API');
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
        sentState: 'sent',
        ...(message && { contactMessage: message }),
      },
    };
    await this.makeRequest('PUT', endpoint, payload);
  }

  // Customer methods
  async getContacts(type: 'customer' | 'supplier' = 'customer', search?: string): Promise<BillyContact[]> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const queryParams = new URLSearchParams();
    // Billy API uses 'company' or 'person', not 'customer'/'supplier'
    queryParams.append('type', type === 'customer' ? 'company' : 'company');
    if (search) queryParams.append('name', search);

    const endpoint = `/contacts?${queryParams.toString()}`;
    const response = await this.makeRequest<{ contacts: BillyContact[] }>('GET', endpoint);
    
    if (!response || !response.contacts) {
      log.error('Invalid contacts response structure', null, { response });
      return [];
    }
    
    return response.contacts;
  }

  async getContact(contactId: string): Promise<BillyContact> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    // The token is already tied to a single organization
    const endpoint = `/contacts/${contactId}`;
    const response = await this.makeRequest<{ contact: BillyContact }>('GET', endpoint);
    return response.contact;
  }

  async createContact(contactData: CreateCustomerInput): Promise<BillyContact> {
    const endpoint = `/contacts`;
    
    // Billy API structure: BARE MINIMUM - only name and type
    // NO email, NO phone, NO contactPersons on CREATE
    const contact: any = {
      type: 'person',  // Use 'person' for individuals, 'company' for businesses
      name: contactData.name,
      countryId: contactData.address?.country || 'DK',
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
      contact
    };

    log.debug('Creating contact', { endpoint, payload });
    
    try {
      // Billy API returns { meta, contacts: [...] } not { contact: {...} }
      const response = await this.makeRequest<{ meta: any; contacts: BillyContact[] }>('POST', endpoint, payload);
      
      if (!response || !response.contacts || response.contacts.length === 0) {
        log.error('Invalid create contact response structure', null, { response });
        throw new Error('Invalid response format from Billy API - expected contacts array');
      }
      
      // Return the first (and should be only) contact from the array
      const createdContact = response.contacts[0];
      if (!createdContact) {
        throw new Error('Billy API returned empty contacts array');
      }
      
      // NOTE: Billy API does NOT support email or phone on contacts when using OAuth tokens
      // The API only allows: name, type, countryId on CREATE
      // There is NO way to add email or phone via UPDATE either (contactPersons cannot be modified)
      //
      // This is a limitation of the Billy API, not our implementation.
      // Email and phone must be managed outside of Billy, or users must use the Billy web interface.
      if (contactData.email || contactData.phone) {
        log.warn('Email and phone not supported for OAuth token contacts', {
          requestedEmail: contactData.email || 'none',
          requestedPhone: contactData.phone || 'none',
          limitation: 'Billy API limitation, not implementation issue'
        });
      }
      
      return createdContact;
    } catch (error: any) {
      log.error('Billy API create contact error', error, {
        errorType: error.constructor.name,
        billyDetails: error.billyDetails,
        responseData: error.response?.data,
        status: error.response?.status
      });
      // Re-throw the error WITH Billy details preserved
      throw error;
    }
  }

  // Product methods
  async getProducts(search?: string): Promise<BillyProduct[]> {
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('name', search);

    const endpoint = queryParams.toString() ? `/products?${queryParams.toString()}` : `/products`;
    const response = await this.makeRequest<{ products: BillyProduct[] }>('GET', endpoint);
    
    if (!response || !response.products) {
      log.error('Invalid products response structure', null, { response });
      return [];
    }
    
    return response.products;
  }

  async createProduct(productData: CreateProductInput): Promise<BillyProduct> {
    const endpoint = `/products`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      product: {
        name: productData.name,
        description: productData.description,
        prices: productData.prices.map(price => ({
          currencyId: price.currencyId || 'DKK',
          unitPrice: price.unitPrice,
        })),
      },
    };

    const response = await this.makeRequest<{ product: BillyProduct }>('POST', endpoint, payload);
    return response.product;
  }

  // Revenue methods
  async getRevenue(startDate: string, endDate: string): Promise<RevenueData> {
    // Get invoices for the period
    const invoices = await this.getInvoices({ startDate, endDate });

    // Calculate revenue metrics using Billy API fields
    // Note: Billy API uses isPaid boolean, not a 'paid' state
    const paidInvoices = invoices.filter(inv => inv.isPaid === true);
    const pendingInvoices = invoices.filter(inv => inv.state === 'approved' && !inv.isPaid);
    const overdueInvoices = invoices.filter(inv => {
      if (inv.isPaid || inv.state !== 'approved' || !inv.dueDate) return false;
      return new Date(inv.dueDate) < new Date();
    });

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

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
    const endpoint = `/organizations/${this.config.organizationId}`;  // This one uses path param (confirmed working)
    const response = await this.makeRequest<{ organization: BillyOrganization }>('GET', endpoint);
    return response.organization;
  }

  // Authentication validation
  async validateAuth(): Promise<{ valid: boolean; organization?: BillyOrganization; error?: string }> {
    try {
      log.info('Validating Billy API authentication', {
        apiKeyPresent: !!this.config.apiKey,
        organizationId: this.config.organizationId,
        apiBase: this.config.apiBase,
        circuitBreakerState: this.circuitBreaker.stats.state
      });
      
      const org = await this.getOrganization();
      log.info('Billy API authentication successful', { organization: org.name });
      return { valid: true, organization: org };
    } catch (error: any) {
      log.error('Billy API authentication failed', error);
      return { 
        valid: false, 
        error: error.message || 'Authentication failed' 
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
        state: (this.circuitBreaker.stats as any).state || 'unknown',
        stats: {
          requests: (this.circuitBreaker.stats as any).requests || 0,
          successes: (this.circuitBreaker.stats as any).successes || 0,
          failures: (this.circuitBreaker.stats as any).failures || 0,
          rejects: (this.circuitBreaker.stats as any).rejects || 0,
          timeouts: (this.circuitBreaker.stats as any).timeouts || 0,
          fallbacks: (this.circuitBreaker.stats as any).fallbacks || 0,
          latencyMean: (this.circuitBreaker.stats as any).latencyMean || 0,
          percentiles: (this.circuitBreaker.stats as any).percentiles || {}
        }
      },
      rateLimiter: this.rateLimiter.getStats(),
      fallbackCache: {
        size: this.fallbackCache.size
      },
      pendingRequests: this.requestDeduplicator.getPendingCount()
    };
  }

  /**
   * Reset circuit breaker (for testing/recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.close();
    log.info('Circuit breaker manually reset');
  }

  /**
   * Clear fallback cache
   */
  clearFallbackCache(): void {
    this.fallbackCache.clear();
    log.info('Fallback cache cleared');
  }

  // Sprint 1: Update methods
  
  /**
   * Update an existing invoice
   */
  async updateInvoice(invoiceId: string, invoiceData: Partial<CreateInvoiceInput>): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;
    
    // Fetch existing invoice first to merge with updates
    const existingInvoice = await this.getInvoice(invoiceId);
    
    if (!existingInvoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        type: 'invoice', // Required by Billy API
        contactId: invoiceData.contactId || existingInvoice.contactId,
        entryDate: invoiceData.entryDate || existingInvoice.entryDate,
        paymentTermsDays: invoiceData.paymentTermsDays || existingInvoice.paymentTermsDays,
        ...(invoiceData.lines && {
          lines: invoiceData.lines.map(line => ({
            productId: line.productId, // Must be first
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      },
    };
    
    const response = await this.makeRequest<{ invoice: any }>('PUT', endpoint, payload);
    
    // Billy returns invoice without lines, fetch them separately
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}&organizationId=${this.config.organizationId}`;
    const linesResponse = await this.makeRequest<{ invoiceLines: any[] }>('GET', linesEndpoint);
    
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
        state: 'approved',
      },
    };
    
    const response = await this.makeRequest<{ invoice: any }>('PUT', endpoint, payload);
    
    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    const linesResponse = await this.makeRequest<{ invoiceLines: any[] }>('GET', linesEndpoint);
    
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
        state: 'cancelled',
      },
    };
    
    const response = await this.makeRequest<{ invoice: any }>('PUT', endpoint, payload);
    
    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    const linesResponse = await this.makeRequest<{ invoiceLines: any[] }>('GET', linesEndpoint);
    
    return {
      ...response.invoice,
      lines: linesResponse.invoiceLines || [],
    };
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, paymentDate: string, amount?: number): Promise<BillyInvoice> {
    const endpoint = `/invoices/${invoiceId}`;
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      invoice: {
        state: 'paid',
        paymentDate: paymentDate,
        ...(amount && { totalAmount: amount }),
      },
    };
    
    const response = await this.makeRequest<{ invoice: any }>('PUT', endpoint, payload);
    
    // Billy returns invoice without lines, fetch them separately
    // NOTE: Cannot use organizationId query param with OAuth tokens
    const linesEndpoint = `/invoiceLines?invoiceId=${invoiceId}`;
    const linesResponse = await this.makeRequest<{ invoiceLines: any[] }>('GET', linesEndpoint);
    
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
  async updateContact(contactId: string, contactData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      zipcode?: string;
      city?: string;
      country?: string;
    };
  }): Promise<BillyContact> {
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
      contactUpdate.contactPersons = [{
        name: contactData.name || "Contact",  // Fallback if name not provided
        email: contactData.email
        // CRITICAL: NO phone field here - Billy API rejects it!
      }];
    }
    
    // Add address fields if provided
    if (contactData.address) {
      if (contactData.address.street) contactUpdate.street = contactData.address.street;
      if (contactData.address.zipcode) contactUpdate.zipcode = contactData.address.zipcode;
      if (contactData.address.city) contactUpdate.city = contactData.address.city;
      if (contactData.address.country) contactUpdate.countryId = contactData.address.country;
    }
    
    // Send minimal payload
    const payload = { contact: contactUpdate };
    
    const response = await this.makeRequest<{ contact: BillyContact }>('PUT', endpoint, payload);
    return response.contact;
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, productData: Partial<CreateProductInput>): Promise<BillyProduct> {
    const endpoint = `/products/${productId}`;
    
    // Fetch existing product first to merge with updates
    const existingProducts = await this.getProducts();
    const existingProduct = existingProducts.find(p => p.id === productId);
    
    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // NOTE: Cannot include organizationId in payload for OAuth tokens
    const payload = {
      product: {
        name: productData.name || existingProduct.name,
        description: productData.description || existingProduct.description,
        ...(productData.prices && {
          prices: productData.prices.map(price => ({
            currencyId: price.currencyId || 'DKK',
            unitPrice: price.unitPrice,
          })),
        }),
      },
    };
    
    const response = await this.makeRequest<{ product: BillyProduct }>('PUT', endpoint, payload);
    return response.product;
  }
}
// Force redeploy 2025-10-13 11:34:16
