#!/usr/bin/env tsx
/**
 * Quick test script for Billy MCP v3.0 hierarchical tools
 */

import { BillyClient } from './src/billy-client.js';
import { getBillyConfig } from './src/config.js';

async function testV3Tools() {
  console.log('🚀 Testing Billy MCP v3.0 Hierarchical Tools\n');

  try {
    // Initialize client
    const config = getBillyConfig();
    const client = new BillyClient(config);

    console.log('✅ BillyClient initialized\n');

    // Test Level 1: Summary Tools
    console.log('📊 LEVEL 1: Summary Tools (10-50 tokens)\n');

    console.log('1. Testing get_invoice_summary...');
    const invoiceSummary = await client.getInvoiceSummary();
    console.log('   Result:', JSON.stringify(invoiceSummary, null, 2));
    console.log(`   ✅ Token usage: ${invoiceSummary._tokenUsage} tokens\n`);

    console.log('2. Testing get_customer_summary...');
    const customerSummary = await client.getCustomerSummary();
    console.log('   Result:', JSON.stringify(customerSummary, null, 2));
    console.log(`   ✅ Token usage: ${customerSummary._tokenUsage} tokens\n`);

    console.log('3. Testing get_business_overview...');
    const businessOverview = await client.getBusinessOverview();
    console.log('   Result:', JSON.stringify(businessOverview, null, 2));
    console.log(`   ✅ Token usage: ${businessOverview._tokenUsage} tokens\n`);

    // Test Level 2: Filtered Lists
    console.log('📋 LEVEL 2: Filtered Lists (100-500 tokens)\n');

    console.log('4. Testing list_unpaid_invoices (limit: 5)...');
    const unpaidInvoices = await client.listUnpaidInvoices({ limit: 5 });
    console.log(`   Found: ${unpaidInvoices._total} unpaid invoices`);
    console.log(`   Returned: ${unpaidInvoices.invoices.length} invoices`);
    console.log(`   Has more: ${unpaidInvoices._hasMore}`);
    console.log(`   ✅ Token usage: ${unpaidInvoices._tokenUsage} tokens\n`);

    console.log('5. Testing search_customers (query: "Peder")...');
    const customerSearch = await client.searchCustomers({ query: 'Peder', limit: 3 });
    console.log(`   Found: ${customerSearch._total} customers`);
    console.log(`   Exact match: ${customerSearch._exactMatch}`);
    if (customerSearch.customers.length > 0) {
      console.log(`   Top match: ${customerSearch.customers[0].name} (score: ${customerSearch.customers[0]._matchScore})`);
    }
    console.log(`   ✅ Token usage: ${customerSearch._tokenUsage} tokens\n`);

    // Test Level 3: Detailed Retrieval (only if we have data)
    if (unpaidInvoices.invoices.length > 0) {
      console.log('📖 LEVEL 3: Detailed Retrieval (500-2000 tokens)\n');

      console.log('6. Testing get_invoice_details...');
      const firstInvoice = unpaidInvoices.invoices[0];
      const invoiceDetails = await client.getInvoiceDetails({ invoiceId: firstInvoice.id });
      console.log(`   Invoice: ${invoiceDetails.invoice.invoiceNo}`);
      console.log(`   Customer: ${invoiceDetails.invoice.customer.name}`);
      console.log(`   Lines: ${invoiceDetails.invoice.lines.length} line items`);
      console.log(`   Related invoices: ${invoiceDetails._relatedInvoices.length}`);
      console.log(`   ✅ Token usage: ${invoiceDetails._tokenUsage} tokens\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Token Usage Summary:');
    console.log(`  Level 1 (Summaries): ${invoiceSummary._tokenUsage + customerSummary._tokenUsage + businessOverview._tokenUsage} tokens`);
    console.log(`  Level 2 (Lists): ${unpaidInvoices._tokenUsage + customerSearch._tokenUsage} tokens`);
    console.log('  Level 3 (Details): ~500 tokens per call');
    console.log('\n🎯 v3.0 Hierarchical Tools Working Correctly!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testV3Tools().catch(console.error);
