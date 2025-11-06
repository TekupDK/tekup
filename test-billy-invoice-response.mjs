/**
 * Test script to check actual Billy API invoice response
 * Usage: node test-billy-invoice-response.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.dev.template') });
dotenv.config({ path: join(__dirname, '.env') });

const BILLY_API_KEY = process.env.BILLY_API_KEY || "";
const BILLY_ORGANIZATION_ID = process.env.BILLY_ORGANIZATION_ID || "";
const BILLY_API_BASE = "https://api.billysbilling.com/v2";

async function billyRequest(endpoint, options = {}) {
  const url = `${BILLY_API_BASE}${endpoint}`;

  const headers = {
    "X-Access-Token": BILLY_API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(`\n📡 Calling: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Billy API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function testInvoiceResponse() {
  console.log('🧪 Testing Billy API Invoice Response Structure\n');
  console.log('=' .repeat(60));

  try {
    // Get invoices list
    const endpoint = BILLY_ORGANIZATION_ID
      ? `/invoices?organizationId=${encodeURIComponent(BILLY_ORGANIZATION_ID)}`
      : '/invoices';

    const data = await billyRequest(endpoint);

    console.log('\n✅ Successfully fetched invoices from Billy API\n');
    console.log(`📊 Total invoices: ${data.invoices?.length || 0}\n`);

    if (!data.invoices || data.invoices.length === 0) {
      console.log('⚠️  No invoices found in Billy account');
      console.log('\n💡 TIP: Create a test invoice in Billy.dk first');
      return;
    }

    // Get first invoice for detailed analysis
    const firstInvoice = data.invoices[0];

    console.log('=' .repeat(60));
    console.log('📄 FIRST INVOICE STRUCTURE:');
    console.log('=' .repeat(60));
    console.log(JSON.stringify(firstInvoice, null, 2));

    console.log('\n' + '=' .repeat(60));
    console.log('🔍 FIELD ANALYSIS:');
    console.log('=' .repeat(60));

    const fields = Object.keys(firstInvoice);
    console.log(`\n✅ Found ${fields.length} top-level fields:\n`);

    fields.forEach(field => {
      const value = firstInvoice[field];
      const type = Array.isArray(value) ? 'array' : typeof value;
      const preview = type === 'object' && value !== null
        ? `{ ${Object.keys(value).join(', ')} }`
        : type === 'array'
        ? `[${value.length} items]`
        : JSON.stringify(value);

      console.log(`  ${field.padEnd(25)} ${type.padEnd(10)} ${preview}`);
    });

    // Check for critical fields from API_DATA_ANALYSIS.md
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 CRITICAL FIELDS CHECK:');
    console.log('=' .repeat(60));

    const criticalFields = {
      'amount': 'Total amount incl. tax',
      'tax': 'Tax/VAT amount',
      'balance': 'Unpaid amount',
      'isPaid': 'Payment status flag',
      'downloadUrl': 'PDF download URL',
      'sentState': 'Send status (unsent/sent/resent)',
      'createdTime': 'Creation timestamp',
      'approvedTime': 'Approval timestamp',
      'currencyId': 'Currency reference',
      'contactMessage': 'Message to customer',
      'attachments': 'File attachments',
      'lines': 'Invoice line items'
    };

    console.log('');
    Object.entries(criticalFields).forEach(([field, description]) => {
      const exists = field in firstInvoice;
      const status = exists ? '✅' : '❌';
      const value = exists ?
        (typeof firstInvoice[field] === 'object' ?
          JSON.stringify(firstInvoice[field]).slice(0, 50) + '...' :
          firstInvoice[field])
        : 'MISSING';

      console.log(`  ${status} ${field.padEnd(20)} ${description.padEnd(30)} ${value}`);
    });

    // Check invoice lines structure if exists
    if (firstInvoice.lines && firstInvoice.lines.length > 0) {
      console.log('\n' + '=' .repeat(60));
      console.log('📝 INVOICE LINE STRUCTURE:');
      console.log('=' .repeat(60));
      console.log(JSON.stringify(firstInvoice.lines[0], null, 2));
    }

    console.log('\n' + '=' .repeat(60));
    console.log('💾 SAVING RESPONSE TO FILE...');
    console.log('=' .repeat(60));

    // Save full response to file for analysis
    const fs = await import('fs');
    const outputPath = join(__dirname, 'billy-api-response.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalInvoices: data.invoices.length,
      invoices: data.invoices,
      firstInvoiceFields: Object.keys(firstInvoice),
      criticalFieldsCheck: Object.fromEntries(
        Object.keys(criticalFields).map(field => [field, field in firstInvoice])
      )
    }, null, 2));

    console.log(`\n✅ Full response saved to: ${outputPath}`);

    console.log('\n' + '=' .repeat(60));
    console.log('📋 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`\n  • Total invoices: ${data.invoices.length}`);
    console.log(`  • Fields per invoice: ${fields.length}`);
    const missingCritical = Object.keys(criticalFields).filter(f => !(f in firstInvoice));
    console.log(`  • Missing critical fields: ${missingCritical.length}`);
    if (missingCritical.length > 0) {
      console.log(`    ⚠️  ${missingCritical.join(', ')}`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check BILLY_API_KEY in .env');
    console.error('  2. Verify API key has read permissions');
    console.error('  3. Ensure you have at least one invoice in Billy');
    throw error;
  }
}

// Run the test
testInvoiceResponse()
  .then(() => {
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
