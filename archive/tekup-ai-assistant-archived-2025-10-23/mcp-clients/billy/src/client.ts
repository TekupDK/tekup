/**
 * Billy MCP Client
 * HTTP client for Tekup-Billy MCP Server
 * 
 * Following TekUp Unified Code Standards:
 * - Class-based axios pattern (RenOSApiClient)
 * - Interceptors for auth + error handling
 * - Generic type-safe methods
 * - Enhanced error logging
 * - 30s default timeout
 * 
 * @author TekUp Team
 * @version 1.0.0
 */

// External dependencies
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Internal modules (to be created)
import { BillyConfig, getBillyMCPConfig } from './config.js';
import { logger } from './logger.js';

// Types
import {
  BillyInvoice,
  BillyCustomer,
  BillyProduct,
  MCPToolRequest,
  MCPToolResponse,
  BillyErrorDetails
} from './types.js';

/**
 * Enhanced error class for Billy API errors
 */
export class BillyApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: BillyErrorDetails
  ) {
    super(message);
    this.name = 'BillyApiError';
  }
}

/**
 * Billy MCP Client
 * Connects to Tekup-Billy HTTP MCP server with production-ready features
 */
export class BillyMCPClient {
  private client: AxiosInstance;
  private config: BillyConfig;
  private requestCount: number = 0;
  private lastReset: number = Date.now();

  constructor(config?: BillyConfig) {
    // Use provided config or load from environment
    this.config = config || getBillyMCPConfig();

    // Create axios instance with TekUp standards
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000, // 30s default
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TekUp-AI-Assistant/1.0'
      }
    });

    // Setup interceptors following RenOS pattern
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   * Following TekUp standard patterns
   */
  private setupInterceptors(): void {
    // Request interceptor - Add authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add X-API-Key header (Billy MCP standard)
        if (this.config.apiKey) {
          config.headers['X-API-Key'] = this.config.apiKey;
        }

        // Log outgoing request
        logger.debug('Billy MCP Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasAuth: !!this.config.apiKey
        });

        // Track rate limiting client-side
        this.trackRequest();

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful response
        logger.debug('Billy MCP Response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length
        });

        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors with enhanced context
   * Following Tekup-Billy error enhancement pattern
   */
  private handleError(error: AxiosError): Promise<never> {
    // Extract error details (Billy pattern)
    const errorDetails: BillyErrorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      // Billy-specific error fields
      billyErrorCode: (error.response?.data as any)?.errorCode || (error.response?.data as any)?.code,
      billyErrorMessage: (error.response?.data as any)?.message || (error.response?.data as any)?.error,
      validationErrors: (error.response?.data as any)?.errors || (error.response?.data as any)?.meta?.fieldErrors
    };

    // Structured logging (Winston pattern)
    logger.error('Billy MCP API Error', {
      error: error.message,
      details: errorDetails
    });

    // Create enhanced error
    const enhancedError = new BillyApiError(
      (error.response?.data as any)?.message || 
      (error.response?.data as any)?.error || 
      error.message || 
      'Billy MCP request failed',
      error.response?.status || 500,
      errorDetails
    );

    return Promise.reject(enhancedError);
  }

  /**
   * Track requests for client-side rate limit awareness
   * Billy server has 100 req/15min limit
   */
  private trackRequest(): void {
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    // Reset counter every 15 minutes
    if (now - this.lastReset > fifteenMinutes) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    this.requestCount++;

    // Warn if approaching limit
    if (this.requestCount > 90) {
      logger.warn('Approaching Billy MCP rate limit', {
        requestCount: this.requestCount,
        limit: 100,
        resetIn: fifteenMinutes - (now - this.lastReset)
      });
    }
  }

  /**
   * Call a Billy MCP tool
   * @param toolName - Name of the tool to invoke
   * @param args - Tool arguments
   * @returns Tool response data
   */
  async callTool<T = any>(toolName: string, args?: Record<string, any>): Promise<T> {
    try {
      const request: MCPToolRequest = {
        tool: toolName,
        arguments: args || {}
      };

      const response = await this.post<MCPToolResponse<T>>('/api/v1/tools/call', request);

      if (!response.success) {
        throw new Error(response.error || 'Tool execution failed');
      }

      return response.data as T;
    } catch (error) {
      logger.error(`Billy tool '${toolName}' failed`, {
        toolName,
        args,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * List all available Billy MCP tools
   */
  async listTools(): Promise<string[]> {
    const response = await this.post<{ tools: string[] }>('/api/v1/tools/list');
    return response.tools;
  }

  /**
   * Health check - verify Billy MCP server is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/health');
      return response.status === 'healthy';
    } catch (error) {
      logger.error('Billy MCP health check failed', { error });
      return false;
    }
  }

  // ========================================================================
  // Generic HTTP Methods (Type-Safe)
  // ========================================================================

  /**
   * Generic GET request
   * @param url - Endpoint URL
   * @returns Response data
   */
  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url);
    return response.data;
  }

  /**
   * Generic POST request
   * @param url - Endpoint URL
   * @param data - Request body
   * @returns Response data
   */
  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   * @param url - Endpoint URL
   * @param data - Request body
   * @returns Response data
   */
  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   * @param url - Endpoint URL
   * @returns Response data
   */
  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }
}

// Export singleton instance for easy usage
export const billyClient = new BillyMCPClient();

