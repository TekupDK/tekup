/**
 * Token Usage Analysis Script
 *
 * Analyserer tokenforbrug i Billy API output ved at simulere realistiske datasæt
 * og sammenligne pretty-printed JSON vs. kompakt JSON.
 */

// Simuler realistiske datasæt
function generateSampleCustomers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `customer-${i + 1}`,
    contactNo: `CUST-${String(i + 1).padStart(4, "0")}`,
    name: `Customer Name ${i + 1} A/S`,
    street: `Street Address ${i + 1}`,
    zipcode: `${8000 + i}`,
    city: "Aarhus",
    countryId: "DK",
    phone: `+45 ${12345678 + i}`,
    contactPersons: [
      {
        name: `Contact Person ${i + 1}`,
        email: `contact${i + 1}@example.com`,
      },
    ],
  }));
}

function generateSampleInvoices(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `invoice-${i + 1}`,
    invoiceNo: `INV-${String(i + 1).padStart(4, "0")}`,
    state: i % 3 === 0 ? "approved" : i % 3 === 1 ? "draft" : "voided",
    contactId: `customer-${(i % 61) + 1}`,
    totalAmount: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
    currency: "DKK",
    entryDate: "2025-10-15",
    dueDate: "2025-11-15",
    isPaid: i % 2 === 0,
    balance: i % 2 === 0 ? 0 : Math.round(Math.random() * 5000 * 100) / 100,
  }));
}

function generateSampleProducts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    productNo: `PROD-${String(i + 1).padStart(4, "0")}`,
    name: `Product Name ${i + 1}`,
    description: `Detailed product description for product ${i + 1} with various features and specifications`,
    account: `4000`,
    prices: [
      {
        currencyId: "DKK",
        unitPrice: Math.round((Math.random() * 1000 + 100) * 100) / 100,
      },
    ],
  }));
}

// Estimer tokenforbrug baseret på karakterer (ca. 4 karakterer per token)
function estimateTokens(text: string): number {
  // OpenAI tokens er ca. 4 karakterer per token for engelsk tekst
  // JSON kan være lidt mere effektivt, så vi bruger en konservativ estimering
  return Math.ceil(text.length / 4);
}

// Analyse forskellige scenarier
interface AnalysisResult {
  scenario: string;
  itemCount: number;
  prettyPrinted: {
    size: number;
    tokens: number;
  };
  compact: {
    size: number;
    tokens: number;
  };
  reduction: {
    sizePercent: number;
    tokenPercent: number;
  };
}

function analyzeOutput(data: any, scenario: string): AnalysisResult {
  const prettyPrinted = JSON.stringify(data, null, 2);
  const compact = JSON.stringify(data);

  const prettySize = prettyPrinted.length;
  const compactSize = compact.length;
  const prettyTokens = estimateTokens(prettyPrinted);
  const compactTokens = estimateTokens(compact);

  const sizeReduction = ((prettySize - compactSize) / prettySize) * 100;
  const tokenReduction = ((prettyTokens - compactTokens) / prettyTokens) * 100;

  return {
    scenario,
    itemCount: Array.isArray(data.customers || data.invoices || data.products)
      ? (data.customers || data.invoices || data.products).length
      : 1,
    prettyPrinted: {
      size: prettySize,
      tokens: prettyTokens,
    },
    compact: {
      size: compactSize,
      tokens: compactTokens,
    },
    reduction: {
      sizePercent: sizeReduction,
      tokenPercent: tokenReduction,
    },
  };
}

// Kør analyser
console.log("🔍 Billy API Token Usage Analysis\n");
console.log("=".repeat(80));

const results: AnalysisResult[] = [];

// Scenario 1: 61 kunder (realistisk sæt)
const customers61 = generateSampleCustomers(61);
const customerResponse61 = {
  success: true,
  customers: customers61,
  count: customers61.length,
};
results.push(analyzeOutput(customerResponse61, "61 Customers"));

// Scenario 2: 100 fakturaer
const invoices100 = generateSampleInvoices(100);
const invoiceResponse100 = {
  success: true,
  message: `Found ${invoices100.length} invoices`,
  invoices: invoices100,
};
results.push(analyzeOutput(invoiceResponse100, "100 Invoices"));

// Scenario 3: 20 produkter (typisk)
const products20 = generateSampleProducts(20);
const productResponse20 = {
  success: true,
  count: products20.length,
  products: products20,
};
results.push(analyzeOutput(productResponse20, "20 Products"));

// Scenario 4: 10 kunder (lille liste)
const customers10 = generateSampleCustomers(10);
const customerResponse10 = {
  success: true,
  customers: customers10,
  count: customers10.length,
};
results.push(analyzeOutput(customerResponse10, "10 Customers"));

// Scenario 5: Enkelt faktura
const invoice1 = generateSampleInvoices(1)[0];
const invoiceResponse1 = {
  success: true,
  invoice: {
    id: invoice1.id,
    invoiceNo: invoice1.invoiceNo,
    state: invoice1.state,
    contactId: invoice1.contactId,
    totalAmount: invoice1.totalAmount,
    currency: invoice1.currency,
    entryDate: invoice1.entryDate,
    paymentDate: invoice1.dueDate,
    paymentTermsDays: 30,
    lines: [
      {
        id: "line-1",
        description: "Service delivery",
        quantity: 1,
        unitPrice: invoice1.totalAmount,
        amount: invoice1.totalAmount,
        productId: "product-1",
      },
    ],
  },
};
results.push(analyzeOutput(invoiceResponse1, "Single Invoice (detailed)"));

// Scenario 6: 200 fakturaer (stor liste)
const invoices200 = generateSampleInvoices(200);
const invoiceResponse200 = {
  success: true,
  message: `Found ${invoices200.length} invoices`,
  invoices: invoices200,
};
results.push(analyzeOutput(invoiceResponse200, "200 Invoices"));

// Print resultater
console.log("\n📊 Results:\n");

results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.scenario} (${result.itemCount} items)`);
  console.log(
    `   Pretty-printed: ${result.prettyPrinted.size.toLocaleString()} bytes, ~${result.prettyPrinted.tokens.toLocaleString()} tokens`
  );
  console.log(
    `   Compact:        ${result.compact.size.toLocaleString()} bytes, ~${result.compact.tokens.toLocaleString()} tokens`
  );
  console.log(
    `   Reduction:      ${result.reduction.sizePercent.toFixed(1)}% size, ${result.reduction.tokenPercent.toFixed(1)}% tokens`
  );
  console.log("");
});

// Sammenfatning
console.log("=".repeat(80));
console.log("\n📈 Summary:\n");

const avgSizeReduction =
  results.reduce((sum, r) => sum + r.reduction.sizePercent, 0) / results.length;
const avgTokenReduction =
  results.reduce((sum, r) => sum + r.reduction.tokenPercent, 0) /
  results.length;

console.log(`Average size reduction: ${avgSizeReduction.toFixed(1)}%`);
console.log(`Average token reduction: ${avgTokenReduction.toFixed(1)}%`);

const largestScenario = results.reduce((max, r) =>
  r.prettyPrinted.tokens > max.prettyPrinted.tokens ? r : max
);
console.log(`\nLargest scenario: ${largestScenario.scenario}`);
console.log(
  `  Current tokens: ~${largestScenario.prettyPrinted.tokens.toLocaleString()}`
);
console.log(
  `  Optimized tokens: ~${largestScenario.compact.tokens.toLocaleString()}`
);
console.log(
  `  Savings: ~${(largestScenario.prettyPrinted.tokens - largestScenario.compact.tokens).toLocaleString()} tokens`
);

console.log("\n💡 Recommendations:");
console.log("   1. Use compact JSON (remove null, 2) for all responses");
console.log("   2. Implement pagination for lists > 20 items");
console.log("   3. Add summarization for very large lists (>100 items)");
console.log("   4. Consider field filtering for list operations");
console.log("");

// Estimér besparelse for realistisk brug
const typicalDayUsage = {
  listCustomers: 10, // 10 calls med 61 kunder
  listInvoices: 20, // 20 calls med 50-100 fakturaer
  listProducts: 5, // 5 calls med 20 produkter
  getCustomer: 30, // 30 single customer lookups
  getInvoice: 50, // 50 single invoice lookups
};

const dailySavings =
  (results[0].prettyPrinted.tokens - results[0].compact.tokens) *
    typicalDayUsage.listCustomers +
  (results[1].prettyPrinted.tokens - results[1].compact.tokens) *
    typicalDayUsage.listInvoices +
  (results[2].prettyPrinted.tokens - results[2].compact.tokens) *
    typicalDayUsage.listProducts +
  (results[3].prettyPrinted.tokens - results[3].compact.tokens) *
    typicalDayUsage.getCustomer +
  (results[4].prettyPrinted.tokens - results[4].compact.tokens) *
    typicalDayUsage.getInvoice;

console.log("💰 Estimated daily token savings (with compact JSON):");
console.log(`   ~${Math.round(dailySavings).toLocaleString()} tokens/day`);
console.log(
  `   ~${Math.round(dailySavings * 30).toLocaleString()} tokens/month`
);
console.log("");
