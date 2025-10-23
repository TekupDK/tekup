// Test Billy.dk Operations in Production
// Tests real API calls through the deployed MCP server
import axios from 'axios';

const PRODUCTION_URL = 'https://tekup-billy.onrender.com';
const API_BASE = `${PRODUCTION_URL}/api/v1`;
const MCP_API_KEY = 'bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b';

async function testBillyOperations() {
    console.log('🧪 Testing Billy.dk Operations in Production');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allTestsPassed = true;

    // Test 1: List Invoices
    console.log('📋 Test 1: List Invoices (last 5)');
    try {
    const response = await axios.post(`${API_BASE}/tools/list_invoices`, {
      pageSize: 5,
    }, {
      headers: {
        'X-API-Key': MCP_API_KEY,
      },
      timeout: 30000,
    });        if (response.data.success) {
            console.log('✅ List Invoices successful');
            // Data is already an object, not a JSON string
            const data = response.data.data;
            console.log(`   Found: ${data.meta?.paging?.total || 0} total invoices`);
            console.log(`   Returned: ${data.invoices?.length || 0} invoices`);

            if (data.invoices && data.invoices.length > 0) {
                const invoice = data.invoices[0];
                console.log(`   First invoice: #${invoice.invoiceNo} - ${invoice.state}`);
                console.log(`   Amount: ${invoice.totalAmount} ${invoice.currencyId}`);
            }
        } else {
            console.log('❌ List Invoices failed:', response.data.error);
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ List Invoices error:', error.message);
        if (error.response?.data) {
            console.log('   Details:', error.response.data);
        }
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2: List Customers
    console.log('👥 Test 2: List Customers (first 3)');
    try {
    const response = await axios.post(`${API_BASE}/tools/list_customers`, {
      pageSize: 3,
    }, {
      headers: {
        'X-API-Key': MCP_API_KEY,
      },
      timeout: 30000,
    });        if (response.data.success) {
            console.log('✅ List Customers successful');
            // Data is already an object, not a JSON string
            const data = response.data.data;
            console.log(`   Found: ${data.meta?.paging?.total || 0} total customers`);
            console.log(`   Returned: ${data.contacts?.length || 0} customers`);

            if (data.contacts && data.contacts.length > 0) {
                data.contacts.forEach((contact: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${contact.name}`);
                });
            }
        } else {
            console.log('❌ List Customers failed:', response.data.error);
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ List Customers error:', error.message);
        if (error.response?.data) {
            console.log('   Details:', error.response.data);
        }
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3: List Products
    console.log('📦 Test 3: List Products (first 3)');
    try {
    const response = await axios.post(`${API_BASE}/tools/list_products`, {
      pageSize: 3,
    }, {
      headers: {
        'X-API-Key': MCP_API_KEY,
      },
      timeout: 30000,
    });        if (response.data.success) {
            console.log('✅ List Products successful');
            // Data is already an object, not a JSON string
            const data = response.data.data;
            console.log(`   Found: ${data.meta?.paging?.total || 0} total products`);
            console.log(`   Returned: ${data.products?.length || 0} products`);

            if (data.products && data.products.length > 0) {
                data.products.forEach((product: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${product.name} - ${product.salesPrice} ${product.account?.name || ''}`);
                });
            }
        } else {
            console.log('❌ List Products failed:', response.data.error);
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ List Products error:', error.message);
        if (error.response?.data) {
            console.log('   Details:', error.response.data);
        }
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 4: Get Revenue Data
    console.log('💰 Test 4: Get Revenue (current month)');
    try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

    const response = await axios.post(`${API_BASE}/tools/get_revenue`, {
      startDate,
      endDate,
    }, {
      headers: {
        'X-API-Key': MCP_API_KEY,
      },
      timeout: 30000,
    });        if (response.data.success) {
            console.log('✅ Get Revenue successful');
            // Data is already an object, not a JSON string
            const data = response.data.data;
            console.log(`   Period: ${startDate} to ${endDate}`);
            console.log(`   Total Paid: ${data.totalPaid || 0} DKK`);
            console.log(`   Total Pending: ${data.totalPending || 0} DKK`);
            console.log(`   Paid Invoices: ${data.paidInvoiceCount || 0}`);
            console.log(`   Pending Invoices: ${data.pendingInvoiceCount || 0}`);
        } else {
            console.log('❌ Get Revenue failed:', response.data.error);
            allTestsPassed = false;
        }
    } catch (error: any) {
        console.log('❌ Get Revenue error:', error.message);
        if (error.response?.data) {
            console.log('   Details:', error.response.data);
        }
        allTestsPassed = false;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Server: ${PRODUCTION_URL}`);
    console.log(`Status: ${allTestsPassed ? '✅ ALL OPERATIONS WORKING' : '❌ SOME OPERATIONS FAILED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allTestsPassed) {
        console.log('🎉 Production Billy.dk integration is FULLY FUNCTIONAL!');
        console.log('\n📋 Verified:');
        console.log('   ✓ Invoice listing');
        console.log('   ✓ Customer listing');
        console.log('   ✓ Product listing');
        console.log('   ✓ Revenue calculation');
        console.log('\n🚀 Ready for production use!');
    } else {
        console.log('⚠️  Some operations failed. Check logs and credentials.');
    }

    process.exit(allTestsPassed ? 0 : 1);
}

testBillyOperations().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
});
