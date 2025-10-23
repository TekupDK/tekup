// Quick test script for Billy API with real credentials
import axios from 'axios';

const BILLY_API_KEY = 'REDACTED_BILLY_API_KEY';
const BILLY_ORG_ID = 'pmf9tU56RoyZdcX3k69z1g';

async function testBillyAPI() {
    console.log('🧪 Testing Billy.dk API with Rendetalje credentials...\n');

    try {
        // Test 1: List invoices
        console.log('📋 Test 1: List Invoices');
        const invoicesResponse = await axios.get('https://api.billysbilling.com/v2/invoices', {
            headers: { 'X-Access-Token': BILLY_API_KEY },
            params: {
                organizationId: BILLY_ORG_ID,
                pageSize: 5,
            },
        });

        const invoices = invoicesResponse.data.invoices;
        console.log(`✅ Found ${invoicesResponse.data.meta.paging.total} invoices`);
        console.log(`   First invoice: ${invoices[0]?.invoiceNo || 'N/A'} - ${invoices[0]?.state || 'N/A'}\n`);

        // Test 2: List contacts
        console.log('👥 Test 2: List Contacts');
        const contactsResponse = await axios.get('https://api.billysbilling.com/v2/contacts', {
            headers: { 'X-Access-Token': BILLY_API_KEY },
            params: {
                organizationId: BILLY_ORG_ID,
                pageSize: 3,
            },
        });

        const contacts = contactsResponse.data.contacts;
        console.log(`✅ Found ${contactsResponse.data.meta.paging.total} contacts`);
        console.log(`   First contact: ${contacts[0]?.name || 'N/A'}\n`);

        // Test 3: List products
        console.log('📦 Test 3: List Products');
        const productsResponse = await axios.get('https://api.billysbilling.com/v2/products', {
            headers: { 'X-Access-Token': BILLY_API_KEY },
            params: {
                organizationId: BILLY_ORG_ID,
                pageSize: 3,
            },
        });

        const products = productsResponse.data.products;
        console.log(`✅ Found ${productsResponse.data.meta.paging.total} products`);
        console.log(`   First product: ${products[0]?.name || 'N/A'}\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All Billy.dk API tests passed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Organization: Rendetalje`);
        console.log(`Organization ID: ${BILLY_ORG_ID}`);
        console.log(`Invoices: ${invoicesResponse.data.meta.paging.total}`);
        console.log(`Contacts: ${contactsResponse.data.meta.paging.total}`);
        console.log(`Products: ${productsResponse.data.meta.paging.total}`);

    } catch (error: any) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testBillyAPI();
