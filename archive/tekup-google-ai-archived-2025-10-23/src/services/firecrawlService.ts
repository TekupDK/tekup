/**
 * Firecrawl Service - Web Scraping & Data Extraction
 * 
 * Provides clean abstractions for scraping websites and extracting structured data.
 * Used for: Lead parsing, competitor monitoring, company enrichment.
 * 
 * @see docs/FIRECRAWL_USE_CASES_RENOS.md for use cases
 */

import { env } from '../env';
import { logger } from '../logger';
import { IntegrationError } from '../errors';

// ============================================================================
// Types
// ============================================================================

export interface ScrapeOptions {
  /**
   * Output format for scraped content
   * - markdown: Clean markdown text (default)
   * - html: Raw HTML
   * - links: Extract all links
   * - screenshot: Take screenshot (uses credits)
   */
  formats?: ('markdown' | 'html' | 'links' | 'screenshot')[];

  /**
   * Only scrape specific HTML elements
   * CSS selectors: '.class', '#id', 'div.content'
   */
  onlyMainContent?: boolean;

  /**
   * Include metadata (title, description, og tags)
   */
  includeMetadata?: boolean;

  /**
   * Wait for JavaScript to render (slower, more credits)
   */
  waitForSelector?: string;

  /**
   * Timeout in milliseconds (default: 30000)
   */
  timeout?: number;
}

export interface ExtractOptions {
  /**
   * JSON schema for structured data extraction
   * Example:
   * {
   *   customer_name: "string",
   *   email: "string",
   *   phone: "string",
   *   square_meters: "number"
   * }
   */
  schema: Record<string, string | { type: string; description?: string }>;

  /**
   * Additional prompt to guide extraction
   */
  prompt?: string;
}

export interface ScrapeResult {
  success: boolean;
  markdown?: string;
  html?: string;
  links?: string[];
  screenshot?: string; // Base64 encoded
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    language?: string;
    sourceURL: string;
  };
  error?: string;
  creditsUsed: number;
}

export interface ExtractResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed: number;
}

// ============================================================================
// Firecrawl Service
// ============================================================================

class FirecrawlService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.firecrawl.dev/v1';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor() {
    this.apiKey = env.FIRECRAWL_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('FIRECRAWL_API_KEY not set - Firecrawl features disabled');
    }
  }

  /**
   * Check if Firecrawl is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Scrape a website and return markdown/html content
   * 
   * @example
   * ```typescript
   * const result = await firecrawlService.scrape('https://molly.dk/priser', {
   *   formats: ['markdown'],
   *   onlyMainContent: true
   * });
   * console.log(result.markdown);
   * ```
   */
  async scrape(
    url: string,
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult> {
    if (!this.isConfigured()) {
      throw new IntegrationError('Firecrawl API key not configured');
    }

    const {
      formats = ['markdown'],
      onlyMainContent = true,
      includeMetadata = true,
      timeout = 30000
    } = options;

    logger.info({ url, formats, onlyMainContent }, 'Firecrawl scraping');

    try {
      const response = await this.makeRequest('/scrape', {
        method: 'POST',
        body: JSON.stringify({
          url,
          formats,
          onlyMainContent,
          timeout,
          includeTags: includeMetadata ? ['title', 'meta', 'og'] : undefined,
          waitFor: options.waitForSelector ? { selector: options.waitForSelector } : undefined
        })
      });

      if (!response.success) {
        throw new IntegrationError(`Firecrawl scrape failed: ${response.error || 'Unknown error'}`);
      }

      const result: ScrapeResult = {
        success: true,
        markdown: response.data?.markdown,
        html: response.data?.html,
        links: response.data?.links,
        screenshot: response.data?.screenshot,
        metadata: response.data?.metadata ? {
          title: response.data.metadata.title,
          description: response.data.metadata.description,
          ogImage: response.data.metadata.ogImage,
          language: response.data.metadata.language,
          sourceURL: response.data.metadata.sourceURL || url
        } : undefined,
        creditsUsed: 1 // Firecrawl uses 1 credit per scrape
      };

      logger.info({
        url,
        contentLength: result.markdown?.length || result.html?.length || 0,
        creditsUsed: result.creditsUsed
      }, 'Firecrawl scrape successful');

      return result;
    } catch (error) {
      logger.error({ url, error }, 'Firecrawl scrape error');

      if (error instanceof IntegrationError) {
        throw error;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        creditsUsed: 0
      };
    }
  }

  /**
   * Extract structured data from a website using AI
   * 
   * @example
   * ```typescript
   * const result = await firecrawlService.extract('https://firma-abc.dk', {
   *   schema: {
   *     company_name: "string",
   *     industry: "string",
   *     employees: "number",
   *     services: { type: "array", description: "List of services offered" }
   *   },
   *   prompt: "Extract company information from the website"
   * });
   * console.log(result.data?.company_name);
   * ```
   */
  async extract<T = any>(
    url: string,
    options: ExtractOptions
  ): Promise<ExtractResult<T>> {
    if (!this.isConfigured()) {
      throw new IntegrationError('Firecrawl API key not configured');
    }

    logger.info({
      url,
      schemaKeys: Object.keys(options.schema)
    }, 'Firecrawl extracting');

    try {
      const response = await this.makeRequest('/extract', {
        method: 'POST',
        body: JSON.stringify({
          url,
          schema: options.schema,
          prompt: options.prompt,
          timeout: 30000
        })
      });

      if (!response.success) {
        throw new IntegrationError(`Firecrawl extract failed: ${response.error || 'Unknown error'}`);
      }

      const result: ExtractResult<T> = {
        success: true,
        data: response.data,
        creditsUsed: 2 // Extract uses 2 credits (scrape + AI)
      };

      logger.info({
        url,
        creditsUsed: result.creditsUsed
      }, 'Firecrawl extract successful');

      return result;
    } catch (error) {
      logger.error({ url, error }, 'Firecrawl extract error');

      if (error instanceof IntegrationError) {
        throw error;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        creditsUsed: 0
      };
    }
  }

  /**
   * Scrape HTML content and extract structured data
   * Useful for parsing email HTML or saved web pages
   * 
   * @example
   * ```typescript
   * const result = await firecrawlService.extractFromHTML(emailHTML, {
   *   schema: {
   *     customer_name: "string",
   *     email: "string",
   *     phone: "string"
   *   }
   * });
   * ```
   */
  async extractFromHTML<T = any>(
    html: string,
    options: ExtractOptions
  ): Promise<ExtractResult<T>> {
    // Note: Firecrawl doesn't have direct HTML extraction
    // We need to scrape via URL or use alternative approach
    // For now, we'll use Gemini directly for HTML parsing

    logger.warn('extractFromHTML called - Firecrawl requires URL. Consider using Gemini for HTML parsing.');

    throw new IntegrationError('Direct HTML extraction not supported. Use Gemini AI or provide URL.');
  }

  /**
   * Batch scrape multiple URLs in parallel
   * More efficient than sequential scraping
   * 
   * @example
   * ```typescript
   * const results = await firecrawlService.batchScrape([
   *   'https://molly.dk/priser',
   *   'https://renova.dk/priser',
   *   'https://hjemme.dk/priser'
   * ]);
   * ```
   */
  async batchScrape(
    urls: string[],
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult[]> {
    logger.info(`Firecrawl batch scraping ${urls.length} URLs`);

    // Respect rate limits: Max 10 concurrent requests
    const batchSize = 10;
    const results: ScrapeResult[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.scrape(url, options))
      );
      results.push(...batchResults);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < urls.length) {
        await this.sleep(500);
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Firecrawl batch scrape complete: ${successCount}/${urls.length} successful`);

    return results;
  }

  /**
   * Get Firecrawl account status (credits remaining, usage)
   * Note: This endpoint may not be available in all plans
   */
  async getAccountStatus(): Promise<{
    creditsRemaining: number;
    creditsUsed: number;
    plan: string;
  }> {
    if (!this.isConfigured()) {
      throw new IntegrationError('Firecrawl API key not configured');
    }

    try {
      const response = await this.makeRequest('/account', {
        method: 'GET'
      });

      return {
        creditsRemaining: response.creditsRemaining || 500,
        creditsUsed: response.creditsUsed || 0,
        plan: response.plan || 'free'
      };
    } catch (error) {
      logger.warn({ error }, 'Could not fetch Firecrawl account status');
      return {
        creditsRemaining: 500,
        creditsUsed: 0,
        plan: 'free'
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async makeRequest(
    endpoint: string,
    options: RequestInit & { retryCount?: number } = {}
  ): Promise<any> {
    const { retryCount = 0, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Retry on rate limit or server error
        if ((response.status === 429 || response.status >= 500) && retryCount < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retryCount);
          logger.warn({
            status: response.status,
            retryCount: retryCount + 1,
            delay
          }, 'Firecrawl request failed, retrying');

          await this.sleep(delay);
          return this.makeRequest(endpoint, { ...options, retryCount: retryCount + 1 });
        }

        throw new IntegrationError(
          `Firecrawl API error: ${response.status} - ${errorData.error || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        `Firecrawl request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const firecrawlService = new FirecrawlService();

