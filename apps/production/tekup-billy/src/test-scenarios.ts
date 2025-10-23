/**
 * Test scenarios for different business types and use cases
 * This file contains predefined test data and scenarios to help users
 * understand how to use the Billy MCP server effectively
 */

import type { BillyClient } from './billy-client.js';
import { getBillyConfig } from './config.js';

// Test data for different business types
export const testScenarios = {
  // Freelancer/Consultant scenario
  freelancer: {
    name: "Freelance Web Developer",
    description: "Individual consultant providing web development services",
    testData: {
      customers: [
        {
          name: "Tech Startup A/S",
          contactPersonName: "Sarah Johnson",
          contactPersonEmail: "sarah@techstartup.dk",
          phone: "+45 12 34 56 78",
          street: "Innovation Street 123",
          cityText: "Copenhagen",
          zipcodeText: "2100",
          countryId: "DK",
          isCompany: true,
          companyNo: "12345678"
        },
        {
          name: "Local Restaurant",
          contactPersonName: "Marco Rossi",
          contactPersonEmail: "marco@restaurant.dk",
          phone: "+45 87 65 43 21",
          street: "Food Street 45",
          cityText: "Aarhus",
          zipcodeText: "8000",
          countryId: "DK",
          isCompany: true,
          companyNo: "87654321"
        }
      ],
      products: [
        {
          name: "Website Development",
          description: "Custom website development including design and implementation",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 50000
            }
          ]
        },
        {
          name: "Hourly Consultation",
          description: "Technical consultation and support per hour",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 750
            }
          ]
        },
        {
          name: "Website Maintenance",
          description: "Monthly website maintenance and updates",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 2500
            }
          ]
        }
      ],
      invoices: [
        {
          contactId: "", // Will be filled after customer creation
          productLines: [
            {
              productId: "", // Will be filled after product creation
              quantity: 1,
              unitPrice: 50000,
              description: "Website development for Tech Startup"
            }
          ],
          paymentTermsId: "1", // 30 days
          message: "Thank you for choosing our web development services!"
        }
      ]
    }
  },

  // Small retail business scenario
  retailBusiness: {
    name: "Small Retail Store",
    description: "Physical store selling various products to consumers",
    testData: {
      customers: [
        {
          name: "Regular Customer A/S",
          contactPersonName: "Lars Nielsen",
          contactPersonEmail: "lars@company.dk",
          phone: "+45 11 22 33 44",
          street: "Business Park 67",
          cityText: "Odense",
          zipcodeText: "5000",
          countryId: "DK",
          isCompany: true,
          companyNo: "11223344"
        },
        {
          name: "Anna Petersen",
          contactPersonName: "Anna Petersen",
          contactPersonEmail: "anna@email.dk",
          phone: "+45 55 66 77 88",
          street: "Home Street 12",
          cityText: "Aalborg",
          zipcodeText: "9000",
          countryId: "DK",
          isCompany: false
        }
      ],
      products: [
        {
          name: "Premium Coffee Beans",
          description: "High-quality arabica coffee beans, 1kg package",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 15000
            }
          ]
        },
        {
          name: "Ceramic Mug",
          description: "Handcrafted ceramic coffee mug",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 12500
            }
          ]
        },
        {
          name: "Gift Set",
          description: "Coffee and mug gift set with premium packaging",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 25000
            }
          ]
        }
      ],
      invoices: [
        {
          contactId: "",
          productLines: [
            {
              productId: "",
              quantity: 2,
              unitPrice: 15000,
              description: "Premium Coffee Beans - 2kg"
            },
            {
              productId: "",
              quantity: 1,
              unitPrice: 12500,
              description: "Ceramic Mug"
            }
          ],
          paymentTermsId: "2", // 14 days
          message: "Thank you for your purchase! Enjoy your premium coffee."
        }
      ]
    }
  },

  // Service-based business scenario
  serviceBusiness: {
    name: "Professional Services Firm",
    description: "Accounting and business consulting services",
    testData: {
      customers: [
        {
          name: "Manufacturing Company A/S",
          contactPersonName: "Peter Hansen",
          contactPersonEmail: "peter@manufacturing.dk",
          phone: "+45 99 88 77 66",
          street: "Industrial Road 234",
          cityText: "Esbjerg",
          zipcodeText: "6700",
          countryId: "DK",
          isCompany: true,
          companyNo: "99887766"
        },
        {
          name: "Startup Ventures ApS",
          contactPersonName: "Emma Andersen",
          contactPersonEmail: "emma@startup.dk",
          phone: "+45 44 33 22 11",
          street: "Innovation Hub 56",
          cityText: "Copenhagen",
          zipcodeText: "2300",
          countryId: "DK",
          isCompany: true,
          companyNo: "44332211"
        }
      ],
      products: [
        {
          name: "Monthly Bookkeeping",
          description: "Complete monthly bookkeeping service including VAT reporting",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 350000
            }
          ]
        },
        {
          name: "Annual Tax Preparation",
          description: "Complete annual tax return preparation and filing",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 125000
            }
          ]
        },
        {
          name: "Business Consultation",
          description: "Strategic business consultation per hour",
          account: "1000",
          prices: [
            {
              currencyId: "DKK",
              unitPrice: 150000
            }
          ]
        }
      ],
      invoices: [
        {
          contactId: "",
          productLines: [
            {
              productId: "",
              quantity: 1,
              unitPrice: 350000,
              description: "Monthly bookkeeping service - January 2024"
            }
          ],
          paymentTermsId: "1", // 30 days
          message: "Monthly bookkeeping completed. All documents are available in your portal."
        }
      ]
    }
  }
};

// Test workflow scenarios
export const testWorkflows = {
  // Complete customer lifecycle
  customerLifecycle: {
    name: "Complete Customer Lifecycle",
    description: "From customer creation to invoice payment tracking",
    steps: [
      "Create new customer",
      "Create products/services",
      "Generate invoice",
      "Send invoice to customer",
      "Track payment status",
      "Generate revenue report"
    ]
  },

  // Bulk operations
  bulkOperations: {
    name: "Bulk Operations",
    description: "Testing bulk creation and management",
    steps: [
      "Create multiple customers",
      "Create multiple products",
      "Generate multiple invoices",
      "Send all invoices",
      "Generate comprehensive revenue report"
    ]
  },

  // Error handling
  errorHandling: {
    name: "Error Handling Scenarios",
    description: "Testing various error conditions",
    scenarios: [
      "Invalid customer data",
      "Missing required fields",
      "Duplicate entries",
      "Network timeouts",
      "Invalid date ranges"
    ]
  }
};

// Utility functions for running test scenarios
export class TestScenarioRunner {
  private client: BillyClient;
  private createdEntities: {
    customers: string[];
    products: string[];
    invoices: string[];
  } = {
      customers: [],
      products: [],
      invoices: []
    };

  constructor(client: BillyClient) {
    this.client = client;
  }

  /**
   * Run a complete test scenario for a specific business type
   */
  async runScenario(scenarioName: keyof typeof testScenarios): Promise<void> {
    const scenario = testScenarios[scenarioName];
    console.log(`\n🧪 Running test scenario: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}\n`);

    try {
      // Step 1: Create customers
      console.log("👥 Creating test customers...");
      const config = getBillyConfig();
      for (const customerData of scenario.testData.customers) {
        if (config.dryRun) {
          console.log(`[DRY RUN] Would create customer: ${customerData.name}`);
          this.createdEntities.customers.push(`mock-customer-${Date.now()}`);
        } else {
          const customer = await this.client.createContact(customerData as any);
          this.createdEntities.customers.push(customer.id);
          console.log(`✅ Created customer: ${customerData.name} (ID: ${customer.id})`);
        }
      }

      // Step 2: Create products
      console.log("\n📦 Creating test products...");
      for (const productData of scenario.testData.products) {
        if (config.dryRun) {
          console.log(`[DRY RUN] Would create product: ${productData.name}`);
          this.createdEntities.products.push(`mock-product-${Date.now()}`);
        } else {
          const product = await this.client.createProduct(productData);
          this.createdEntities.products.push(product.id);
          console.log(`✅ Created product: ${productData.name} (ID: ${product.id})`);
        }
      }

      // Step 3: Create invoices
      console.log("\n🧾 Creating test invoices...");
      for (let i = 0; i < scenario.testData.invoices.length; i++) {
        const invoiceData = scenario.testData.invoices[i];

        if (invoiceData) {
          // Update with created entity IDs
          invoiceData.contactId = this.createdEntities.customers[i] || this.createdEntities.customers[0] || '';
          invoiceData.productLines.forEach((line, index) => {
            line.productId = this.createdEntities.products[index] || this.createdEntities.products[0] || '';
          });

          if (config.dryRun) {
            console.log(`[DRY RUN] Would create invoice for customer: ${invoiceData.contactId}`);
            this.createdEntities.invoices.push(`mock-invoice-${Date.now()}`);
          } else {
            const invoice = await this.client.createInvoice(invoiceData as any);
            this.createdEntities.invoices.push(invoice.id);
            console.log(`✅ Created invoice: ${invoice.invoiceNo} (ID: ${invoice.id})`);
          }
        }
      }

      console.log(`\n🎉 Test scenario "${scenario.name}" completed successfully!`);
      this.printSummary();

    } catch (error) {
      console.error(`❌ Test scenario failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Clean up created test entities
   */
  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test entities...");

    const config = getBillyConfig();
    if (config.dryRun) {
      console.log("[DRY RUN] Would clean up all created entities");
      return;
    }

    // Note: Billy API might not have delete endpoints for all entities
    // This is a placeholder for cleanup logic
    console.log("⚠️  Manual cleanup may be required for created test entities");
    this.printSummary();
  }

  /**
   * Print summary of created entities
   */
  private printSummary(): void {
    console.log("\n📊 Test Summary:");
    console.log(`   Customers created: ${this.createdEntities.customers.length}`);
    console.log(`   Products created: ${this.createdEntities.products.length}`);
    console.log(`   Invoices created: ${this.createdEntities.invoices.length}`);

    if (this.createdEntities.customers.length > 0) {
      console.log(`   Customer IDs: ${this.createdEntities.customers.join(', ')}`);
    }
    if (this.createdEntities.products.length > 0) {
      console.log(`   Product IDs: ${this.createdEntities.products.join(', ')}`);
    }
    if (this.createdEntities.invoices.length > 0) {
      console.log(`   Invoice IDs: ${this.createdEntities.invoices.join(', ')}`);
    }
  }

  /**
   * Get created entity IDs for further testing
   */
  getCreatedEntities() {
    return { ...this.createdEntities };
  }
}

// Export utility function to run specific test scenarios
export async function runTestScenario(
  client: BillyClient,
  scenarioName: keyof typeof testScenarios
): Promise<TestScenarioRunner> {
  const runner = new TestScenarioRunner(client);
  await runner.runScenario(scenarioName);
  return runner;
}

// Export function to list available scenarios
export function listAvailableScenarios(): void {
  console.log("\n📋 Available Test Scenarios:");
  Object.entries(testScenarios).forEach(([key, scenario]) => {
    console.log(`   ${key}: ${scenario.name}`);
    console.log(`      ${scenario.description}`);
  });

  console.log("\n🔄 Available Workflows:");
  Object.entries(testWorkflows).forEach(([key, workflow]) => {
    console.log(`   ${key}: ${workflow.name}`);
    console.log(`      ${workflow.description}`);
  });
}