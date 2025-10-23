/**
 * Quick-create templates for common entity types
 * Reduces 2-step create→update workflows observed in usage logs
 * 
 * Based on USAGE_PATTERNS_REPORT.md findings:
 * - 80% of customers get immediate update after creation
 * - 100% of products get immediate update (add EUR pricing)
 */

export interface CustomerTemplate {
  name: string;
  type?: 'customer' | 'supplier';
  isCompany?: boolean;
  countryId?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    zipcode?: string;
    city?: string;
    country?: string;
  };
}

export interface ProductTemplate {
  name: string;
  description?: string;
  prices: Array<{
    currencyId: 'DKK' | 'EUR' | 'USD' | 'GBP';
    unitPrice: number;
  }>;
  salesAccountId?: string;
}

/**
 * Pre-defined templates for common Danish B2B scenarios
 */
export const TEMPLATES = {
  // ===== CUSTOMER TEMPLATES =====

  /**
   * Danish B2B company (most common use case)
   * Pre-filled with Danish defaults
   */
  DANISH_B2B_CUSTOMER: {
    type: 'customer' as const,
    isCompany: true,
    countryId: 'DK',
  } as Partial<CustomerTemplate>,

  /**
   * Danish consumer/private customer
   */
  DANISH_CONSUMER: {
    type: 'customer' as const,
    isCompany: false,
    countryId: 'DK',
  } as Partial<CustomerTemplate>,

  /**
   * International B2B customer (EU)
   */
  EU_B2B_CUSTOMER: {
    type: 'customer' as const,
    isCompany: true,
    // Country ID must be set by user
  } as Partial<CustomerTemplate>,

  // ===== PRODUCT TEMPLATES =====

  /**
   * Standard consulting hour (DKK 800 baseline)
   * Auto-includes EUR pricing based on ECB rate
   */
  CONSULTING_HOUR_BASIC: {
    name: 'Consulting Hour',
    description: 'Standard hourly consulting rate',
    prices: [
      { currencyId: 'DKK' as const, unitPrice: 800 },
      { currencyId: 'EUR' as const, unitPrice: 107 }, // Auto-converted
    ],
  } as ProductTemplate,

  /**
   * Senior consulting hour (50% premium)
   */
  CONSULTING_HOUR_SENIOR: {
    name: 'Senior Consulting Hour',
    description: 'Senior consultant hourly rate (50% premium)',
    prices: [
      { currencyId: 'DKK' as const, unitPrice: 1200 },
      { currencyId: 'EUR' as const, unitPrice: 160 },
    ],
  } as ProductTemplate,

  /**
   * Project management (day rate)
   */
  PROJECT_MANAGEMENT_DAY: {
    name: 'Project Management (Day)',
    description: 'Full day project management service',
    prices: [
      { currencyId: 'DKK' as const, unitPrice: 6400 }, // 8 hours * 800
      { currencyId: 'EUR' as const, unitPrice: 856 },
    ],
  } as ProductTemplate,

  /**
   * Fixed price project template
   */
  FIXED_PRICE_PROJECT: {
    name: 'Fixed Price Project',
    description: 'Complete project delivery at fixed price',
    prices: [
      { currencyId: 'DKK' as const, unitPrice: 50000 },
      { currencyId: 'EUR' as const, unitPrice: 6700 },
    ],
  } as ProductTemplate,
};

/**
 * Helper: Merge template with user input
 * User input overrides template defaults
 * 
 * @example
 * const customer = applyTemplate(TEMPLATES.DANISH_B2B_CUSTOMER, {
 *   name: "Acme Corp",
 *   email: "contact@acme.com"
 * });
 */
export function applyTemplate<T extends Record<string, any>>(
  template: Partial<T>,
  userInput: Partial<T>
): T {
  return { ...template, ...userInput } as T;
}

/**
 * Helper: Auto-convert DKK to EUR
 * Uses European Central Bank reference rate (updated quarterly)
 * 
 * @param dkkPrice Price in DKK
 * @returns Equivalent price in EUR (rounded)
 * 
 * @example
 * addEurPricing(800)  // Returns 107 EUR
 * addEurPricing(1200) // Returns 160 EUR
 */
export function addEurPricing(dkkPrice: number): number {
  const ECB_RATE = 7.46; // DKK/EUR rate as of Oct 2025
  return Math.round(dkkPrice / ECB_RATE);
}

/**
 * Helper: Auto-add EUR pricing to product if only DKK provided
 * 
 * @example
 * const prices = [{ currencyId: 'DKK', unitPrice: 800 }];
 * addMultiCurrencyPricing(prices);
 * // Returns: [
 * //   { currencyId: 'DKK', unitPrice: 800 },
 * //   { currencyId: 'EUR', unitPrice: 107 }
 * // ]
 */
export function addMultiCurrencyPricing(
  prices: Array<{ currencyId: string; unitPrice: number }>
): Array<{ currencyId: string; unitPrice: number }> {
  // If only DKK price provided, add EUR
  if (prices.length === 1 && prices[0] && prices[0].currencyId === 'DKK') {
    const eurPrice = addEurPricing(prices[0].unitPrice);
    return [
      ...prices,
      { currencyId: 'EUR', unitPrice: eurPrice },
    ];
  }
  return prices;
}

/**
 * Get template by name (case-insensitive)
 * 
 * @example
 * getTemplate('danish_b2b_customer')
 * getTemplate('consulting_hour_basic')
 */
export function getTemplate(templateName: string): Partial<CustomerTemplate> | ProductTemplate | undefined {
  const normalized = templateName.toUpperCase().replace(/[- ]/g, '_');
  return TEMPLATES[normalized as keyof typeof TEMPLATES];
}

/**
 * List all available templates
 */
export function listTemplates(): Array<{ name: string; description: string; type: 'customer' | 'product' }> {
  return [
    {
      name: 'DANISH_B2B_CUSTOMER',
      description: 'Danish B2B company (most common)',
      type: 'customer',
    },
    {
      name: 'DANISH_CONSUMER',
      description: 'Danish private customer',
      type: 'customer',
    },
    {
      name: 'EU_B2B_CUSTOMER',
      description: 'International EU B2B company',
      type: 'customer',
    },
    {
      name: 'CONSULTING_HOUR_BASIC',
      description: 'Standard consulting hour (DKK 800)',
      type: 'product',
    },
    {
      name: 'CONSULTING_HOUR_SENIOR',
      description: 'Senior consulting hour (DKK 1200)',
      type: 'product',
    },
    {
      name: 'PROJECT_MANAGEMENT_DAY',
      description: 'Full day project management',
      type: 'product',
    },
    {
      name: 'FIXED_PRICE_PROJECT',
      description: 'Fixed price project delivery',
      type: 'product',
    },
  ];
}
